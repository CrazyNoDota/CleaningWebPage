import { NotificationChannel } from '@prisma/client';

export interface ChannelMessage {
  recipient: string; // phone / email / chatId / device token
  subject?: string; // email only; ignored elsewhere
  body: string;
}

export interface ChannelDispatchResult {
  recipient: string;
  delivered: boolean;
  error?: string;
}

export interface NotificationChannelDriver {
  readonly channel: NotificationChannel;
  /** Throws on permanent failure. Returns delivery info on success. */
  send(msg: ChannelMessage): Promise<ChannelDispatchResult>;
  /** Resolve the recipient string for a user, or null if not configured. */
  resolveRecipient(user: {
    id: string;
    phone: string | null;
    email: string | null;
    telegramChatId: string | null;
    deviceTokens: string[];
  }): string | null;
}
