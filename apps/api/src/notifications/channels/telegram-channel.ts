import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { TelegramService } from '../../telegram/telegram.service';
import type {
  ChannelDispatchResult,
  ChannelMessage,
  NotificationChannelDriver,
} from './types';

/**
 * Real Telegram delivery for user notifications, routed through the shared
 * TelegramService Bot API client. Recipient is the user's linked chat id.
 */
@Injectable()
export class TelegramChannel implements NotificationChannelDriver {
  readonly channel = NotificationChannel.telegram;

  constructor(private readonly telegram: TelegramService) {}

  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    const subject = msg.subject ? `<b>${escapeHtml(msg.subject)}</b>\n` : '';
    const sent = await this.telegram.sendMessage(
      msg.recipient,
      `${subject}${escapeHtml(msg.body)}`,
    );
    if (!sent) throw new Error('telegram delivery failed');
    return { recipient: msg.recipient, delivered: true };
  }

  resolveRecipient(u: { telegramChatId: string | null }): string | null {
    return u.telegramChatId;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
