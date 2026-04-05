# Staging validation — Super App

**Rule:** Use **staging-only** Supabase, Sentry, and payment **test** keys. Never point this checklist at production data.

## Preconditions

- Staging project URL + anon key in EAS env or `.env.staging.local` (not committed).
- Test devices registered for internal distribution.

## Connect in order (stop and test after each)

### 1. Auth

1. Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Keep `EXPO_PUBLIC_FEATURE_REMOTE_DATABASE=true` (staging default).
3. Build or `expo start` with `EXPO_PUBLIC_HENRYCO_ENV=staging`.
4. **Test:** Account → sign up / sign in (email) → session shows email → sign out.

**Pass criteria:** No mock banner; errors surfaced clearly if RLS denies.

### 2. Database

1. Run `node apps/super-app/scripts/seed.mjs` with **service role** against staging.
2. **Test:** Directory and Hub show divisions from Supabase (names/slugs match seed).
3. **Test:** Legal → Contact → submit → row in `contact_submissions`.

**Pass criteria:** Inserts succeed; list endpoints match RLS expectations.

### 3. Media

1. Confirm `EXPO_PUBLIC_CLOUDINARY_*` points at staging-safe folder (e.g. `henryco/staging`).
2. **Test:** Hub logo / module imagery load (read-only URLs).
3. Upload: keep `EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD=false` until signed upload exists.

**Pass criteria:** No broken hero images; no unsigned upload errors in UI.

### 4. Monitoring

1. Set `EXPO_PUBLIC_SENTRY_DSN` (staging DSN).
2. `EXPO_PUBLIC_FEATURE_LIVE_MONITORING=true`.
3. **Test:** Trigger a handled test error or Sentry test event.

**Pass criteria:** Event visible in Sentry staging project.

### 5. Payments sandbox

1. Keep `EXPO_PUBLIC_FEATURE_PAYMENTS=true` only when PSP adapter lands.
2. Until then, expect `DeferredPaymentsAdapter` — **optional:** set `EXPO_PUBLIC_FEATURE_PAYMENTS=false` to avoid confusing testers.
3. **Test:** No crash when opening Account; no accidental live charges.

**Pass criteria:** Clear UX (disabled or “not available”) until Stripe/Paystack wired.

## Regression bundle

After all steps: run Hub → Directory → each featured module slug → Account → Legal contact → Privacy.

Log failures in [known-issues.md](./known-issues.md) and update [feature-status.md](./feature-status.md) staging table.
