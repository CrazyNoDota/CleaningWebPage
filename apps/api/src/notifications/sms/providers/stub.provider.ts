import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from '../sms.tokens';

@Injectable()
export class StubSmsProvider implements SmsProvider {
  readonly name = 'stub';
  private readonly logger = new Logger(StubSmsProvider.name);

  async send(phone: string, message: string): Promise<void> {
    this.logger.log(`[STUB-SMS] -> ${phone} :: ${message}`);
  }
}
