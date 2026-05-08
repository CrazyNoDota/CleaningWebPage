import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from '../sms.tokens';

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const messagingServiceSid = this.config.get<string>('TWILIO_MESSAGING_SERVICE_SID');
    const from = this.config.get<string>('TWILIO_FROM');

    if (!accountSid || !authToken) {
      this.logger.error('TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN missing — cannot send SMS');
      return;
    }
    if (!messagingServiceSid && !from) {
      this.logger.error('TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM required');
      return;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({ To: phone, Body: message });
    if (messagingServiceSid) body.set('MessagingServiceSid', messagingServiceSid);
    else if (from) body.set('From', from);

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Twilio send failed: ${res.status} ${text}`);
      throw new Error(`Twilio send failed: ${res.status}`);
    }
  }
}
