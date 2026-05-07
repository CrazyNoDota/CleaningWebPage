import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import type {
  ChannelDispatchResult,
  ChannelMessage,
  NotificationChannelDriver,
} from './types';

/**
 * Stub drivers: log to stdout instead of calling a real provider.
 * Replace with real adapters (FCM, Twilio, SendGrid, Telegram bot) when chosen.
 */

@Injectable()
export class PushStubChannel implements NotificationChannelDriver {
  readonly channel = NotificationChannel.push;
  private readonly log = new Logger('Push');
  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    this.log.log(`[STUB-PUSH] -> ${msg.recipient} :: ${msg.body}`);
    return { recipient: msg.recipient, delivered: true };
  }
  resolveRecipient(u: { deviceTokens: string[] }): string | null {
    return u.deviceTokens[0] ?? null;
  }
}

@Injectable()
export class WhatsappStubChannel implements NotificationChannelDriver {
  readonly channel = NotificationChannel.whatsapp;
  private readonly log = new Logger('WhatsApp');
  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    this.log.log(`[STUB-WHATSAPP] -> ${msg.recipient} :: ${msg.body}`);
    return { recipient: msg.recipient, delivered: true };
  }
  resolveRecipient(u: { phone: string | null }): string | null {
    return u.phone;
  }
}

@Injectable()
export class TelegramStubChannel implements NotificationChannelDriver {
  readonly channel = NotificationChannel.telegram;
  private readonly log = new Logger('Telegram');
  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    this.log.log(`[STUB-TG] -> chat ${msg.recipient} :: ${msg.body}`);
    return { recipient: msg.recipient, delivered: true };
  }
  resolveRecipient(u: { telegramChatId: string | null }): string | null {
    return u.telegramChatId;
  }
}

@Injectable()
export class EmailStubChannel implements NotificationChannelDriver {
  readonly channel = NotificationChannel.email;
  private readonly log = new Logger('Email');
  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    this.log.log(
      `[STUB-EMAIL] -> ${msg.recipient} :: ${msg.subject ?? '(no subject)'} :: ${msg.body}`,
    );
    return { recipient: msg.recipient, delivered: true };
  }
  resolveRecipient(u: { email: string | null }): string | null {
    return u.email;
  }
}
