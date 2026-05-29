import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsExpiryService } from './payments-expiry.service';
import { PaymentWebhooksController } from './webhooks.controller';
import { CloudPaymentsDriver } from './providers/cloudpayments.driver';
import { FreedomPayDriver } from './providers/freedom-pay.driver';
import { HalykEpayDriver } from './providers/halyk-epay.driver';
import { KaspiDriver } from './providers/kaspi.driver';
import { PaymentProviderRegistry } from './providers/registry';
import { StubDriver } from './providers/stub.driver';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PaymentsController, PaymentWebhooksController],
  providers: [
    PaymentsService,
    PaymentsExpiryService,
    PaymentProviderRegistry,
    StubDriver,
    KaspiDriver,
    FreedomPayDriver,
    HalykEpayDriver,
    CloudPaymentsDriver,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
