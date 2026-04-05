# HenryCo Super App

Premium cross-platform **Expo + React Native + TypeScript** client for the Henry & Co. ecosystem. This package follows **clean architecture** with feature modules, a shared design system, **Supabase** data access, **Cloudinary** media helpers, **Sentry** monitoring hooks, and **staging-first** configuration.

## Quick start

```bash
# from repository root
pnpm install
cd apps/super-app
pnpm start
```

Copy `.env.staging.example` to `.env.staging.local` and provide **staging** Supabase keys before exercising auth or the contact form.

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
