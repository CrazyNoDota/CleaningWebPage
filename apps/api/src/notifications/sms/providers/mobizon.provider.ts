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

    // Send under an approved sender name (alpha-name) when one is configured.
    // Without it, Mobizon falls back to a test alpha-name and the message is held
    // in MODERATION and never delivered. Register/approve the name in the Mobizon
    // dashboard (SMS → "Отправители SMS"), then set MOBIZON_SENDER.
    const sender = this.config.get<string>('MOBIZON_SENDER');
    if (sender) {
      body.set('params[from]', sender);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Mobizon HTTP failure: ${res.status} ${text}`);
      throw new Error(`Mobizon HTTP failure: ${res.status}`);
    }

    // Mobizon returns HTTP 200 even on logical errors — the real status is in body.code.
    // code 0 = success; anything else (alpha-name not approved, no balance, bad recipient, etc.)
    // means the SMS did NOT go out and we must surface it instead of silently succeeding.
    const json = (await res.json().catch(() => null)) as
      | { code?: number; message?: string; data?: unknown }
      | null;
    if (!json || json.code !== 0) {
      const detail = json?.message || JSON.stringify(json?.data) || 'unknown error';
      this.logger.error(`Mobizon API rejected send to ${phone}: ${detail}`);
      throw new Error(`Mobizon API rejected send: ${detail}`);
    }
  }
}
