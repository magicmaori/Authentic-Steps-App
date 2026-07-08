---
name: Mocking expo-file-system (new File/Directory API) in jest-expo tests
description: How to override jest-expo's built-in expo-file-system mock and avoid a __mocks__ naming footgun.
---

`jest-expo`'s preset setup already calls `jest.mock('expo-file-system', () => ({...legacy API...}))` internally. A bare `jest.mock('expo-file-system')` (no factory) in a test file does NOT override that — you keep getting jest-expo's legacy-API mock. Force your own mock by passing an explicit factory: `jest.mock('expo-file-system', () => require('<path-to-your-mock>'))`.

Do NOT name/place that mock file `__mocks__/expo-file-system.ts` (Jest's manual-mock convention for node_modules packages) — requiring it from inside a `jest.mock` factory recurses infinitely (Jest treats the require as re-entering the same automock). Put the mock in a plain helper path instead (e.g. `test-helpers/expoFileSystemMock.ts`) and reference it explicitly.

**Why:** cost ~30 min of debugging (silently-swallowed errors in try/catch masked the root cause, then two separate jest.mock quirks compounded it).

**How to apply:** any test exercising expo-file-system's new `File`/`Directory`/`Paths` API (SDK 54+, expo-file-system ~19.x) in this project's Expo app.
