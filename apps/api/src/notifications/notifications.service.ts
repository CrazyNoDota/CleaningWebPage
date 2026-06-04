import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { renderOrderTemplate, type TemplateContext } from './templates/order-templates';
import type { Locale } from '../common/locale';
import type { NotificationChannelDriver } from './channels/types';
import {
  WhatsappStubChannel,
  TelegramStubChannel,
  EmailStubChannel,
} from './channels/stub-channels';
import { DeadDeviceTokenError, FcmChannel } from './channels/fcm-channel';
import { SmsChannel } from './channels/sms-channel';

interface DispatchInput {
  userId: string;
  kind: string;
  ctx: TemplateContext;
  payload: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);
  private readonly drivers: Map<NotificationChannel, NotificationChannelDriver>;

  constructor(
    private readonly prisma: PrismaService,
    push: FcmChannel,
    wa: WhatsappStubChannel,
    tg: TelegramStubChannel,
    email: EmailStubChannel,
    sms: SmsChannel,
  ) {
    this.drivers = new Map<NotificationChannel, NotificationChannelDriver>([
      [NotificationChannel.push, push],
      [NotificationChannel.whatsapp, wa],
      [NotificationChannel.telegram, tg],
      [NotificationChannel.email, email],
      [NotificationChannel.sms, sms],
    ]);
  }

  async dispatchToUser(input: DispatchInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        locale: true,
        telegramChatId: true,
        deviceTokens: true,
        notificationChannels: true,
      },
    });
    if (!user) {
      this.log.warn(`dispatch: user ${input.userId} not found, dropping`);
      return;
    }

    const tpl = renderOrderTemplate(input.kind, user.locale as Locale, input.ctx);
    if (!tpl) {
      // No template defined for this event — silent skip is by design.
      return;
    }

    // Walk preferred channels in order; first delivery wins.
    for (const channel of user.notificationChannels) {
      const driver = this.drivers.get(channel);
      if (!driver) continue;

      const recipient = driver.resolveRecipient(user);
      if (!recipient) {
        await this.recordAttempt({
          userId: user.id,
          kind: input.kind,
          channel,
          status: NotificationStatus.skipped,
          recipient: '',
          subject: tpl.subject,
          body: tpl.body,
          payload: input.payload,
          error: 'no recipient configured',
        });
        continue;
      }

      try {
        await driver.send({ recipient, subject: tpl.subject, body: tpl.body });
        await this.recordAttempt({
          userId: user.id,
          kind: input.kind,
          channel,
          status: NotificationStatus.sent,
          recipient,
          subject: tpl.subject,
          body: tpl.body,
          payload: input.payload,
          sentAt: new Date(),
        });
        return; // Stop on first success.
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.log.warn(`channel ${channel} failed for user ${user.id}: ${message}`);

        if (err instanceof DeadDeviceTokenError) {
          await this.pruneDeviceToken(user.id, err.token);
        }

        await this.recordAttempt({
          userId: user.id,
          kind: input.kind,
          channel,
          status: NotificationStatus.failed,
          recipient,
          subject: tpl.subject,
          body: tpl.body,
          payload: input.payload,
          error: message,
        });
      }
    }
  }

  /**
   * Admin-initiated push broadcast. Selects users by audience segment, sends a
   * push to each one's device token via FCM, and records one Notification row
   * per recipient (kind "admin.broadcast", grouped by a shared batchId).
   */
  async broadcastPush(input: {
    title: string;
    body: string;
    segment: 'all' | 'has_orders';
    phone?: string;
  }): Promise<{ batchId: string; recipients: number; sent: number; failed: number }> {
    const where: Prisma.UserWhereInput = {
      isActive: true,
      deletedAt: null,
      deviceTokens: { isEmpty: false },
    };
    if (input.phone) {
      where.phone = input.phone;
    } else if (input.segment === 'has_orders') {
      where.orders = { some: {} };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        email: true,
        telegramChatId: true,
        deviceTokens: true,
      },
    });

    const push = this.drivers.get(NotificationChannel.push)!;
    const batchId = randomUUID();
    const payload: Prisma.InputJsonValue = { batchId, title: input.title };
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const recipient = push.resolveRecipient(user);
      if (!recipient) continue;

      try {
        await push.send({ recipient, subject: input.title, body: input.body });
        sent++;
        await this.recordAttempt({
          userId: user.id,
          kind: 'admin.broadcast',
          channel: NotificationChannel.push,
          status: NotificationStatus.sent,
          recipient,
          subject: input.title,
          body: input.body,
          payload,
          sentAt: new Date(),
        });
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        this.log.warn(`broadcast push failed for user ${user.id}: ${message}`);
        if (err instanceof DeadDeviceTokenError) {
          await this.pruneDeviceToken(user.id, err.token);
        }
        await this.recordAttempt({
          userId: user.id,
          kind: 'admin.broadcast',
          channel: NotificationChannel.push,
          status: NotificationStatus.failed,
          recipient,
          subject: input.title,
          body: input.body,
          payload,
          error: message,
        });
      }
    }

    this.log.log(`broadcast ${batchId}: ${sent} sent, ${failed} failed of ${users.length}`);
    return { batchId, recipients: users.length, sent, failed };
  }

  /** Recent broadcast campaigns, grouped by batchId for the admin history view. */
  async listBroadcasts(limit = 50) {
    const rows = await this.prisma.notification.findMany({
      where: { kind: 'admin.broadcast' },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const byBatch = new Map<
      string,
      { batchId: string; title: string; body: string; createdAt: Date; sent: number; failed: number; total: number }
    >();
    for (const r of rows) {
      const payload = (r.payload ?? {}) as { batchId?: string; title?: string };
      const batchId = payload.batchId ?? r.id;
      let entry = byBatch.get(batchId);
      if (!entry) {
        entry = {
          batchId,
          title: r.subject ?? payload.title ?? '',
          body: r.body,
          createdAt: r.createdAt,
          sent: 0,
          failed: 0,
          total: 0,
        };
        byBatch.set(batchId, entry);
      }
      entry.total++;
      if (r.status === NotificationStatus.sent) entry.sent++;
      if (r.status === NotificationStatus.failed) entry.failed++;
    }

    return Array.from(byBatch.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private async pruneDeviceToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deviceTokens: true },
    });
    if (!user) return;
    const next = user.deviceTokens.filter((t) => t !== token);
    if (next.length === user.deviceTokens.length) return;
    await this.prisma.user.update({ where: { id: userId }, data: { deviceTokens: next } });
    this.log.log(`pruned dead device token for user ${userId} (${token.slice(0, 12)}…)`);
  }

  private async recordAttempt(data: {
    userId: string;
    kind: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    recipient: string;
    subject?: string;
    body: string;
    payload: Prisma.InputJsonValue;
    error?: string;
    sentAt?: Date;
  }) {
    await this.prisma.notification.create({ data });
  }
}
