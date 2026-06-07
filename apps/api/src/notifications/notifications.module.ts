import { Module } from '@nestjs/common';
import { SmsModule } from './sms/sms.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationsService } from './notifications.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { OrderEventsListener } from './order-events.listener';
import { WhatsappStubChannel, EmailStubChannel } from './channels/stub-channels';
import { TelegramChannel } from './channels/telegram-channel';
import { FcmChannel } from './channels/fcm-channel';
import { SmsChannel } from './channels/sms-channel';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { OrderCreatedWhatsappListener } from './whatsapp/order-created-whatsapp.listener';

@Module({
  imports: [SmsModule, SettingsModule, AuthModule, TelegramModule],
  controllers: [AdminNotificationsController],
  providers: [
    FcmChannel,
    WhatsappStubChannel,
    TelegramChannel,
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
