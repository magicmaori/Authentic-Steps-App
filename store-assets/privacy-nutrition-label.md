# Privacy Nutrition Label — Authentic Steps For Youth

Paste-ready answers for **App Store Connect → App Privacy** (iOS) and
**Google Play Console → Data safety** (Android).

Verified against the actual data flows in this codebase as of July 2025.
Re-check before each submission if new routes, SDKs, or third-party services are added.

---

## Architecture overview — where data lives

The app has two storage layers:

| Layer | What | Who can see it |
|---|---|---|
| **On-device** (AsyncStorage) | Journal entries (gratitude, intention, I am), grounding sessions, streak, milestones, completed exercises, app preferences (theme, chime, notifications), randomly-generated anonymous display name | Device owner only — never transmitted in normal app use |
| **Server** (PostgreSQL `user_data` table, keyed by Clerk User ID) | The same fields above — `userData`, `entries`, `groundingSessions`, `completedExercises` — are designed to sync via `PUT /api/sync` | Our server and database, linked to the Clerk User ID |

> **Current mobile client status:** The `PUT /api/sync` endpoint exists on the server and
> the database schema is in place, but the mobile app does not currently call it — there is
> no generated client hook for `/sync` in the OpenAPI spec (`lib/api-spec/openapi.yaml`).
> Data therefore lives on-device only in the current shipping build.
>
> **For privacy label purposes this document adopts the conservative, forward-safe position:**
> because the server infrastructure is in place and the endpoint can receive user content
> linked to identity, all categories that _would_ apply once sync is active are disclosed
> now. This avoids a re-filing when sync is wired up, and Apple/Google prefer
> over-disclosure to under-disclosure.

---

## Summary table — all data types

| What | Where it lives | Leaves the device? | Linked to your account? |
|---|---|---|---|
| Email address | Clerk (auth provider) | Yes | Yes |
| Display name | Clerk (optional — only if set during sign-up) | Yes | Yes |
| Clerk User ID | Clerk + our database (as primary key) + feedback reports | Yes | Yes |
| Journal entries (gratitude, intention, I am text) | Device (AsyncStorage); server-side via `/sync` when/if wired | Currently no; server infrastructure present | Yes — keyed by Clerk User ID |
| Grounding sessions (5-4-3-2-1 records) | Device (AsyncStorage); server-side via `/sync` when/if wired | Currently no; server infrastructure present | Yes — keyed by Clerk User ID |
| Streak, milestones, completed exercises, app preferences | Device (AsyncStorage); server-side via `/sync` when/if wired | Currently no; server infrastructure present | Yes — keyed by Clerk User ID |
| Feedback message (typed by user) | Our server → Linear (internal issue tracker) | Yes | Yes |
| Platform, app version, device OS/version | Sent with feedback reports only | Only if you submit a report | Yes |
| In-app anonymous name (e.g. "WarmOak", randomly generated) | Device (AsyncStorage); included in feedback report `deviceInfo` field | Only if you submit a report | Yes |
| IP address (rate-limiting only) | Server process memory — never written to disk | — | No |
| Crash reports | **Not collected** | — | — |
| Analytics / usage metrics | **Not collected** | — | — |
| Location | **Not collected** | — | — |
| Advertising identifiers | **Not collected** | — | — |

---

## Apple App Store — Privacy Nutrition Label

Complete these answers in **App Store Connect → App Privacy**.

### Data Used to Track You

> Data used to track the user across apps or websites owned by other companies for advertising or analytics.

**None.** The app uses no advertising networks, cross-app tracking SDKs, or advertising identifiers (IDFA).

Select **"No, we do not collect data used to track users"** when prompted.

---

### Data Linked to You

> Data collected that is linked to the user's identity.

#### Contact Info

| Data type | Collected? | Purpose | Optional? |
|---|---|---|---|
| Email Address | **Yes** | App Functionality — account sign-in via Clerk | Required (needed to create an account) |
| Name | **Yes, if provided** | App Functionality — Clerk profile display name | Optional (only if the user enters one during sign-up) |
| Phone Number | No | — | — |
| Physical Address | No | — | — |

#### User Content

