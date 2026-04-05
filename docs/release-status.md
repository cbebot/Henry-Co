# Release status — MVP stabilization

**Branch:** `release/mvp-stabilization`  
**Cut from:** `feature/henryco-super-app`  
**Last updated:** 2026-04-05  

## Purpose

Freeze feature work, document reality across the monorepo, and drive staging validation and beta packaging for the **HenryCo Super App** (Expo) while treating division web apps (Next.js) as separate deploy surfaces.

## Project inventory (high level)

### App modules (`apps/*`)

| App | Stack | Role |
| --- | --- | --- |
| **super-app** | Expo Router / RN / Web | Mobile-first hub: divisions directory, module deep-links, account, legal, platform adapters |
| **hub** | Next.js | Corporate / owner / workspace web |
| **account** | Next.js | Unified account shell (wallet, jobs, property, marketplace shortcuts) |
| **marketplace** | Next.js | Marketplace storefront + vendor/account areas |
| **jobs** | Next.js | Careers, candidate, employer, recruiter flows |
| **learn** | Next.js | Learner / instructor / course surfaces |
| **property** | Next.js | Listings, trust, submissions |
| **studio** | Next.js | Studio marketing + client/project workspace |
| **care** | Next.js | Fabric care public site |
| **logistics** | Next.js | Logistics portal shell |

### Shared packages (`packages/*`)

| Package | Role |
| --- | --- |
| `@henryco/config` | Shared workspace config |
| `@henryco/ui` | Shared UI primitives (e.g. public account chip, loading) |
| `@henryco/brand` | Brand tokens / assets |
| `@henryco/i18n` | i18n helpers |

### Super App routes (file-based)

| Route | Screen / purpose |
| --- | --- |
| `/(tabs)/` | Hub home |
| `/(tabs)/directory` | Division directory |
| `/(tabs)/services` | Services overview |
| `/(tabs)/account` | Auth, activity, legal links |
| `/module/[slug]` | Division module detail + deep actions |
| `/legal/about`, `privacy`, `terms`, `contact`, `faq` | Legal / contact |
| `+not-found` | 404 |

### Super App “services” (logical)

| Area | Location | Notes |
| --- | --- | --- |
| Platform bundle | `src/platform/bundle.ts` | Composes adapters from mode + flags |
| Auth | `contracts/auth`, `adapters/mock`, `adapters/supabase` | Mock local; Supabase when configured |
| Database | `contracts/database`, mock + Supabase | Contact, divisions, activity |
| Media | `cloudinary.media.ts` | Read URLs; upload mocked/stubbed |
| Notifications | mock + Expo | Live push behind flag |
| Payments | mock + deferred | No live PSP in repo |
| Analytics | console / noop | Replace with vendor adapter |
| Monitoring | noop + Sentry | DSN from env |
| Division catalog | `src/domain/divisionCatalog.ts` | Fallback when DB empty |

### External integrations (Super App)

| Integration | Adapter | Staging note |
| --- | --- | --- |
| Supabase Auth + DB | `SupabaseAuthAdapter`, `SupabaseDatabaseAdapter` | Use **staging** project only |
| Cloudinary | URL building + `CloudinaryMediaAdapter` | Public cloud name is not a secret; uploads need signed API |
| Sentry | `SentryMonitoringAdapter` | Staging DSN / separate project |
| Expo Push | `ExpoNotificationsAdapter` | EAS credentials + backend token store (not in repo) |
| Payments | `DeferredPaymentsAdapter` | Implement Stripe/Paystack adapter server-side |

### Environment variables (canonical list)

See [env-vars.md](./env-vars.md). Super App uses **only** `EXPO_PUBLIC_*` client vars plus server-side secrets for seeds (`SUPABASE_SERVICE_ROLE_KEY` — never in app).

### Known placeholders

| Item | Where |
| --- | --- |
| EAS `projectId` | `apps/super-app/app.json` → `extra.eas.projectId` still a placeholder string |
| Payments | `DeferredPaymentsAdapter` returns not-implemented for real checkout |
| Media upload | Signed upload flow not implemented in client |
| Activity feed | Mock / partial; unified `activity` table optional |
| Cross-app SSO | Super App does not embed Next apps; opens URLs |

### Known unfinished parts (Super App)

- Live payment provider and server-side confirmation.
- Push token persistence and notification campaigns.
- Production `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` governance workflow.
- Full parity between Supabase `divisions` rows and bundled catalog (seed script exists).

## Verification snapshot (automated)

| Check | Result (2026-04-05) |
| --- | --- |
| `pnpm typecheck:all` | Pass |
| `pnpm lint:all` | Pass (warnings remain in hub/learn/logistics/marketplace — not errors) |
| `pnpm test:workspace` (super-app Jest) | Pass |
| `pnpm run ci:validate` | Pass — full monorepo build (2026-04-05) |
| `expo export --platform web` (super-app) | Pass — 16 static routes emitted |

## Related documents

- [feature-status.md](./feature-status.md)
- [known-issues.md](./known-issues.md)
- [architecture-summary.md](./architecture-summary.md)
- [env-vars.md](./env-vars.md)
- [deploy-checklist.md](./deploy-checklist.md)
- [staging-validation.md](./staging-validation.md)
- [mvp-scope.md](./mvp-scope.md)
- [beta-release.md](./beta-release.md)
