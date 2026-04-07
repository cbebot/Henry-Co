# Redeploy impact matrix

Use this matrix to prevent stale production behavior after shared changes.

## Shared package changes

| Changed path | Mandatory redeploy targets |
| --- | --- |
| `packages/config/**` | `hub`, `account`, `staff`, `care`, `studio`, `marketplace`, `property`, `logistics`, `jobs`, `learn` |
| `packages/ui/**` | `hub`, `account`, `staff`, `care`, `studio`, `marketplace`, `property`, `logistics`, `jobs`, `learn` |
| `packages/i18n/**` | Any app consuming shared locale resolution (`hub`, `account`, `staff`, `learn`, `jobs`, `marketplace`, `property`, `care`, `studio`, `logistics`) |
| `packages/intelligence/**` | `account`, `staff`, and any app importing intelligence contracts |
| `packages/brand/**` | Apps that consume brand registry directly |

## App-local changes

| Changed path | Mandatory redeploy targets |
| --- | --- |
| `apps/account/**` | `account` |
| `apps/staff/**` | `staff` |
| `apps/hub/**` | `hub` |
| `apps/<division>/**` | that division app |

## DB/migration changes

| Changed path | Mandatory follow-up |
| --- | --- |
| `apps/*/supabase/migrations/**` | Apply migrations in target environment before app promotion |
| auth/role/RLS migrations | Run role-boundary sanity checks on `account`, `staff`, `hub` |
| notification/task/event schema changes | Run support/notification/task workflow sanity checks |

## Hard rule

Never promote production based only on “one app built locally” when changed files include shared packages or shared DB migrations.

