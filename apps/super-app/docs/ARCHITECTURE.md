# HenryCo Super App — Architecture

## Overview

The super app is an **Expo (React Native) + TypeScript** client that follows **feature-sliced** structure:

- **`app/`** — Expo Router routes only (thin composition).
- **`src/core/`** — environment validation, Supabase client, Cloudinary helpers, Sentry bootstrap, linking, push scaffolding.
- **`src/domain/`** — shared types, static catalogs, Zod schemas.
- **`src/design-system/`** — theme tokens and reusable UI primitives.
- **`src/features/`** — user-facing flows (hub, directory, legal, account, division modules).
- **`src/services/`** — data access facades over Supabase and remote APIs.
- **`src/providers/`** — cross-cutting React providers.

## Navigation

- **Tabs:** Hub, Directory, Divisions, Account.
- **Stacks:** `legal/*` for global pages, `module/[slug]` for division detail surfaces.
- **Deep links:** `henryco://` scheme plus staging universal links (`https://staging.henrycogroup.com/app/...`).

## Backend

- **Supabase Postgres** holds `divisions`, `profiles`, and `contact_submissions` (see `supabase/migrations`).
- **RLS** is enabled; anonymous users may insert corporate contact submissions in staging configurations.
- **Typed client** via `src/core/database.types.ts` (regenerate when schema changes).

## Media

- **Cloudinary** URLs are composed in `src/core/cloudinary.ts` using public IDs under the `henryco/` folder.

## Observability

- **Sentry** initializes when `EXPO_PUBLIC_SENTRY_DSN` is set; otherwise it no-ops.

## Testing

- **Jest + jest-expo** cover catalog filtering, URL builders, and form schemas. Expand with React Native Testing Library for screens.

## Staging-first rules

- No production credentials in repo.
- EAS `projectId` and Supabase IDs are placeholders until staging resources are approved.
- Do not rotate secrets or enable billing without explicit sign-off.
