# Cleaner contact & chat — план и трекинг

Фича: связь клиента с клинером — кнопка звонка + чат. Гибридная архитектура:
**клиент → в приложении (поверх WS-шлюза `/realtime`), клинер → Telegram-бот.**
API — хаб, хранит сообщения и маршрутизирует.

## Зафиксированные решения
- Архитектура чата: **гибрид** (клиент in-app, клинер в Telegram).
- Кнопка звонка: **прямой номер** (`tel:`), без маскирования.
- Смена статуса заказа клинером через Telegram inline-кнопки: **в первом этапе бота**.

## Опорная инфраструктура (уже есть)
- WS-шлюз `apps/api/src/realtime/orders.gateway.ts` (Socket.IO, JWT, комнаты заказов, права: владелец / назначенный клинер / админ).
- `OrderStatus`: draft→created→paid→assigned→en_route→in_progress→done→reviewed→cancelled + `order-state-machine.ts`.
- `User.telegramChatId`, `deviceTokens`; FCM push (админ-броадкасты); `TelegramStubChannel` (заглушка).
- `Cleaner.userId → User` (телефон клинера).

---

## Этапы

### Этап 1 — Кнопка «Позвонить клинеру» ✅ ГОТОВО — оценка 9/10 (PASS)
- [x] API: `getOrderCleaner` возвращает `phone` только в статусах `assigned/en_route/in_progress` (`CALLABLE_STATUSES`).
- [x] API: строгая проверка владельца (`order.userId !== requestingUserId`) — гостевые заказы недоступны, телефон не утекает.
- [x] Mobile: `CleanerCard.phone?`; кнопка «Звонок» → `Linking.openURL('tel:')` с санитизацией номера, `canOpenURL` + алерты; серая/неактивна без телефона.
- [x] `tsc --noEmit` зелёный в api и mobile.
- Файлы: `apps/api/src/cleaners/cleaners.service.ts`, `apps/mobile/src/lib/types.ts`, `apps/mobile/app/orders/[id].tsx`.
- Оценка саб-агента: **9/10 PASS** (1-я итерация 6/10 — фикс утечки телефона на гостевых заказах + санитизация `tel:`).
- Деплой: требуется деплой API, чтобы `phone` появился в проде.
- Открытые nit'ы (не блокеры, на будущее): кнопка «Чат» пока инертна (Этап 3); локаль захардкожена `'ru'` в `getOrderCleaner` вызовах.

### Этап 2 — Telegram-бот: каркас + статусы ✅ ГОТОВО — оценка 9/10 (PASS)
- [x] Prisma: `Cleaner.tgLinkCode String? @unique` + миграция `20260607120000_cleaner_telegram_link`.
- [x] Модуль `apps/api/src/telegram/`: `telegram.service.ts` (Bot API клиент через fetch: sendMessage/editMessageReplyMarkup/answerCallbackQuery/setWebhook), `telegram.controller.ts` (`POST /telegram/webhook/:secret` с timing-safe проверкой секрета + admin `POST /telegram/admin/set-webhook`).
- [x] `telegram-webhook.service.ts` — обработка `/start <code>` (привязка) и `callback_query` (смена статуса, авторизация по `telegramChatId` → cleaner).
- [x] `TelegramStubChannel` заменён на настоящий `TelegramChannel` (notifications) через общий `TelegramService`.
- [x] Привязка: deep-link `t.me/<bot>?start=<code>`; админ-эндпоинт `POST /admin/cleaners/:id/telegram-link` генерирует код.
- [x] `telegram-order.listener.ts`: на `ORDER_STATE_CHANGED` (assigned/en_route/in_progress/done/cancelled) шлёт клинеру карточку + inline-кнопку следующего шага → tap → webhook → `transitionByCleaner` → state machine → новое событие → следующая карточка.
- [x] `OrdersService.transitionByCleaner` — переход с проверкой, что заказ назначен этому клинеру.
- [x] Защита: `isCleanerAllowedTarget` (только en_route/in_progress/done — нельзя отменить крафтом callback'а).
- [x] Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `PUBLIC_API_URL` в `.env.example`.
- [x] Unit-тест `cleaner-actions.spec.ts` (6 кейсов); `tsc --noEmit`, `nest build`, вся jest-сюита (24) зелёные.
- Файлы: `apps/api/src/telegram/*`, `apps/api/src/notifications/channels/telegram-channel.ts`, `orders.service.ts`, `cleaners.service.ts`, `cleaners.controller`→`admin-cleaners.controller.ts`, `cleaners.module.ts`, `notifications.{service,module}.ts`, `app.module.ts`, `schema.prisma`, `.env.example`.
- Деплой: ✅ ВЫКАЧЕНО В ПРОД 2026-06-07 (PR #7 → main → CI). Бот @shinex_internal_bot; env заданы в `/opt/shinex/.env` + `environment:` блок compose (правлено вручную, т.к. CI не rsync-ит `infra/`); webhook зарегистрирован `https://shinex.kz/api/v1/telegram/webhook/<secret>`. Проверки: health 200, неверный секрет 404, верный 200, admin-link 401. Осталось: реальный e2e-тест привязки клинера.
- Оценка саб-агента: **9/10 PASS**.
- Пост-ревью фиксы (применены): (1) `transitionByCleaner` теперь проверяет `cleaner.isActive` (`ForbiddenException` → в боте «Профиль клинера неактивен»); (2) вебхук дополнительно сверяет заголовок `x-telegram-bot-api-secret-token` (timing-safe), если он есть.
- Осознанные решения (не баг): телефон клиента (в т.ч. `guestPhone`) показывается клинеру в карточке `assigned` — клинеру нужен контакт для выполнения заказа.
- Открытые nit'ы (на будущее): `/start` парсит `/startfoo` как код `foo` (безвредно); `secret_token` в `setWebhook` задаётся всегда.

### Этап 3 — Чат (релей клиент ↔ Telegram) ⬜
- [ ] Prisma: модель `Message { id, orderId, senderId, senderRole, body, readAt, createdAt }`.
- [ ] WS-шлюз: `@SubscribeMessage('send-message')` → сохранить `Message` → эмит в комнату.
- [ ] Клиент→клинер: после сохранения → Telegram клинеру.
- [ ] Клинер→клиент: текст в боте → webhook → `Message` → WS + FCM push (если офлайн).
- [ ] REST: `GET /orders/:id/messages` (история, пагинация).
- [ ] Mobile: экран чата по заказу (подключить кнопку «Чат»).
- Оценка саб-агента: _не начато_

### Этап 4 — Полировка ⬜
- [ ] Unread-бейджи, read-receipts (`readAt`).
- [ ] «Активный заказ» в боте, если у клинера их несколько.
- [ ] Опц. шаблоны/быстрые ответы.
- Оценка саб-агента: _не начато_

---

## Процесс (по требованию пользователя)
1. Задачи всегда в этом файле.
2. После каждого этапа — саб-агент оценивает работу, нужно ≥ 8/10.
3. Только после оценки ≥ 8/10 — переход к следующему этапу.
4. После каждого этапа — очистка контекста.
