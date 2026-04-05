# HenryCo Super App

Premium cross-platform **Expo + React Native + TypeScript** client for the Henry & Co. ecosystem. This package follows **clean architecture** with feature modules, a shared design system, **Supabase** data access, **Cloudinary** media helpers, **Sentry** monitoring hooks, and **staging-first** configuration.

## Quick start (local-first)

```bash
# from repository root
pnpm install
cd apps/super-app
pnpm start
```

**No backend required:** with default `local` runtime (`__DEV__`), the app uses **mock auth**, **mock database** (on-device contact storage), **mock payments**, and **console analytics**. Sign in with any email and password (8+ characters).

Optional: copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_HENRYCO_ENV=staging` plus Supabase keys to exercise real staging services.

Copy `.env.staging.example` to `.env.staging.local` when targeting a named staging file layout.

> Never commit real credentials. Production deploys are out of scope for this branch.

## Scripts

| Script        | Description                              |
| ------------- | ---------------------------------------- |
| `pnpm start`  | Expo dev server                          |
| `pnpm lint`   | ESLint (flat config + Expo preset)       |
| `pnpm typecheck` | `tsc --noEmit`                        |
| `pnpm test`   | Jest unit tests                          |
| `pnpm db:seed`| Optional Node seed (requires service role) |

## Docs

- `../../docs/GITHUB_SOURCE_OF_TRUTH.md` — GitHub-only CI, Vercel, EAS, branch protection
- `docs/SERVICE_MIGRATION_CHECKLIST.md` — enabling real providers behind adapters
- `docs/ARCHITECTURE.md` — layering, navigation, backend boundaries
- `docs/COMPONENT_INVENTORY.md` — UI primitives and feature entry points
- `docs/DEPLOYMENT.md` — staging deployment notes (no production automation)
- `docs/APP_STORE_CHECKLIST.md` — release readiness
- `docs/MIGRATION_LOG.md` — external integration changelog

## Database

SQL migrations live in `supabase/migrations`. Apply them to a **staging** Supabase project before expecting remote data.

## Deep linking

- Custom scheme: `henryco://`
- Staging universal links: `https://staging.henrycogroup.com/app/...` (host must be verified before relying on autoVerify)

## Testing focus

Critical automated coverage today:

- Division catalog filtering
- Cloudinary URL builder
- Contact form schema validation

Add React Native Testing Library specs per feature as flows harden.
