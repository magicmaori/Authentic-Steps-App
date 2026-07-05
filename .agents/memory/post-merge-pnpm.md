---
name: post-merge pnpm rebuild
description: Why the post-merge script must run pnpm with CI=true and a generous timeout after any pnpm hoist/config change.
---

# Post-merge pnpm rebuild

`scripts/post-merge.sh` must `export CI=true` before `pnpm install`.

**Why:** Any change to pnpm's node_modules layout — e.g. adding a
`public-hoist-pattern[]` line to `.npmrc` (done to make `@types/react`
resolvable to RN class-component libs like expo-linear-gradient / expo-blur /
react-native-gesture-handler) — forces pnpm to remove and rebuild the modules
directory on the next install. Post-merge runs non-interactively with stdin
closed, so pnpm aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` unless
`CI=true` is set. This silently broke post-merge setup on *every* merge (deps
weren't rebuilt, migrations didn't run) even though the merges themselves
succeeded.

**How to apply:** Keep `export CI=true` in the post-merge script. The first
rebuild after a hoist/layout change is slow (full node_modules rebuild), so the
post-merge timeout is set to 180000ms (was 20000ms, which the first rebuild
exceeded at ~21s). Don't drop the timeout back down. If post-merge fails with a
pnpm TTY/abort error, the fix is the CI env var, not the lockfile.
