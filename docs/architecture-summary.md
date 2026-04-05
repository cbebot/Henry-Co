# Architecture summary

## Monorepo

- **Package manager:** pnpm workspaces (`apps/*`, `packages/*`).
- **Node:** 24.x (see root `package.json` engines).

## HenryCo Super App (Expo)

### Layers

1. **Routes** — `app/` (expo-router): tabs + stack for `module/[slug]` and `legal/*`.
2. **Features** — `src/features/*` screen components (presentational + local state).
3. **Domain** — `src/domain/*` types, catalogs, zod schemas.
4. **Platform** — `src/platform/*`:
   - `contracts/*` — interfaces for auth, database, media, notifications, payments, analytics, monitoring.
   - `adapters/*` — mock, Supabase, Expo, Cloudinary, Sentry, deferred payments.
   - `bundle.ts` — `createPlatformBundle()` selects implementations from `RuntimeMode` + `FeatureFlags` + env.
5. **Providers** — `PlatformProvider` exposes `usePlatform()` to the tree.

### Runtime modes

- **`local`** — default in `__DEV__` when `EXPO_PUBLIC_HENRYCO_ENV` unset.
- **`staging`** — release builds default here if env not forced to production (see `runtime.ts`).
- **`production`** — requires explicit env; live adapters additionally gated by `EXPO_PUBLIC_LIVE_SERVICES_APPROVED`.

### Data flow (example)

- **Divisions:** `useDivisions` → `database.fetchDivisions()` → mock rows or Supabase `divisions` table → fallback `DIVISION_CATALOG`.
- **Contact:** `ContactScreen` → `database.submitContact()` → mock store or `contact_submissions` insert.

### Web vs native

- Same codebase; Expo web static export used for smoke verification.
- Push and some native modules are no-ops or mocked on web.

## Division apps (Next.js)

Each vertical (`hub`, `marketplace`, `jobs`, etc.) is an independent Next.js app with its own env, auth integration, and deployment. They are **not** embedded in the Super App; the Super App links out via `destination_url` and in-app browser where applicable.

## CI (root)

- `pnpm run ci:validate` — lint all apps, typecheck all apps, super-app tests, build all apps.

## Security

- No service role keys in client bundles.
- Super App reads only `EXPO_PUBLIC_*` at runtime (plus Zod-validated defaults in `getEnv()`).
