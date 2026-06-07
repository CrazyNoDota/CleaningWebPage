import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** A single inline button. `callback_data` is echoed back in a callback_query. */
export interface InlineButton {
  text: string;
  callback_data: string;
}

type InlineKeyboard = InlineButton[][];

/**
 * Thin client for the Telegram Bot API (https://core.telegram.org/bots/api).
 * Stateless — all calls go out over fetch. No-ops with a warning when
 * TELEGRAM_BOT_TOKEN is absent, so local/dev runs don't blow up.
 */
@Injectable()
export class TelegramService {
  private readonly log = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return !!this.config.get<string>('TELEGRAM_BOT_TOKEN');
  }

  /** Public bot username (without @), used to build deep-links. */
  get botUsername(): string | null {
    return this.config.get<string>('TELEGRAM_BOT_USERNAME') ?? null;
  }

  /** Builds the cleaner onboarding deep-link, or null if the bot username is unset. */
  buildDeepLink(code: string): string | null {
    const username = this.botUsername;
    if (!username) return null;
    return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
  }

  /** Sends a text message, optionally with an inline keyboard. Returns the message id. */
  async sendMessage(
    chatId: string | number,
    text: string,
    opts: { inlineKeyboard?: InlineKeyboard } = {},
  ): Promise<{ messageId: number } | null> {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (opts.inlineKeyboard) {
      payload.reply_markup = { inline_keyboard: opts.inlineKeyboard };
    }
    const result = await this.call<{ message_id: number }>('sendMessage', payload);
    return result ? { messageId: result.message_id } : null;
  }

  /** Replaces (or clears, when passed null) the inline keyboard of an existing message. */
  async editMessageReplyMarkup(
    chatId: string | number,
    messageId: number,
    inlineKeyboard: InlineKeyboard | null,
  ): Promise<void> {
    await this.call('editMessageReplyMarkup', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
    });
  }

  /** Acknowledges a button tap so Telegram stops the loading spinner. */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert = false,
  ): Promise<void> {
    await this.call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {}),
      show_alert: showAlert,
    });
  }

  /** Registers the webhook with Telegram. `secretToken` is echoed in a header on each update. */
  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    const result = await this.call('setWebhook', {
      url,
      allowed_updates: ['message', 'callback_query'],
      ...(secretToken ? { secret_token: secretToken } : {}),
    });
    return result !== null;
  }

  /**
   * Low-level Bot API call. Returns the `result` field on success, or null on any
   * failure (logged). Callers that must react to failure should check for null.
   */
  private async call<T = unknown>(
    method: string,
    payload: Record<string, unknown>,
  ): Promise<T | null> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.log.warn(`TELEGRAM_BOT_TOKEN missing — skipping ${method}`);
      return null;
    }
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; result?: T; description?: string }
        | null;
      if (!json || !json.ok) {
        this.log.warn(`Telegram ${method} failed: ${json?.description ?? res.status}`);
        return null;
      }
      return json.result ?? (null as T);
    } catch (err) {
      this.log.warn(
        `Telegram ${method} threw: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
