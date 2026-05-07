---
title: "Gotcha — `import { Request } from 'express'` breaks the build"
tags: [gotcha, typescript, express]
---

# Gotcha — `import { Request } from 'express'` breaks the build

## Symptom

Build fails (or worse, silently produces empty output under webpack — see [[nest-webpack-silent-fail]]) with errors mentioning `express` not being resolvable.

## Cause

We use `express` only **transitively** through `@nestjs/platform-express`. We did not add `express` as a direct dependency. A **value** import of `Request` makes the bundler try to resolve `express` at runtime → fails.

## Fix

Use a **type-only** import:

```ts
// wrong
import { Request } from 'express';

// right
import type { Request } from 'express';
```

Type-only imports are erased at build time. No runtime resolution.

## Where this came up

- `src/auth/jwt-auth.guard.ts`
- `src/users/users.controller.ts`

## Rule of thumb

If you're importing a type from a package you don't directly depend on, it must be `import type`. Otherwise add the package to `dependencies`.

## Related

- [[../decisions/ADR-002-tsc-over-nest-build]]
- [[nest-webpack-silent-fail]]