| Data type | Collected? | Purpose | Optional? |
|---|---|---|---|
| Other User Content | **Yes** | App Functionality — journal entries (gratitude, intention, I am statements), grounding-session answers; stored on-device and designed to sync to the server (linked to Clerk User ID) | Optional (users can use the app without completing rituals) |
| Customer Support | **Yes** | App Functionality — feedback / bug reports submitted via the in-app "Report a problem" form, routed to our internal issue tracker (Linear) | Optional (only if the user submits a report) |
| Photos or Videos | No | — | — |
| Audio Data | No | — | — |
| Gameplay Content | No | — | — |

#### Identifiers

| Data type | Collected? | Purpose | Optional? |
|---|---|---|---|
| User ID | **Yes** | App Functionality — Clerk-issued User ID used as the database primary key for synced data and attached to feedback reports | Required (needed for account functionality) |
| Device ID | No | — | — |

#### Usage Data

| Data type | Collected? | Purpose | Optional? |
|---|---|---|---|
| Product Interaction | **Yes** | App Functionality — streak data, milestone records, and completed-exercise records stored on-device and designed to sync to the server (linked to Clerk User ID) | Optional (only recorded when you complete a ritual or exercise) |
| Advertising Data | No | — | — |
| Other Usage Data | No | — | — |

#### Other Data

| Data type | Collected? | Purpose | Optional? |
|---|---|---|---|
| Other Data | **Yes** — platform (iOS/Android), app version, device OS/version, and in-app anonymous name sent with feedback reports | App Functionality — helps reproduce bugs | Optional (only if the user submits a report) |

---

### Data Not Linked to You

**None.** All data this app collects or is designed to collect is linked to the authenticated user's Clerk User ID.

---

### All other Apple categories — NOT COLLECTED

- Health & Fitness (no HealthKit integration)
- Financial Info (no in-app purchases, subscriptions, or payment processing)
- Location — Precise or Coarse (never requested)
- Sensitive Info (racial/ethnic origin, religious beliefs, sexual orientation, etc.)
- Contacts (never accessed)
- Browsing History
- Search History
- Purchase History
- Diagnostics — Crash Data (no crash reporting SDK such as Sentry or Crashlytics)
- Diagnostics — Performance Data (no analytics SDK such as Amplitude, Mixpanel, or Firebase)
- Diagnostics — Other Diagnostic Data

---

## Google Play Console — Data Safety

Complete these answers in **Google Play Console → Policy → App content → Data safety**.

### Does the app collect or share any of the required user data types?

**Yes.**

### Is all of the user data collected by the app encrypted in transit?

**Yes.** All communication uses HTTPS/TLS.

### Does the user have a way to request that their data is deleted?

**Yes.** From the Profile tab, users can:
- **"Delete all my data"** — permanently wipes all locally stored journal entries, streaks, milestones, grounding sessions, and preferences from the device. If sync is active, the corresponding server row is also deleted via `DELETE /api/sync`.
- **Sign out** — removes the Clerk session from the device.

Users who want their Clerk authentication record (email address) deleted may contact support.

---

### Data types collected

#### Personal info

| Data type | Collected | Shared | Processed ephemerally | Required | Purposes |
|---|---|---|---|---|---|
| Email address | Yes | No | No | Yes (account) | Account management |
| Name (display name) | Yes, if provided | No | No | No | Account management |
| User IDs (Clerk User ID) | Yes | No | No | Yes | App functionality |

#### App activity

| Data type | Collected | Shared | Processed ephemerally | Required | Purposes |
|---|---|---|---|---|---|
| Other user-generated content (journal entries, grounding sessions) | Yes — stored on-device; server infrastructure in place for sync | No | No | No | App functionality |
| App interactions (streak, milestones, completed exercises) | Yes — stored on-device; server infrastructure in place for sync | No | No | No | App functionality |
| In-app search history | No | — | — | — | — |
| Installed apps | No | — | — | — | — |

#### App info and performance

| Data type | Collected | Shared | Processed ephemerally | Required | Purposes |
|---|---|---|---|---|---|
| Crash logs | No | — | — | — | — |
| Diagnostics | No | — | — | — | — |
| Other app performance data | No | — | — | — | — |

#### Device or other IDs

| Data type | Collected | Shared | Processed ephemerally | Required | Purposes |
|---|---|---|---|---|---|
| Device or other IDs | No | — | — | — | — |

#### All other Play categories — NOT COLLECTED

