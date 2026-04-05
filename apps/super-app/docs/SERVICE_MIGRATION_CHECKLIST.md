# Service migration checklist (HenryCo Super App)

Use this when swapping **mock / deferred** adapters for **real providers**. No app rewrite should be needed—only config, secrets, and adapter implementations behind the existing interfaces.

## Environment matrix

| Mode        | Set `EXPO_PUBLIC_HENRYCO_ENV` | Live gate                          |
| ----------- | ----------------------------- | ---------------------------------- |
| **local**   | `local` (or default in dev)   | None; mocks by default             |
| **staging** | `staging`                     | Sandbox / non-prod credentials only |
| **production** | `production`              | `EXPO_PUBLIC_LIVE_SERVICES_APPROVED=true` |

## Adapters and what to change

### 1. Auth (`AuthAdapter`)

| Stage now | Implementation                         |
| --------- | -------------------------------------- |
| Local     | `MockAuthAdapter` (AsyncStorage)       |
| Remote    | `SupabaseAuthAdapter` when Supabase client exists and `remoteDatabase` flag on |

**To enable real auth (staging/prod):**

1. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Ensure `EXPO_PUBLIC_FEATURE_REMOTE_DATABASE=true` (default on staging/production when approved).
3. Optional: add `AuthAdapter` implementation for Clerk/Auth0 instead of Supabase—swap in `createPlatformBundle()`.

---

### 2. Database (`DatabaseAdapter`)

| Stage now | Implementation                          |
| --------- | --------------------------------------- |
| Local     | `MockDatabaseAdapter` (contacts on-device; divisions from bundle or mock fetch) |
| Remote    | `SupabaseDatabaseAdapter`               |

**To enable:**

1. Apply SQL migrations (`supabase/migrations`).
2. Configure Supabase keys as above.
3. Extend `SupabaseDatabaseAdapter.listActivity()` when a unified `activity` table exists.

---

### 3. Media (`MediaAdapter`)

| Stage now | Implementation                          |
| --------- | --------------------------------------- |
| Local     | `MockUploadMediaAdapter` (fake upload) + Cloudinary **read** URLs |
| Staging+  | `CloudinaryMediaAdapter` (upload returns error until signed upload implemented) |

**To enable uploads:**

1. Implement signed upload (Edge Function or server) and replace `uploadLocalFile` body in a new adapter class.
2. Set `EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD=true` where appropriate.

---

### 4. Notifications (`NotificationsAdapter`)

| Stage now | Implementation              |
| --------- | --------------------------- |
| Local     | `MockNotificationsAdapter`  |
| Staging+  | `ExpoNotificationsAdapter` when `livePush` flag on |

**To enable:**

1. Set EAS `projectId` in `app.json`.
2. Configure push credentials in EAS.
3. Backend to store Expo push tokens (e.g. Supabase table + Edge Function).

---

### 5. Payments (`PaymentsAdapter`)

| Stage now | Implementation           |
| --------- | ------------------------ |
| Local     | `MockPaymentsAdapter`    |
| Staging+  | `DeferredPaymentsAdapter` (returns “not implemented”) until provider exists |

**To enable:**

1. Add `StripePaymentsAdapter` (or Paystack, etc.) implementing `PaymentsAdapter`.
2. Register it in `createPlatformBundle()` when `flags.payments && mode !== "local"`.
3. Store **only** publishable keys in `EXPO_PUBLIC_*`; secrets on server/EAS.

---

### 6. Analytics (`AnalyticsAdapter`)

| Stage now | Implementation              |
| --------- | --------------------------- |
| Local     | `ConsoleAnalyticsAdapter`   |
| Staging+  | Console or `NoOpAnalyticsAdapter` |

**To enable:**

1. Add `PostHogAnalyticsAdapter` / Segment implementing `AnalyticsAdapter`.
2. Wire in bundle when `flags.analytics`.

---

### 7. Monitoring (`MonitoringAdapter`)

| Stage now | Implementation              |
| --------- | --------------------------- |
| Default   | `NoOpMonitoringAdapter`     |
| Optional  | `SentryMonitoringAdapter` when `liveMonitoring` + `EXPO_PUBLIC_SENTRY_DSN` |

**To enable:**

1. Set DSN in env.
2. Approve live services in production if applicable.

---

## Feature flags (quick reference)

| Variable                               | Effect                                      |
| -------------------------------------- | ------------------------------------------- |
| `EXPO_PUBLIC_FEATURE_PAYMENTS`         | Real/sandbox payment adapter path           |
| `EXPO_PUBLIC_FEATURE_ANALYTICS`        | Analytics sink vs no-op                     |
| `EXPO_PUBLIC_FEATURE_LIVE_PUSH`        | Expo push vs mock                           |
| `EXPO_PUBLIC_FEATURE_LIVE_MONITORING`  | Sentry vs no-op                             |
| `EXPO_PUBLIC_FEATURE_REMOTE_DATABASE`  | Supabase vs mock DB                         |
| `EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD`     | Real upload vs mock / disabled              |

---

## Verification order

1. **Local:** `pnpm start` with no `.env` → sign in with mock auth, send contact, mock checkout, browse all tabs/modules.
2. **Staging:** set `EXPO_PUBLIC_HENRYCO_ENV=staging` + Supabase staging keys → confirm contact row in `contact_submissions`.
3. **Production:** set `production` + `EXPO_PUBLIC_LIVE_SERVICES_APPROVED=true` only after review → ship build.
