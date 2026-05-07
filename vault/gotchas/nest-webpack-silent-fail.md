---
title: "Gotcha — `nest build` silently emits nothing"
tags: [gotcha, build]
---

# Gotcha — `nest build` silently emits nothing

## Symptom

`pnpm build` exits 0 but `dist/main.js` is stale or empty. Running the API uses old code; the new feature you just wrote isn't picked up.

## Cause

`nest build` runs through Webpack. Webpack swallows several classes of resolution errors (notably `import { Request } from 'express'` when express isn't a direct dep — see [[express-type-import]]) and emits *nothing* without an error.

Setting `"webpack": false` in `nest-cli.json` *should* fall back to plain `tsc`, but in this project it didn't reliably emit either.

## Fix

Use plain `tsc`. See [[../decisions/ADR-002-tsc-over-nest-build]].

```json
"build": "tsc",
"dev": "tsc --watch & node --watch dist/main.js"
```

## How to detect quickly

```sh
ls -la apps/api/dist/main.js  # check mtime
```

If the timestamp doesn't match your last build attempt, the build was a no-op.
