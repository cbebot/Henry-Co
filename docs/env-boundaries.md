# HenryCo Environment Boundaries

This repo tracks examples only. Real env files stay local or in Vercel/Supabase.

## Tracked vs local

- Track: `**/.env.example`, `**/.env.*.example`
- Keep local only: `.env`, `.env.local`, `.env.production.local`, `.vercel/.env.production.local`, `.env.vercel.*`
- Never commit pulled env snapshots or generated secret dumps

## Public vs server-only

- `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` are browser/mobile-public configuration only
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use a public prefix
- Keep service-role keys, cron secrets, webhook secrets, API secrets, and private tokens out of client components, public runtime providers, metadata, and tracked env files

## Supabase naming

- Public runtime:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only runtime:
  - `SUPABASE_SERVICE_ROLE_KEY`

## Local verification scripts

Use local-only production mirrors such as:

- `.env.production.local`
- `.vercel/.env.production.local`
- app-specific ignored files such as `.env.vercel.production.<app>`

Do not reintroduce `.env.production.vercel` as a shared repo convention.

## Automated guardrails

- `pnpm run guardrails:repo` scans tracked repo truth
- `pnpm run guardrails:staged` scans staged files before commit through `.husky/pre-commit`
- GitHub Actions runs the same repo guardrail before lint, typecheck, tests, or builds

The guardrails currently block:

- tracked `.env*` files unless they are `.env.example` or `.env.*.example`
- public-prefixed server-secret names such as `NEXT_PUBLIC_*SECRET*`, `NEXT_PUBLIC_*SERVICE_ROLE*`, and similar `EXPO_PUBLIC_*` mistakes
- non-placeholder literal assignments to sensitive server env keys in tracked env-style files
- high-confidence leaked secret literals such as private key blocks or provider tokens

## Rotation response

If a guardrail catches a real secret or token:

1. Rotate or revoke it at the provider first
2. Remove it from tracked files, staged diffs, and branch history where required
3. Replace the tracked surface with an example template or ignored local env file
4. Re-run `pnpm run guardrails:repo` before merge
