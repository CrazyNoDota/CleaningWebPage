import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { PricingModule } from './pricing/pricing.module';
import { CleanersModule } from './cleaners/cleaners.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TelegramModule } from './telegram/telegram.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ApplicationsModule } from './applications/applications.module';
import { AddressesModule } from './addresses/addresses.module';
import { AdminMetricsModule } from './admin-metrics/admin-metrics.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';

const realtimeEnabled = process.env.DISABLE_REALTIME !== 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    PricingModule,
    CleanersModule,
    OrdersModule,
    ReviewsModule,
    ...(realtimeEnabled ? [RealtimeModule] : []),
    TelegramModule,
    NotificationsModule,
    ApplicationsModule,
    AddressesModule,
    AdminMetricsModule,
    PaymentsModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule {}
