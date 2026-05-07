---
title: Smoke tests
tags: [runbook, testing]
---

# Smoke tests

Curl recipes for every public endpoint. Useful when verifying after a change or before a demo.

API base: `http://localhost:4000/api/v1`

## Health

```sh
curl -s localhost:4000/api/v1/health
```

## Auth — full OTP loop

```sh
# 1. Request OTP — server logs the code in dev mode
curl -s -X POST localhost:4000/api/v1/auth/otp/request \
  -H 'content-type: application/json' \
  -d '{"phone":"+77001234567"}'

# 2. Watch the API stdout for "OTP for +77001234567: 123456"

# 3. Verify
curl -s -X POST localhost:4000/api/v1/auth/otp/verify \
  -H 'content-type: application/json' \
  -d '{"phone":"+77001234567","code":"123456"}'
# → { accessToken, refreshToken, user }

# 4. Use access token
curl -s localhost:4000/api/v1/users/me \
  -H 'authorization: Bearer <accessToken>'

# 5. Refresh
curl -s -X POST localhost:4000/api/v1/auth/refresh \
  -H 'content-type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Catalog

```sh
# Russian
curl -s 'localhost:4000/api/v1/services?city=astana&locale=ru' | jq

# Kazakh via Accept-Language
curl -s 'localhost:4000/api/v1/services?city=astana' \
  -H 'accept-language: kk' | jq

# English single service
curl -s 'localhost:4000/api/v1/services/apartment-standard?locale=en' | jq
```

## Pricing — known totals

```sh
# Should return total: 2_600_000 (matches pricing-engine.spec.ts)
curl -s -X POST localhost:4000/api/v1/pricing/quote \
  -H 'content-type: application/json' \
  -d '{
    "serviceSlug": "apartment-standard",
    "city": "astana",
    "locale": "ru",
    "inputs": { "area_m2": 60, "rooms": 2 },
    "options": [{ "key": "windows", "qty": 1 }]
  }' | jq

# +2 carpet line items → total: 3_500_000
curl -s -X POST localhost:4000/api/v1/pricing/quote \
  -H 'content-type: application/json' \
  -d '{
    "serviceSlug": "apartment-standard",
    "inputs": { "area_m2": 60, "rooms": 2 },
    "options": [{ "key": "windows", "qty": 1 }, { "key": "carpet", "qty": 2 }]
  }' | jq
```

## Cleaners

```sh
# Find a seeded cleaner id
docker exec cleaning_postgres psql -U cleaning -d cleaning -t \
  -c 'select id from "Cleaner" limit 1;' | tr -d ' \n'

# Public profile in 3 locales
curl -s "http://localhost:4000/api/v1/cleaners/<id>?locale=ru" | jq
curl -s "http://localhost:4000/api/v1/cleaners/<id>?locale=kk" | jq
curl -s -H "accept-language: en" "http://localhost:4000/api/v1/cleaners/<id>" | jq

# "Your cleaner" view (requires auth + an order with cleaner assigned)
curl -s "http://localhost:4000/api/v1/orders/<orderId>/cleaner" \
  -H "authorization: Bearer <accessToken>" | jq
```

Sanitized response: `displayName` is "Firstname I." — no full surname, no phone, no email, no userId.

## Orders

```sh
# 1. Customer creates order — total recomputed server-side
curl -s -X POST localhost:4000/api/v1/orders \
  -H "authorization: Bearer <accessToken>" \
  -H 'content-type: application/json' \
  -d '{
    "serviceSlug": "apartment-standard",
    "scheduledAt": "2026-06-01T10:00:00.000Z",
    "inputs": { "area_m2": 60, "rooms": 2 },
    "options": [{ "key": "windows", "qty": 1 }],
    "notes": "domofon 4321"
  }' | jq
# → status: "created", total: 2600000

# 2. List my orders
curl -s localhost:4000/api/v1/orders -H "authorization: Bearer <accessToken>" | jq

