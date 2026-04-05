# Environment variables

## Super App (`apps/super-app`)

All client-visible variables use the `EXPO_PUBLIC_` prefix (embedded at build time).

| Variable | Required | Description |
| --- | --- | --- |
| `EXPO_PUBLIC_HENRYCO_ENV` | No | `local` \| `staging` \| `production`. Default: `local` in dev, else `staging` in release builds without override. |
| `EXPO_PUBLIC_APP_ENV` | No | Legacy label: `development` \| `staging` \| `production`. |
| `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` | Prod live | Must be `true` to allow production live adapters (payments, remote DB, etc.). |
| `EXPO_PUBLIC_SUPABASE_URL` | For remote DB | Staging/production Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | For remote DB | Supabase anon key (respect RLS). |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | No | Defaults in `getEnv()` if unset. |
| `EXPO_PUBLIC_CLOUDINARY_BASE_PATH` | No | Folder prefix for delivery URLs. |
| `EXPO_PUBLIC_SENTRY_DSN` | For Sentry | Public DSN only. |
| `EXPO_PUBLIC_WEB_ORIGIN` | No | Deep link / web origin helper. |
| `EXPO_PUBLIC_FEATURE_PAYMENTS` | No | Per-flag override (see `featureFlags.ts`). |
| `EXPO_PUBLIC_FEATURE_ANALYTICS` | No | |
| `EXPO_PUBLIC_FEATURE_LIVE_PUSH` | No | |
| `EXPO_PUBLIC_FEATURE_LIVE_MONITORING` | No | |
| `EXPO_PUBLIC_FEATURE_REMOTE_DATABASE` | No | |
| `EXPO_PUBLIC_FEATURE_MEDIA_UPLOAD` | No | |
| `EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO` | No | Account “mock checkout” button; default **on** local, **off** staging. |
| `EXPO_PUBLIC_FEATURE_RUNTIME_DIAGNOSTICS` | No | Account runtime strip; default **on** local, **off** staging. |

### Server-only (scripts, never ship in app)

| Variable | Used by |
| --- | --- |
| `SUPABASE_URL` | `scripts/seed.mjs`, `scripts/reset-staging.mjs` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same — **staging only**, rotation required if leaked |

Templates:

- `apps/super-app/.env.example` — local / generic.
- `apps/super-app/.env.staging.example` — staging-focused.

## Next.js apps (`apps/*` except super-app)

Each app documents its own `.env.example` (if present). Typical patterns:

- `NEXT_PUBLIC_*` for browser-safe config.
- Server secrets without prefix for API routes / server components.

**Rule:** Never commit `.env.local` or production secrets.

## Secret scan

Repo grep for `sk_live`, long `api_key` literals, and passwords should stay clean. Re-run before release:

`rg -i "sk_live|sk_test|api_key\\s*[:=]" apps packages --glob '*.{ts,tsx,js}'`
