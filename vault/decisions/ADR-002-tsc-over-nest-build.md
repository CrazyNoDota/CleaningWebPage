---
title: ADR-002 — Plain tsc instead of `nest build`
status: accepted
date: 2026-05-07
tags: [decision, build]
---

# ADR-002 — Plain `tsc` instead of `nest build`

## Context

`nest build` defaults to a webpack-based pipeline that:

- Bundles dependencies that we don't actually want bundled (e.g. `express`, leading to phantom resolution errors — see [[../gotchas/express-type-import]]).
- **Silently emits nothing** in some misconfigurations, leaving you with a stale `dist/`.
- Disabling webpack via `nest-cli.json` (`"webpack": false`) didn't reliably emit either.

## Decision

`apps/api/package.json` builds with plain `tsc`:

```json
"dev": "tsc --watch & node --watch dist/main.js",
"build": "tsc",
"start": "node dist/main.js"
```

## Consequences

- We lose Nest's swagger-plugin auto-decoration. Acceptable — the existing endpoints are explicit about their decorators anyway.
- Any TS error is loud and obvious.
- We rely on `node --watch` rather than `nest start --watch`. Works fine.

## Related

- [[../gotchas/nest-webpack-silent-fail]]
- [[../gotchas/express-type-import]]