# 3. Get one with full event log
curl -s "localhost:4000/api/v1/orders/<id>" -H "authorization: Bearer <accessToken>" | jq

# 4. Customer cancel (only allowed before en_route)
curl -s -X POST "localhost:4000/api/v1/orders/<id>/cancel" \
  -H "authorization: Bearer <accessToken>" \
  -H 'content-type: application/json' -d '{"reason":"changed plans"}'

# 5. Operator assigns cleaner (manager / admin / operator role)
curl -s -X POST "localhost:4000/api/v1/admin/orders/<id>/assign" \
  -H "authorization: Bearer <managerAccessToken>" \
  -H 'content-type: application/json' \
  -d '{"cleanerId":"<cleanerId>"}'

# 6. Move through statuses
for STATUS in en_route in_progress done; do
  curl -s -X POST "localhost:4000/api/v1/admin/orders/<id>/transition" \
    -H "authorization: Bearer <managerAccessToken>" \
    -H 'content-type: application/json' \
    -d "{\"to\":\"$STATUS\"}"
done

# 7. Invalid transition (state machine rejects)
curl -s -X POST "localhost:4000/api/v1/admin/orders/<id>/transition" \
  -H "authorization: Bearer <managerAccessToken>" \
  -H 'content-type: application/json' -d '{"to":"in_progress"}'
# → 400 invalid order transition: done -> in_progress
```

To create a manager for testing, promote any user via SQL:
```sh
docker exec cleaning_postgres psql -U cleaning -d cleaning \
  -c "UPDATE \"User\" SET role='manager' WHERE phone='+77010000001';"
```
Then re-run OTP login — the new JWT picks up the role.

## Reviews

```sh
# Customer submits review on a `done` order — auto-publishes by default
curl -s -X POST "localhost:4000/api/v1/orders/<id>/review" \
  -H "authorization: Bearer <accessToken>" \
  -H 'content-type: application/json' \
  -d '{"rating":5,"comment":"Spotless","tags":["punctual","thorough"]}' | jq

# Public reviews for a cleaner (paginated, take/skip optional)
curl -s "localhost:4000/api/v1/cleaners/<cleanerId>/reviews?take=10" | jq

# Company-wide rating aggregate
curl -s localhost:4000/api/v1/reviews/aggregate | jq

# Manager moderation queue (pending by default; ?status= to filter)
curl -s "localhost:4000/api/v1/admin/reviews?status=pending" \
  -H "authorization: Bearer <managerAccess>" | jq

# Hide / re-publish — cleaner stats roll back / forward in the same txn
curl -s -X PATCH "localhost:4000/api/v1/admin/reviews/<reviewId>" \
  -H "authorization: Bearer <managerAccess>" \
  -H 'content-type: application/json' \
  -d '{"status":"hidden","note":"spam link"}'
```

To test the **hold-for-moderation** mode:
```sh
REVIEWS_AUTO_PUBLISH=false node dist/main.js
```
Reviews land as `pending`. Stats only update when admin PATCHes to `published`.

## Realtime (WebSocket)

Tiny CLI listener for verifying push:
```sh
node apps/api/scripts/ws-listener.mjs <accessToken> <orderId>
# logs every order.updated event for that order
```

Drive transitions from another shell (assign, transition, submit-review). Each
should print one `[order.updated]` line on the listener.

Probe auth/authz:
```sh
node apps/api/scripts/ws-probe.mjs ""             ""               notoken    # rejected
node apps/api/scripts/ws-probe.mjs garbage         ""               badtoken   # rejected
node apps/api/scripts/ws-probe.mjs <foreignToken>  <someOrderId>    foreign    # ack: forbidden
node apps/api/scripts/ws-probe.mjs <validToken>    00000000-…       missing    # ack: not_found
```

## Notifications

```sh
# Set notification preferences
curl -s -X PATCH localhost:4000/api/v1/users/me \
  -H "authorization: Bearer <accessToken>" \
  -H 'content-type: application/json' \
  -d '{
    "email":"alice@example.com",
    "telegramChatId":"123456789",
    "locale":"en",
    "notificationChannels":["telegram","email","sms"]
  }' | jq

