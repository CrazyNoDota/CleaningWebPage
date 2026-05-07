import { Module } from '@nestjs/common';
import { SmsModule } from './sms/sms.module';
import { NotificationsService } from './notifications.service';
import { OrderEventsListener } from './order-events.listener';
import {
  PushStubChannel,
  WhatsappStubChannel,
  TelegramStubChannel,
  EmailStubChannel,
} from './channels/stub-channels';
import { SmsChannel } from './channels/sms-channel';

@Module({
  imports: [SmsModule],
  providers: [
    PushStubChannel,
    WhatsappStubChannel,
    TelegramStubChannel,
    EmailStubChannel,
    SmsChannel,
    NotificationsService,
    OrderEventsListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
