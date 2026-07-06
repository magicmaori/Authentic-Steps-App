---
name: Testing navigator.clipboard with @testing-library/user-event
description: Why a Vitest/RTL spy on navigator.clipboard.writeText can silently record zero calls, and the fix.
---

`userEvent.setup()` (current `@testing-library/user-event` versions) installs its own
`navigator.clipboard` stub as part of setup. If you `Object.defineProperty(navigator,
"clipboard", ...)` or otherwise mock the clipboard *before* calling `userEvent.setup()`
(e.g. in a shared `beforeEach`), `setup()` silently replaces your mock with its own —
the component under test then calls a different `writeText` than the one your test is
asserting against, so `expect(writeText).toHaveBeenCalledWith(...)` fails with "0 calls"
even though the click handler ran correctly.

**Why:** button clicks look like they don't trigger the handler at all, but a plain DOM
`.click()` shows the same "0 calls" result, which points to identity mismatch, not a
missing event.

**How to apply:** create the `user = userEvent.setup()` instance first, then spy on the
clipboard it installed: `vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)`.
Do this inside each test (or a helper called after `setup()`), not in a `beforeEach` that
runs before `setup()`.