# Drive an order through `assigned` etc. (see Orders smoke section).
# Each notify-worthy transition writes one row per attempt to Notification.

# Inspect the audit log
docker exec cleaning_postgres psql -U cleaning -d cleaning -c \
  "SELECT kind, channel, status, recipient, body
   FROM \"Notification\"
   WHERE \"userId\" = '<userId>'
   ORDER BY \"createdAt\";"
```

What's notify-worthy: `assigned`, `en_route`, `done`, `cancelled`.
What's silenced: `created`, `paid`, `in_progress`, `reviewed`.

Stub providers log to stdout (`[STUB-PUSH]`, `[STUB-EMAIL]`, etc.) so you can see what would have been sent before real provider integration.

## Job applications

```sh
# Public submit (no auth)
curl -s -X POST localhost:4000/api/v1/applications \
  -H 'content-type: application/json' \
  -d '{
    "fullName":"Aigerim K",
    "phone":"+77017772211",
    "city":"astana",
    "age":28,
    "experience":"3 years at SuperClean Astana"
  }' | jq

# Duplicate within 24h is rejected (409)
curl -s -X POST localhost:4000/api/v1/applications \
  -H 'content-type: application/json' \
  -d '{"fullName":"Aigerim K","phone":"+77017772211","city":"astana"}'

# Manager queue
curl -s -H "authorization: Bearer <managerAccess>" \
  "localhost:4000/api/v1/admin/applications?status=new&take=50" | jq

# Update status / notes
curl -s -X PATCH "localhost:4000/api/v1/admin/applications/<id>" \
  -H "authorization: Bearer <managerAccess>" \
  -H 'content-type: application/json' \
  -d '{"status":"interviewing","notes":"Schedule for Tue."}'
```

After every submit, check the audit log for the operator fan-out:
```sh
docker exec cleaning_postgres psql -U cleaning -d cleaning -c \
  "SELECT kind, channel, status, recipient FROM \"Notification\"
   WHERE kind='application.received'
   ORDER BY \"createdAt\" DESC LIMIT 10;"
```

## Addresses

```sh
ACCESS=<accessToken>

# Create
curl -s -X POST localhost:4000/api/v1/addresses \
  -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' \
  -d '{
    "city":"astana",
    "label":"Дом",
    "street":"ул. Республики",
    "building":"24",
    "apartment":"12",
    "comment":"Подъезд 2, домофон 4321",
    "lat":51.1605,
    "lng":71.4704
  }' | jq

# List mine (newest first; excludes soft-deleted)
curl -s localhost:4000/api/v1/addresses -H "authorization: Bearer $ACCESS" | jq

# Reverse geocode (stub returns canned data; 2GIS later)
curl -s -X POST localhost:4000/api/v1/addresses/geocode/reverse \
  -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' \
  -d '{"lat":51.1605,"lng":71.4704}' | jq

# Forward geocode autocomplete
curl -s -X POST localhost:4000/api/v1/addresses/geocode/forward \
  -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' \
  -d '{"query":"Республики","city":"astana"}' | jq

# Soft-delete
curl -s -X DELETE "localhost:4000/api/v1/addresses/<id>" \
  -H "authorization: Bearer $ACCESS"
```

To swap to a real geocoder later, set `GEOCODING_PROVIDER=2gis` in env once the
provider is implemented.

## Negative paths to verify

| Request | Expected |
|---|---|
| Quote with unknown `serviceSlug` | 404 |
| Quote with unknown option `key` | 400 |
| Quote with missing required input | 400 |
| `/users/me` without `Authorization` | 401 |

## Related

- [[../modules/auth]]
- [[../modules/catalog]]
- [[../modules/pricing]]
