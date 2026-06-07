import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { TelegramService } from './telegram.service';
import { TelegramWebhookService } from './telegram-webhook.service';
import { TelegramOrderListener } from './telegram-order.listener';
import { TelegramController } from './telegram.controller';

@Module({
  imports: [AuthModule, OrdersModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramWebhookService, TelegramOrderListener],
  exports: [TelegramService],
})
export class TelegramModule {}
