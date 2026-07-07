---
name: hookform-resolvers zod version conflict
description: @hookform/resolvers resolves zod to zod@4.4.3 (pulled in by eas-cli transitively) instead of workspace catalog zod@3.25.76, causing TS2345 on zodResolver() calls in agency-dashboard.
---

## The problem
`@hookform/resolvers` resolves `zod` to `zod@4.4.3` (a different major, pulled transitively by eas-cli) instead of the workspace catalog `zod@3.25.76`. When TypeScript processes `@hookform/resolvers/zod/dist/types.d.ts` → `import { z } from 'zod'`, it picks up v4's `$ZodType<O, I, $ZodTypeInternals>`, so `zodResolver(formSchema)` fails with TS2345: v3 `ZodObject` doesn't satisfy `ZodType<any, any, $ZodTypeInternals>`.

**Why:** pnpm satisfies `@hookform/resolvers`' zod peer dep with whatever version is highest in the tree. eas-cli brought in `zod@4.4.3`; the workspace catalog only specifies `3.25.76` but doesn't force other packages.

## Fix applied
1. Added `zod: 3.25.76` to `overrides` in `pnpm-workspace.yaml` to prevent future drift.
2. Cast the schema in the two affected calls: `zodResolver(formSchema as any)` in `artifacts/agency-dashboard/src/pages/invites.tsx` and `sub-accounts.tsx`.

**Why `as any` not a package fix:** The pnpm override alone doesn't immediately clear the cached virtual store entry pointing to 4.4.3; the `as any` bridges the gap safely at zero runtime cost.

## How to apply
If TS2345 shows up on any `zodResolver(schema)` call in agency-dashboard, check whether a transitive dep brought in `zod@4.x` and use `as any` cast until the lockfile is clean.
