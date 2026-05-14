import { Module } from '@nestjs/common';
import { SmsModule } from './sms/sms.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsService } from './notifications.service';
import { OrderEventsListener } from './order-events.listener';
import {
  PushStubChannel,
  WhatsappStubChannel,
  TelegramStubChannel,
  EmailStubChannel,
} from './channels/stub-channels';
import { SmsChannel } from './channels/sms-channel';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { OrderCreatedWhatsappListener } from './whatsapp/order-created-whatsapp.listener';

@Module({
  imports: [SmsModule, SettingsModule],
  providers: [
    PushStubChannel,
    WhatsappStubChannel,
    TelegramStubChannel,
    EmailStubChannel,
    SmsChannel,
    NotificationsService,
    OrderEventsListener,
    WhatsappService,
    OrderCreatedWhatsappListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
