# Staging dataset plan

This monorepo spans **multiple products**. The Super App seed today covers **`divisions`** only (`apps/super-app/scripts/seed.mjs`). Use this document to track **required** staging personas and demo entities per vertical.

## Test accounts (create in Supabase Auth *staging* or IdP sandbox)

| Persona | Email pattern | Purpose |
| --- | --- | --- |
| Admin | `staging-admin+<date>@henrycogroup.com` | Break-glass / config |
| Staff | `staging-staff+<date>@henrycogroup.com` | Internal workflows |
| Customer | `staging-customer+<date>@henrycogroup.com` | Buyer / learner |
| Vendor | `staging-vendor+<date>@henrycogroup.com` | Seller / provider |

**Password policy:** Use a password manager; rotate after shared QA cycles.

## Demo content (per vertical — to be scripted)

| Domain | Entities | Script / location |
| --- | --- | --- |
| Super App | `divisions` rows | `apps/super-app/scripts/seed.mjs` ✅ |
| Marketplace | Listings, carts, orders | *Add under `apps/marketplace` when schema frozen* |
| Jobs | Jobs, applications | *Add under `apps/jobs`* |
| Learn | Courses, lessons, enrollments | *Add under `apps/learn`* |
| Property | Listings, saved | *Add under `apps/property`* |
| Logistics | Jobs, pricing tiers | *Add under `apps/logistics`* |
| Studio | Projects, proposals | *Add under `apps/studio`* |

## Reset

- **Dry run / checklist:** `node apps/super-app/scripts/reset-staging.mjs`
- **Execute path:** intentionally not implemented — extend `reset-staging.mjs` with explicit `delete`/`truncate` per table after legal/compliance sign-off.

## Seeding commands

```bash
# Divisions (super-app)
set SUPABASE_URL=https://xxxx.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=***staging***
node apps/super-app/scripts/seed.mjs
```

**Never** use production service role keys with these scripts.
