import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { SmsService } from '../sms/sms.service';
import type {
  ChannelDispatchResult,
  ChannelMessage,
  NotificationChannelDriver,
} from './types';

/**
 * SMS adapter wraps the existing SmsService (used at OTP time).
 * SMS is the last-resort fallback per the locked decisions.
 */
@Injectable()
export class SmsChannel implements NotificationChannelDriver {
  readonly channel = NotificationChannel.sms;

  constructor(private readonly sms: SmsService) {}

  async send(msg: ChannelMessage): Promise<ChannelDispatchResult> {
    await this.sms.send(msg.recipient, msg.body);
    return { recipient: msg.recipient, delivered: true };
  }

  resolveRecipient(u: { phone: string | null }): string | null {
    return u.phone;
  }
}
