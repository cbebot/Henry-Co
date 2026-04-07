# Deployment (Staging-first)

See also the monorepo guide: `docs/GITHUB_SOURCE_OF_TRUTH.md` (GitHub Actions, Vercel, EAS, approvals).

## Prerequisites

1. **Expo account** with a dedicated **staging** EAS project.
2. **Supabase staging** project with migrations applied from `supabase/migrations`.
3. **Sentry** staging DSN (optional but recommended).
4. **Cloudinary** cloud name + folder conventions (defaults align with the public hub).

## Environment

Copy `.env.staging.example` to `.env.staging.local` (gitignored) and populate **staging-only** values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SENTRY_DSN` (optional)
- `EXPO_PUBLIC_CLOUDINARY_*` overrides if needed

Never commit `.env.staging.local` or production keys.

## Database

From the Supabase dashboard or CLI (staging):

```bash
# Example — verify CLI is linked to staging before running
supabase db push
```

Seed / refresh division rows (optional):

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node apps/super-app/scripts/seed.mjs
```

## Mobile builds

1. Install EAS CLI (`npm i -g eas-cli`).
2. Replace `extra.eas.projectId` in `app.json` with the staging project ID.
3. Run `eas build --profile staging` once profiles are defined in `eas.json` (add locally; do not commit secrets).

## Web (optional)

`expo export -p web` can produce static hosting artifacts for internal demos — keep them off production domains until reviewed.

## What we intentionally do **not** automate here

- Production deploys
- DNS / universal-link verification for production hosts
- Secret rotation

See `./MIGRATION_LOG.md` for integration checkpoints.
