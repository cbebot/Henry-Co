# Feature status — classification

**Scope:** Primary detail for **Super App** (`apps/super-app`). Division Next.js apps are summarized; drill into each app for page-level status.

**Legend:** `full` = fully implemented · `partial` · `mocked` · `placeholder` · `blocked-ext` = blocked by external service · `blocked-biz` = blocked by business decision

## Super App — feature table

| Module | Screen / feature | Status | Dependency | Blocker | Next action |
| --- | --- | --- | --- | --- | --- |
| Hub | Tab home / division cards | `partial` | Bundled catalog + optional Supabase | None for local | Point CTAs to real URLs; verify analytics |
| Directory | Search / list divisions | `partial` | Catalog + `DatabaseAdapter.fetchDivisions` | Remote list empty without seed | Run `seed.mjs` on staging |
| Services | Division services overview | `partial` | Same as directory | Content is marketing copy | Align with hub marketing |
| Account | Mock sign-in | `mocked` | `MockAuthAdapter` | — | Swap to Supabase when staging auth on |
| Account | Supabase sign-in | `partial` | Supabase + `remoteDatabase` flag | Credentials / RLS | Configure staging project |
| Account | Activity cards | `mocked` / `partial` | `MockDatabaseAdapter` / `listActivity` | No unified activity API | Add table + adapter methods |
| Account | Push registration | `partial` | Expo + `livePush` flag | EAS credentials, token API | Configure EAS; backend storage |
| Account | Payment demo button | `mocked` | `MockPaymentsAdapter` / hidden in staging default | `DeferredPaymentsAdapter` UX | Add `EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO=true` for QA only |
| Account | Runtime diagnostics strip | `mocked` | Feature flag | Off in staging by default | Enable via env for internal builds |
| Module | `[slug]` detail | `partial` | Catalog + analytics | buildings-interiors `coming_soon` | Content review per division |
| Module | Open external division URL | `full` | `Linking` / in-app browser | None | Test on device |
| Legal | About / Privacy / Terms / FAQ | `placeholder` | Static copy | Legal review | Attorney review before launch |
| Legal | Contact form | `partial` | `database.submitContact` | Supabase table + RLS | Staging insert tests |
| Platform | Auth adapter | `partial` | Supabase | Provider choice | Optional Clerk/Auth0 if required |
| Platform | Database adapter | `partial` | Supabase schema | Migrations applied | CI migration check |
| Platform | Media adapter | `partial` | Cloudinary | Signed upload | Server signing route |
| Platform | Notifications | `partial` | Expo | Backend | Token store |
| Platform | Payments | `placeholder` | None wired | PSP + compliance | Implement adapter + server |
| Platform | Analytics | `mocked` | Console | Vendor | Wire PostHog/Segment |
| Platform | Monitoring | `partial` | Sentry DSN | DSN + source maps | EAS upload config |

## Division web apps — summary

| App | Overall | Notes |
| --- | --- | --- |
| hub | `partial` | Large surface: marketing, owner dashboard, APIs; many `<img>` lint warnings |
| account | `partial` | Account hub across verticals |
| marketplace | `partial` | Header/search refinements ongoing; e2e tests present |
| jobs | `partial` | Employer/candidate/recruiter flows |
| learn | `partial` | Course room UI; unused imports / vars (lint warnings) |
| property | `partial` | Public listings + submissions |
| studio | `partial` | Marketing + project workspace |
| care | `partial` | Public shell |
| logistics | `partial` | Auth shell; minor lint warnings |

## Web hardening status (live vs flagged)

| Surface | Live status | Flagged behavior | Notes |
| --- | --- | --- | --- |
| Account tasks | `live` | none | Real task derivation from trust/support/wallet signals |
| Account recommendations | `live` | `intelligence_recommendations` | Hidden when flag is disabled |
| Staff support queue | `live` | none | Prioritized queue from support + triage metadata |
| Staff operations risk panel | `live` | none | Elevated risk visibility from security signals |
| Account webhook ingestion | `live` | none | Signed + timestamped + idempotent receipts |
| Jobs alerts cron | `live` | none | Bearer auth required; fail closed when secret missing |
| Logistics automation cron | `live` | none | Bearer auth required; fail closed when secret missing |

## Staging connection log (template)

Update this section as you enable each integration:

| Step | Date | Owner | Result |
| --- | --- | --- | --- |
| Auth | | | |
| Database | | | |
| Media | | | |
| Monitoring | | | |
| Payments sandbox | | | |

See [staging-validation.md](./staging-validation.md).