- Location (Approximate or Precise)
- Financial info (Payment info, Credit info)
- Health and Fitness
- Messages
- Photos and Videos
- Audio files
- Files and docs
- Contacts
- Calendar events
- Web browsing
- SMS or MMS

---

### Special section: Feedback reports

When a user submits an in-app "Report a problem", the following data is sent to our API
server and filed as an issue in our internal Linear workspace:

| Field | Value |
|---|---|
| Message text | The user's typed report (up to 4,000 characters) |
| Platform | `ios` or `android` |
| App version | e.g. `1.0` |
| Device info | OS name + version + in-app anonymous name (e.g. `ios 17.4 — WarmOak`) |
| Clerk User ID | Identifies the account that filed the report |

This data is used solely for diagnosing and fixing issues. It is not sold, used for
advertising, or shared with any party other than Linear (our internal issue tracker).
Feedback submission is optional — users can skip it entirely.

---

## Third-party services

| Service | Purpose | Data received | Used for tracking? |
|---|---|---|---|
| Clerk | Authentication | Email address, name (optional), session tokens | No |
| Linear | Internal feedback / bug triage | Feedback message, platform, app version, device info, Clerk User ID | No |
| Resend | Internal email alert when a feedback report is filed | Feedback message preview, issue URL, Clerk User ID | No |
| Replit Object Storage | Video streaming (onboarding and ritual videos) | No user data — content is served publicly without authentication | No |
| Expo / React Native / EAS | Mobile app runtime and build infrastructure | No additional data beyond the app itself | No |

**No advertising SDKs, analytics SDKs, or crash reporting SDKs are integrated.**

---

## Server-side sync — relevant source files

For reviewers cross-checking disclosures against code:

| File | What it does |
|---|---|
| `artifacts/api-server/src/routes/sync.ts` | `GET/PUT/DELETE /api/sync` — reads and writes the `user_data` table keyed by Clerk User ID. Payload fields: `userData`, `entries`, `groundingSessions`, `completedExercises`, `updatedAt`. |
| `lib/db/src/schema/user-data.ts` | `user_data` table: `user_id` (PK), `data` (jsonb — the full sync payload), `updated_at`. |
| `artifacts/api-server/src/routes/feedback.ts` | `POST /api/feedback` — accepts `message`, `platform`, `appVersion`, `deviceInfo`; files a Linear issue with the Clerk User ID attached. |
| `lib/api-spec/openapi.yaml` | Canonical API contract: only `/healthz`, `/me`, `/feedback` are spec'd. `/sync` is not in the spec and has no generated client hook — the mobile app does not currently call it. |
| `artifacts/authentic-steps/context/AppContext.tsx` | All user-generated content is saved exclusively to AsyncStorage in the current mobile build. |

---

## Notes for App Store Connect submission

1. Under **App Privacy → Data types**, select:
   - Contact Info → Email Address
   - Contact Info → Name
   - User Content → Other User Content
   - User Content → Customer Support
   - Identifiers → User ID
   - Usage Data → Product Interaction
   - Other Data → Other Data
2. For each selected type:
   - **Primary purpose:** App Functionality
   - **Is data linked to identity?** Yes
   - **Is data used for tracking?** No
3. Apple displays your answers as a "privacy nutrition label" on the product page.
4. The **Privacy Policy URL** (`https://authenticsteps.com.au/privacy`) must be live and
   accurate before Apple accepts the submission.
5. If you add crash reporting, analytics, or new third-party SDKs in a future release,
   update this document and re-file the privacy answers before submitting the new build.
6. When the mobile client begins calling `PUT /api/sync`, the existing disclosures already
   cover it — no re-filing is needed, provided no new data types are introduced.

## Notes for Google Play Console submission

1. Navigate to **Policy → App content → Data safety** and click **Start**.
2. Answer the collection questions using the tables above.
3. After completing the form, Play Console generates a summary card — review it against this
   document before publishing.
4. Ensure the **Privacy Policy URL** is live before submitting.
5. Answer **Yes** to "Can users request that data is deleted?".
6. For Play Console's definition of "collected" (data that leaves the device): feedback data
   and auth data are collected today; user-generated content (journals, grounding, progress)
   is on-device only in the current build. Disclose user content as collected given the
   server infrastructure is in place — this is the conservative, safe position.
