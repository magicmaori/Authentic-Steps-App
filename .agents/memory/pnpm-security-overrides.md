---
name: pnpm transitive security overrides
description: How to patch transitive-dependency CVEs in this pnpm workspace catalog without breaking builds, and when it's fine to leave one unpatched.
---

This workspace pins direct/shared deps via `pnpm-workspace.yaml`'s `catalog:`, and forces
versions of *transitive* deps (things no package.json here depends on directly) via its
`overrides:` block in the same file.

**Rule:** for a dependency audit finding,
- If the flagged package is in `catalog:`, bump the catalog entry.
- If it's transitive, add/update an entry under `overrides:` instead — don't try to chase it
  through every intermediate package.
- If two incompatible majors of the same transitive package are needed by different consumers
  (e.g. some tool wants `js-yaml@3`, another wants `js-yaml@4`), pnpm supports version-range-scoped
  override keys: `'pkgname@<majorRange>': '<fixedVersion>'` (e.g. `'js-yaml@3': 3.15.0` and
  `'js-yaml@4': 4.2.0` as separate keys) — a blanket override would break whichever consumer needs
  the other major.
- After editing, run `pnpm install`, then re-run the dependency audit + `pnpm run typecheck` +
  relevant test/smoke suites before trusting the fix.

**Why:** Non-major transitive bumps are usually safe and free; blindly forcing a single version
across all majors, or trying to bump a deeply-nested transitive dep in place, either breaks a
consumer or doesn't stick after reinstall.

**When it's OK to leave a finding unpatched:** if fixing it requires a MAJOR version bump of a
package buried deep in build-only tooling (e.g. `uuid` pulled in transitively through Expo's own
native-build pipeline via `@expo/config-plugins`/`xcode`) with no production runtime exposure,
it's reasonable to leave it and revisit once the upstream tool (e.g. Expo) updates its own
dependency — forcing the bump yourself risks breaking that tool's internals for no real security
gain. Also weigh whether the audited surface is even reachable in production: pure build/dev
tooling (vite, esbuild, postcss, babel, docs generators like typedoc) never runs in the deployed
server process, and some CVEs are platform-specific (e.g. Windows-only bugs) and irrelevant on a
Linux deployment.
