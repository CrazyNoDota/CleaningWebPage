import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin client for the Meta (WhatsApp) Cloud API.
 *
 * Business-initiated messages must use a pre-approved template — free-form text
 * only delivers inside a 24h customer-service window, which does not apply to
 * proactive alerts. So this service only exposes `sendTemplate`.
 *
 * Config (all from env):
 *   WHATSAPP_ENABLED          — "true" to actually call the API; otherwise logs only
 *   WHATSAPP_ACCESS_TOKEN     — System User / app access token
 *   WHATSAPP_PHONE_NUMBER_ID  — the sending number's ID (from Meta API Setup)
 *   WHATSAPP_API_VERSION      — Graph API version, defaults to v25.0
 */
@Injectable()
export class WhatsappService {
  private readonly log = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get<string>('WHATSAPP_ENABLED') === 'true';
  }

  /**
   * Send an approved template message.
   *
   * @param to          recipient phone, any format — normalized to digits here
   * @param templateName approved template name in Meta
   * @param languageCode template language code (e.g. "ru")
   * @param bodyParams   ordered values for the template's {{1}}, {{2}}, … body vars
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    bodyParams: string[],
  ): Promise<void> {
    const recipient = normalizePhone(to);
    if (!recipient) {
      this.log.warn(`skip: cannot normalize recipient phone "${to}"`);
      return;
    }

    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const apiVersion = this.config.get<string>('WHATSAPP_API_VERSION') ?? 'v25.0';

    if (!this.enabled) {
      this.log.log(
        `[STUB-WHATSAPP] -> ${recipient} :: template "${templateName}" [${bodyParams.join(' | ')}]`,
      );
      return;
    }
    if (!token || !phoneNumberId) {
      this.log.error(
        'WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing — cannot send',
      );
      return;
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(bodyParams.length > 0
          ? {
              components: [
                {
                  type: 'body',
                  parameters: bodyParams.map((text) => ({ type: 'text', text })),
                },
              ],
            }
          : {}),
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      this.log.error(`WhatsApp send failed: ${res.status} ${text}`);
      throw new Error(`WhatsApp send failed: ${res.status}`);
    }
    this.log.log(`WhatsApp template "${templateName}" sent to ${recipient}`);
  }
}

/**
 * Meta expects digits only, with country code, no "+".
 * Handles common Kazakhstan formats: "+7 705…", "8705…", "705…".
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.length === 10) {
    digits = `7${digits}`;
  }
  return digits.length >= 11 ? digits : null;
}
