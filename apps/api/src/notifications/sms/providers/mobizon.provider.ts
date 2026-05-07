import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from '../sms.tokens';

@Injectable()
export class MobizonSmsProvider implements SmsProvider {
  readonly name = 'mobizon';
  private readonly logger = new Logger(MobizonSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<void> {
    const apiKey = this.config.get<string>('MOBIZON_API_KEY');
    if (!apiKey) {
      this.logger.error('MOBIZON_API_KEY missing — cannot send SMS');
      return;
    }
    const url = `https://api.mobizon.kz/service/message/sendSMSMessage?apiKey=${apiKey}`;
    const body = new URLSearchParams({ recipient: phone, text: message });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Mobizon send failed: ${res.status} ${text}`);
      throw new Error(`Mobizon send failed: ${res.status}`);
    }
  }
}
