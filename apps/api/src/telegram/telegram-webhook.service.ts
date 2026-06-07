import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { TelegramService } from './telegram.service';
import { isCleanerAllowedTarget, parseCallback } from './cleaner-actions';

/** Minimal shape of the Telegram updates we handle (message + callback_query). */
export interface TelegramUpdate {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    message?: { chat?: { id?: number }; message_id?: number };
    data?: string;
  };
}

@Injectable()
export class TelegramWebhookService {
  private readonly log = new Logger(TelegramWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly telegram: TelegramService,
  ) {}

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      if (update.callback_query) {
        await this.handleCallback(update.callback_query);
      } else if (update.message) {
        await this.handleMessage(update.message);
      }
    } catch (err) {
      // Never throw back to Telegram — it would retry the update indefinitely.
      this.log.error(
        `failed to handle update: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ── message handling (cleaner onboarding via /start <code>) ──────────

  private async handleMessage(message: NonNullable<TelegramUpdate['message']>): Promise<void> {
    const chatId = message.chat?.id;
    const text = message.text?.trim();
    if (!chatId || !text) return;

    if (text.startsWith('/start')) {
      const code = text.slice('/start'.length).trim();
      await this.linkCleaner(chatId, code);
      return;
    }

    await this.telegram.sendMessage(
      chatId,
      'Откройте ссылку-приглашение от Shinex, чтобы привязать аккаунт клинера.',
    );
  }

  private async linkCleaner(chatId: number, code: string): Promise<void> {
    if (!code) {
      await this.telegram.sendMessage(
        chatId,
        'Нужен код привязки. Откройте ссылку-приглашение от Shinex.',
      );
      return;
    }

    const cleaner = await this.prisma.cleaner.findUnique({
      where: { tgLinkCode: code },
      select: { id: true, userId: true },
    });
    if (!cleaner) {
      await this.telegram.sendMessage(chatId, 'Код не найден или устарел. Запросите новую ссылку.');
      return;
    }

    await this.prisma.user.update({
      where: { id: cleaner.userId },
      data: { telegramChatId: String(chatId) },
    });
    this.log.log(`linked cleaner ${cleaner.id} to telegram chat ${chatId}`);
    await this.telegram.sendMessage(
      chatId,
      '✅ Telegram привязан. Здесь будут приходить ваши заказы и кнопки смены статуса.',
    );
  }

  // ── callback handling (status buttons) ───────────────────────────────

  private async handleCallback(
    cq: NonNullable<TelegramUpdate['callback_query']>,
  ): Promise<void> {
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;
    const parsed = cq.data ? parseCallback(cq.data) : null;

    if (!chatId || !parsed) {
      await this.telegram.answerCallbackQuery(cq.id, 'Неизвестное действие');
      return;
    }

    if (!isCleanerAllowedTarget(parsed.to)) {
      await this.telegram.answerCallbackQuery(cq.id, 'Действие недоступно');
      return;
    }

    // Identify the cleaner from the linked chat — this is the authorization anchor.
    const user = await this.prisma.user.findFirst({
      where: { telegramChatId: String(chatId), cleanerProfile: { isNot: null } },
      select: { id: true },
    });
    if (!user) {
      await this.telegram.answerCallbackQuery(cq.id, 'Чат не привязан к аккаунту клинера');
      return;
    }

    try {
      await this.orders.transitionByCleaner(parsed.orderId, user.id, parsed.to);
      await this.telegram.answerCallbackQuery(cq.id, 'Готово ✅');
      // Drop the button so it can't be tapped twice; the next card arrives via the listener.
      if (messageId !== undefined) {
        await this.telegram.editMessageReplyMarkup(chatId, messageId, null);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        await this.telegram.answerCallbackQuery(cq.id, 'Это не ваш заказ');
      } else if (err instanceof ForbiddenException) {
        await this.telegram.answerCallbackQuery(cq.id, 'Профиль клинера неактивен');
      } else if (err instanceof BadRequestException) {
        await this.telegram.answerCallbackQuery(cq.id, 'Сейчас это действие недоступно');
      } else {
        this.log.error(
          `transition failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        await this.telegram.answerCallbackQuery(cq.id, 'Ошибка, попробуйте позже');
      }
    }
  }
}
