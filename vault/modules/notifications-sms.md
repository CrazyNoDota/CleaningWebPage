---
title: Notifications — SMS
tags: [module, backend, notifications]
---

# Notifications — SMS

`apps/api/src/notifications/sms/`

## Adapter pattern

`SMS_PROVIDER` is an injection symbol. Concrete providers implement a tiny interface:

```ts
interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}
```

Two implementations today:

| Provider | When | What it does |
|---|---|---|
| `StubSmsProvider` | dev / test | Logs `[SMS → +7…] code: 123456` to stdout |
| `MobizonSmsProvider` | prod | Calls Mobizon API with `MOBIZON_API_KEY` |

Selection is by env var (`SMS_PROVIDER=stub|mobizon`).

## Why SMS is special

SMS is **only** the first-touch OTP channel — every phone receives SMS, no app install required. Once a user authenticates and we capture their preferences, we route everything else to **Push / WhatsApp / Telegram / Email**, with SMS as a last-resort fallback.

This was an explicit client question — see [[../architecture/locked-decisions]].

## Now: part of the multi-channel router

The full notification router is shipped — see [[notifications]]. The SMS module is now wrapped by `SmsChannel` (`apps/api/src/notifications/channels/sms-channel.ts`) and slots in as the **last-resort** entry in each user's channel priority list.

## Related

- [[auth]]
- [[../architecture/locked-decisions]]
