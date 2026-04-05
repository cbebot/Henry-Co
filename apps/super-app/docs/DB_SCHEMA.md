# Database Schema (Super App)

Staging-first Postgres schema managed through Supabase migrations.

## Tables

### `public.divisions`

| Column            | Type        | Notes                                      |
| ----------------- | ----------- | ------------------------------------------ |
| `id`              | `uuid`      | Primary key                                |
| `slug`            | `text`      | Unique key used in deep links              |
| `name`            | `text`      | Display name                               |
| `status`          | `text`      | `active`, `coming_soon`, `paused`, …       |
| `featured`        | `boolean`   | Featured hub rail                          |
| `summary`         | `text`      | Short marketing copy                       |
| `accent_hex`      | `text`      | Division accent color                      |
| `destination_url` | `text`      | Canonical public website                   |
| `sectors`         | `text[]`    | Filter facets for directory views          |
| `updated_at`      | `timestamptz` | Freshness                               |

**RLS:** public read.

### `public.profiles`

Mirrors authenticated users (linked to `auth.users`).

**RLS:** users can `select` / `update` / `insert` their own row.

### `public.contact_submissions`

Corporate contact form entries from the mobile app.

**RLS:** `anon` + `authenticated` may `insert` (staging posture).

## Triggers

- `on_auth_user_created` — creates a `profiles` row when a new `auth.users` row is inserted.

## Regenerating types

After schema changes:

```bash
supabase gen types typescript --project-id <staging> > apps/super-app/src/core/database.types.ts
```

Review and merge carefully; keep `Relationships` arrays accurate.
