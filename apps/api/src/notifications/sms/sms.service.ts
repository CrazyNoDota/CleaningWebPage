import { Inject, Injectable, Logger } from '@nestjs/common';
import { SMS_PROVIDER, SmsProvider } from './sms.tokens';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(@Inject(SMS_PROVIDER) private readonly provider: SmsProvider) {
    this.logger.log(`SMS provider: ${provider.name}`);
  }

  async send(phone: string, message: string): Promise<void> {
    await this.provider.send(phone, message);
  }
}
