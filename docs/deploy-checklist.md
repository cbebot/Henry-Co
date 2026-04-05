# Deploy checklist

## Super App — staging / beta

- [ ] Create or select **staging** Supabase project; run migrations.
- [ ] Set EAS secrets / env from `apps/super-app/.env.staging.example`.
- [ ] Replace `extra.eas.projectId` in `app.json` with real EAS project ID.
- [ ] `pnpm --filter @henryco/super-app run typecheck` && `pnpm test:workspace`
- [ ] `eas build --profile staging --platform android` (and iOS when certs ready).
- [ ] Smoke on device: Hub → Directory → Module → Account (mock or staging auth).
- [ ] Verify Sentry receives a test event (if enabled).
- [ ] Confirm `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` is **not** `true` for staging builds.

## Super App — production (future)

- [ ] Legal sign-off on store listing + privacy policy URLs.
- [ ] Production Supabase + RLS audit.
- [ ] `EXPO_PUBLIC_HENRYCO_ENV=production`
- [ ] `EXPO_PUBLIC_LIVE_SERVICES_APPROVED=true` only after written approval.
- [ ] Swap iOS/Android bundle IDs from `.staging` to production identifiers when ready.
- [ ] Source maps + Sentry release alignment.

## Monorepo web apps

- [ ] Per-app Vercel/project linkage and env vars.
- [ ] Preview URL smoke after merge to main.
- [ ] No service keys in `NEXT_PUBLIC_*`.

## Post-deploy

- [ ] Update [feature-status.md](./feature-status.md) staging connection table.
- [ ] Append issues to [known-issues.md](./known-issues.md).
