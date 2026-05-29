import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { CloudPaymentsDriver } from './cloudpayments.driver';
import { FreedomPayDriver } from './freedom-pay.driver';
import { HalykEpayDriver } from './halyk-epay.driver';
import { KaspiDriver } from './kaspi.driver';
import { StubDriver } from './stub.driver';
import type { PaymentProviderDriver } from './types';

@Injectable()
export class PaymentProviderRegistry {
  private readonly log = new Logger('PaymentProviderRegistry');
  private readonly drivers: Map<PaymentProvider, PaymentProviderDriver>;

  constructor(
    stub: StubDriver,
    kaspi: KaspiDriver,
    freedom: FreedomPayDriver,
    halyk: HalykEpayDriver,
    cp: CloudPaymentsDriver,
  ) {
    this.drivers = new Map<PaymentProvider, PaymentProviderDriver>([
      [PaymentProvider.stub, stub],
      [PaymentProvider.kaspi, kaspi],
      [PaymentProvider.freedom_pay, freedom],
      [PaymentProvider.halyk_epay, halyk],
      [PaymentProvider.cloudpayments, cp],
    ]);
  }

  /** Active provider from PAYMENT_PROVIDER env. Falls back to stub. */
  active(): PaymentProviderDriver {
    const raw = (process.env.PAYMENT_PROVIDER ?? 'stub').toLowerCase();
    const key = (Object.values(PaymentProvider) as string[]).includes(raw)
      ? (raw as PaymentProvider)
      : PaymentProvider.stub;
    return this.for(key);
  }

  for(provider: PaymentProvider): PaymentProviderDriver {
    const d = this.drivers.get(provider);
    if (!d) throw new Error(`No driver registered for provider "${provider}"`);
    return d;
  }
}
