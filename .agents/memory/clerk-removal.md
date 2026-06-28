---
name: Clerk removal
description: Why Clerk was removed and how the app handles auth now
---

## Rule
Do NOT add @clerk/expo back. The app runs fully in guest/AsyncStorage mode.

**Why:** @clerk/expo requires the ClerkExpo native module, which is not bundled in Expo Go. This caused `<ClerkLoaded>` to never fire, resulting in a permanent blank screen on web preview, Android, and iOS. The app never actually used Clerk functionally — all data was anonymous/AsyncStorage anyway.

**How to apply:**
- All users are implicitly "guests" — no sign-in gate anywhere in the routing
- OnboardingGate in `app/_layout.tsx` only checks `userData.hasOnboarded`
- `scheduleSyncPush` in `AppContext.tsx` is intentionally a no-op
- If cloud sync is needed in future, use a token-free approach (recovery code / anonymous ID) rather than Clerk JWT
