# Beta release — Super App

**No store submission** from automation — this doc is for human-driven TestFlight / Play Internal Testing.

## App identity

| Field | Value (current) |
| --- | --- |
| Display name | HenryCo (`app.json` → `expo.name`) |
| Slug | `henryco-super-app` |
| Version | `1.0.1` (`app.json` → `expo.version`) |
| iOS build | `2` (`ios.buildNumber`) |
| Android `versionCode` | `2` |
| iOS bundle id | `com.henryco.superapp.staging` |
| Android package | `com.henryco.superapp.staging` |

Update version/build numbers per release train.

## EAS profiles

See `apps/super-app/eas.json`:

- **preview** — internal distribution, `EXPO_PUBLIC_APP_ENV=staging`, `EXPO_PUBLIC_HENRYCO_ENV=staging`
- **staging** — same channel naming for QA
- **production** — reserved for future; requires production env review

## Commands (from repo root)

```bash
pnpm --filter @henryco/super-app exec eas build --profile staging --platform android
pnpm --filter @henryco/super-app exec eas build --profile staging --platform ios
```

Requires: EAS CLI logged in, Apple/Google credentials configured, **real** `extra.eas.projectId`.

## Release notes (draft)

- MVP hub for HenryCo divisions with directory and module detail screens.
- Local mock auth for developer testing; optional Supabase in staging.
- Legal and contact flows; contact writes to staging database when configured.
- Payment and upload flows **not** production-ready — disabled/hidden by default in staging.

## Tester instructions

1. Install internal build from EAS link.
2. Open app → confirm Hub loads.
3. Browse Directory → open at least two divisions.
4. Account → if staging auth configured, sign in with **staging** test user; else use local mock build for UI-only.
5. Report crashes via Sentry (if enabled) or with screenshot + steps in issue tracker.
6. Do **not** use production passwords or payment cards.

## Related

- [deploy-checklist.md](./deploy-checklist.md)
- [staging-validation.md](./staging-validation.md)
- [qa-report.md](./qa-report.md)
