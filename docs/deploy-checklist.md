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

- [ ] Confirm app mapping in `docs/vercel-project-map.md` is still accurate.
- [ ] Apply any required DB migrations before promoting app builds.
- [ ] Per-app Vercel linkage and env vars are present for Preview and Production.
- [ ] Preview smoke checks pass for each changed app:
  - [ ] authentication/login
  - [ ] one critical dashboard route
  - [ ] one critical mutation route (support/wallet/ops/queue as applicable)
  - [ ] no sensitive auth or cron endpoint is callable without valid auth/signature
- [ ] Shared package change impact reviewed against `docs/redeploy-impact-matrix.md`.
- [ ] No service keys in `NEXT_PUBLIC_*`.
- [ ] Rollback path confirmed (previous successful deployment retained).

## Post-deploy

- [ ] Update [feature-status.md](./feature-status.md) staging connection table.
- [ ] Append issues to [known-issues.md](./known-issues.md).
- [ ] Update [intelligence-rollout-status.md](./intelligence-rollout-status.md) if behavior changed.
