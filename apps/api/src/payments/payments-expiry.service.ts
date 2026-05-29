import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PaymentsService } from './payments.service';

const SWEEP_INTERVAL_MS = 60_000;

@Injectable()
export class PaymentsExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('PaymentsExpiry');
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly payments: PaymentsService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), SWEEP_INTERVAL_MS);
    // Don't keep the event loop alive just for this.
    this.timer.unref?.();
    this.log.log(`expiry sweeper armed (interval ${SWEEP_INTERVAL_MS / 1000}s)`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.payments.sweepExpired();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error(`sweep failed: ${msg}`);
    } finally {
      this.running = false;
    }
  }
}
