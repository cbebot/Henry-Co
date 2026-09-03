# Vercel Migration Playbook — Old Team → HenryCo Studio Team

**Date authored:** 2026-05-23
**Reason:** Old Vercel team (`team_CE2vletvAVAjkkl2y7BiKU4a` slug `henry-co`) has billing/registration discrepancies. Owner is moving all production projects to a new Vercel team set up under HenryCo Studio with the correct payment method, business address, and registration details. Current team is also under a `DEPLOYMENT_DISABLED` block returning HTTP 402 on every domain — migration is the unblock path.

**Scope of this doc:** everything I (the AI agent) can document from the current Vercel team via the MCP API + the repository. The doc tells you exactly what to do at each step + what I'll do after you connect the new team.

---

## What I CAN and CANNOT do

| Action | I can do it | You must do it |
|---|---|---|
| List all current projects + IDs + framework | ✅ | |
| Read all `vercel.json` settings (in-repo) | ✅ | |
| Document cron schedules per project | ✅ | |
| Document custom domain mappings (project-level) | ✅ | |
| List every env-var **KEY** referenced in code | ✅ | |
| Move env-var **VALUES** (secrets) | ❌ | ✅ — copy via Vercel dashboard or Vercel CLI per project |
| Update DNS records (CNAME / A / TXT on `henrycogroup.com`) | ❌ | ✅ — your DNS provider dashboard |
| Set up the new Vercel team + billing | ❌ | ✅ — once-only step at vercel.com |
| Authorize GitHub integration for the new team | ❌ | ✅ — GitHub app permissions per team |
| Import / create projects in the new team | ✅ (via deploy + auto-create) | Verify after |
| Add custom domains to new projects | partial — depends on Vercel MCP feature | mostly ✅ via dashboard |
| Trigger fresh production deploys | ✅ (post-cutover) | |
| Smoke-test every domain post-deploy | ✅ | |

The bottleneck is **secrets** + **DNS** + **billing**. Everything else I can drive after you authorize.

---

## Inventory — current Vercel team

**Team:** `team_CE2vletvAVAjkkl2y7BiKU4a` · slug `henry-co` · name "henrychukwuemeka215-8382's projects"

### Projects to migrate (10 production-critical)

| Project | Vercel ID | Custom domains | Repo path |
|---|---|---|---|
| `marketplace` | `prj_EpRExSk7T2YLeQLBfSxDw1adIbz8` | `marketplace.henrycogroup.com` | `apps/marketplace/` |
| `henryco-account` | `prj_oADXXXOhrio50OSFw0utEJF7vYpB` | `account.henrycogroup.com` | `apps/account/` |
| `care` | `prj_Ub6m7yriWBoapZypp9wo0n8ixnRL` | `care.henrycogroup.com` | `apps/care/` |
| `learn` | `prj_gBEBCABUqH5fxz4essFHKdNSbavT` | `learn.henrycogroup.com` | `apps/learn/` |
| `hub` | `prj_maRA6vv8USk7qYhPCpsRHVOeadyV` | `henrycogroup.com`, `www.henrycogroup.com`, `hq.henrycogroup.com`, `workspace.henrycogroup.com` (rewrites in vercel.json — see below) | `apps/hub/` |
| `logistics` | `prj_HgTqlsA8HmkdDTe0VhvGbwGjPo74` | `logistics.henrycogroup.com` | `apps/logistics/` |
| `jobs` | `prj_Z47ZPsl5DMRBxcewwXuclyn9CXYP` | `jobs.henrycogroup.com` | `apps/jobs/` |
| `studio` | `prj_IRs9Cj3vm26obEctzNxyApjE0V8U` | `studio.henrycogroup.com` | `apps/studio/` |
| `property` | `prj_pwraexib4Iclika0dqlasmRw7L7V` | `property.henrycogroup.com` | `apps/property/` |
| `staff` | `prj_frEwPNZMvSTLtnrJR67DRCApEA19` | `staff.henrycogroup.com` (verify in old dashboard) | `apps/staff/` |

### Projects that can be SKIPPED (test/throwaway from prior debugging)

These were created during earlier hot-fix sessions and don't carry production traffic. Don't re-create on the new team:
- `tender-pare-284d43` (`prj_UMbPUbqbOQ00jl8T9kpXP28ZbHc6`)
- `session-destruction-fix` (`prj_MRW5iGTaCdtK07dH8st8DRFRYLWW`)
- `staff-support-prod` (`prj_dsuRQ4R7YoFyaj35LsNqCYcZAybt`)

### Apps NOT on Vercel (Expo apps — separate deployment path)

- `apps/super-app/` — Expo React Native; deploys via EAS, not Vercel
- `apps/company-hub/` — Expo React Native; deploys via EAS, not Vercel

These have their own env vars (`EXPO_PUBLIC_*`) — handled separately, not part of this migration.

---

## Per-project Vercel build configuration

Every Next.js app uses an identical monorepo pattern. The `vercel.json` files live in each `apps/<app>/vercel.json` and are version-controlled. When you re-import in the new team, point the project at `apps/<app>` as the "Root Directory" so the `vercel.json` is picked up.

**Common build commands (10 apps):**
```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @henryco/<app-name> build"
}
```

**Node version:** 24.x (verified via `get_project` on all current projects)
**Bundler:** Turbopack (per the deployments' metadata)
**Runtime regions:** `iad1` (US East) on most current deployments. Owner can change to `fra1` (Frankfurt) for better Lagos latency in the new team's project settings.

### Cron jobs (preserved exactly via vercel.json — Vercel reads on import)

| App | Cron path | Schedule (UTC) | Frequency |
|---|---|---|---|
| **account** | `/api/cron/notification-email-fallback` | `*/15 * * * *` | every 15 min |
| **account** | `/api/cron/notification-purge` | `0 3 * * *` | daily 03:00 |
| **account** | `/api/cron/engagement-sweep` | `13 * * * *` | hourly at :13 |
| **account** | `/api/cron/notification-redelivery` | `*/5 * * * *` | every 5 min |
| **marketplace** | `/api/cron/marketplace-automation` | `0 * * * *` | hourly at :00 |
| **hub** | `/api/cron/owner-reports` | `5 7 * * *` | daily 07:05 |
| **hub** | `/api/cron/search-index-worker` | `* * * * *` | every minute |
| **care** | `/api/cron/care-automation` | `15 8 * * *` | daily 08:15 |
| **jobs** | `/api/cron/jobs-alerts` | `0 * * * *` | hourly at :00 |
| **learn** | `/api/cron/learn-automation` | `0 */6 * * *` | every 6 hours |
| **logistics** | `/api/cron/logistics-automation` | `*/15 * * * *` | every 15 min |
| **property** | `/api/cron/property-automation` | `0 * * * *` | hourly at :00 |
| **studio** | `/api/cron/studio-automation` | `0 */6 * * *` | every 6 hours |
| **staff** | (no crons) | — | — |

Vercel cron jobs require `CRON_SECRET` env var set per project for authorization.

### Hub rewrites (multi-tenant routing — preserved in `apps/hub/vercel.json`)

Hub serves three hosts via internal rewrites:
- `hq.henrycogroup.com` → routes `/` and `/:path*` to `/owner/*`
- `workspace.henrycogroup.com` → routes to `/workspace/*`
- `staff.henrycogroup.com` → routes to `/workspace/*` (legacy alias)
- `henrycogroup.com` + `www.henrycogroup.com` → bare hub routes

All four hostnames must be added as custom domains to the new `hub` project (or whatever you name it on the new team). Same DNS pattern as today.

---

## Custom domain inventory (for DNS migration)

Every customer-facing domain is a subdomain of `henrycogroup.com`. The apex `henrycogroup.com` + `www` are on the `hub` project. Each `<division>.henrycogroup.com` is on its own project.

| Domain | Current project | New project on Studio team |
|---|---|---|
| `henrycogroup.com` | hub | hub |
| `www.henrycogroup.com` | hub | hub |
| `hq.henrycogroup.com` | hub | hub |
| `workspace.henrycogroup.com` | hub | hub |
| `account.henrycogroup.com` | henryco-account | henryco-account |
| `care.henrycogroup.com` | care | care |
| `marketplace.henrycogroup.com` | marketplace | marketplace |
| `property.henrycogroup.com` | property | property |
| `logistics.henrycogroup.com` | logistics | logistics |
| `jobs.henrycogroup.com` | jobs | jobs |
| `learn.henrycogroup.com` | learn | learn |
| `studio.henrycogroup.com` | studio | studio |
| `staff.henrycogroup.com` | staff (verify) | staff |

**DNS cutover sequence:**
1. In the new Vercel team's project, ADD the custom domain. Vercel will tell you the required DNS record (typically a `CNAME` to `<project>.vercel.app` or to `cname.vercel-dns.com`).
2. In your DNS provider (Cloudflare/Namecheap/Route53/etc.), update each `<division>.henrycogroup.com` `CNAME` to point at the new team's record.
3. Wait for DNS propagation (typically 5–60 minutes; Cloudflare often near-instant if proxied).
4. Verify with `dig <domain> CNAME` or `curl -I https://<domain>`.

Old domain mappings on the current Vercel team will go offline as soon as DNS flips. Plan for a brief downtime window per domain unless you can pre-stage the new team's records and switch atomically.

---

## Environment variable KEYS to copy

These are the env-var KEYS your code reads. **The values are in your current Vercel team — you copy them via the dashboard's Project Settings → Environment Variables, per project, per environment.**

### Foundation (every Next.js app uses these)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to client)
- `NEXT_PUBLIC_BASE_DOMAIN` (typically `henrycogroup.com`; allows preview environments to override)
- `CRON_SECRET` (required for any project with a cron entry in `vercel.json`)

### Cloudinary (uploads — used by account, marketplace, jobs, care, logistics)

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET` (server-only)
- `CLOUDINARY_FOLDER` (optional; defaults to `henryco/<scope>`)

### Email providers (used by hub, account, care, marketplace at minimum)

- `EMAIL_PROVIDER` (e.g., `resend` | `brevo` | `postmark`)
- `EMAIL_FALLBACK_PROVIDER`
- `RESEND_API_KEY` (server-only)
- `RESEND_FROM_EMAIL` (or `RESEND_FROM`)
- `BREVO_API_KEY` (server-only)
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

### WhatsApp / Twilio (used by logistics, care, learn)

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN` (server-only)
- `TWILIO_WHATSAPP_FROM`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN` (server-only)
- `WHATSAPP_TWO_FACTOR_PIN` or `WHATSAPP_PIN` (server-only)

### Mapping (used by logistics)

- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Sentry (every Next.js app + the super-app)

- `SENTRY_DSN` (server-side; per-app)
- `SENTRY_AUTH_TOKEN` (build-time, source map upload)
- `SENTRY_ORG`
- `SENTRY_PROJECT` (different per app — match each app's Sentry project name)

### App-specific URL bases (for cross-division links)

- `NEXT_PUBLIC_ACCOUNT_BASE_URL`
- `NEXT_PUBLIC_JOBS_URL`
- `NEXT_PUBLIC_MARKETPLACE_URL`
- `NEXT_PUBLIC_CARE_URL`
- `NEXT_PUBLIC_PROPERTY_URL`
- `NEXT_PUBLIC_LOGISTICS_URL`
- `NEXT_PUBLIC_STUDIO_URL`
- `NEXT_PUBLIC_LEARN_URL`
(All optional — code falls back to `https://<division>.${NEXT_PUBLIC_BASE_DOMAIN}` via `henryDomain()` helper if absent. Set them if you want preview environments to point at different staging hosts.)

### Marketplace-specific

- `MARKETPLACE_OWNER_ALERT_EMAIL` (owner-alerts recipient)

### Studio-specific

- `OWNER_ALERT_EMAIL` (owner-alerts recipient for studio)

### Typesense (search — primarily used by hub for the cron worker)

- `TYPESENSE_HOST`
- `TYPESENSE_PORT`
- `TYPESENSE_PROTOCOL`
- `TYPESENSE_API_KEY` (server-only)

### Auth / session

- `NEXTAUTH_SECRET` or `AUTH_SECRET` (if using NextAuth)
- `JWT_SECRET` (custom session signing — check each app)

### Translation (DeepL — used by @henryco/i18n's translateSurfaceLabel runtime path)

- `DEEPL_API_KEY` (server-only)

### Test / dev (do NOT need on production env; only preview)

- `E2E_USER_PASSWORD`
- `MARKETPLACE_E2E_BASE_URL` / `MARKETPLACE_E2E_PORT`
- `JOBS_SMOKE_URL`
- `LEARN_E2E_BASE_URL` / `LEARN_E2E_PORT`
- `NEXT_PUBLIC_ACCOUNT_BASE_URL`
- `PLAYWRIGHT_TEST_BASE_URL`

### Vercel-managed (auto-populated, do NOT set manually)

- `VERCEL_URL`, `VERCEL_ENV`, `VERCEL_GIT_*`, `VERCEL_REGION`, `VERCEL_IP_TIMEZONE` — Vercel handles these.

---

## Step-by-step cutover sequence

**Phase 0 — Pre-flight (do this BEFORE disconnecting old team):**
1. **Export env vars from current team.** For each of the 10 projects, in the old Vercel dashboard → Project Settings → Environment Variables → click "Download .env" (or use `vercel env pull` from the project's `.vercel` dir locally). Save these `.env.<project>` files somewhere SECURE (encrypted password manager or a temporary local folder you'll delete after).
2. **Note current DNS records.** In your DNS provider, screenshot the current `CNAME` for each `<division>.henrycogroup.com` domain. You'll need to update them.
3. **List GitHub repository access** in current team settings. The new team will need GitHub app re-authorization.
4. **Optional: pause cron jobs** on the old team's projects so they don't fire during cutover.

**Phase 1 — Set up new team:**
1. Create new team at https://vercel.com/teams/create — name "HenryCo Studio" (or whatever you prefer).
2. Configure billing with the correct payment method + registered business address.
3. Invite team members if any.

**Phase 2 — Connect GitHub:**
1. In the new team → Settings → Git → Connect GitHub.
2. Grant the Vercel GitHub app access to `cbebot/Henry-Co` repository.

**Phase 3 — Create projects (per app, repeat 10 times):**
1. In the new team → New Project → Import `cbebot/Henry-Co` → set Root Directory to `apps/<app-name>`.
2. Vercel will detect Next.js + use the `vercel.json` from the repo (build command, install command, crons).
3. **BEFORE clicking Deploy**, add the env vars: paste the `.env.<project>` file's contents into Environment Variables. Tag each as Production / Preview / Development as appropriate.
4. Click Deploy. First build will take 3–7 min.
5. Confirm READY state. Note the new project ID for the post-cutover task list.

**Phase 4 — Domain cutover (per domain):**
1. In each new project → Settings → Domains → Add the custom domain (e.g., `account.henrycogroup.com`).
2. Vercel will display the required DNS target. Copy it.
3. In your DNS provider, update the `CNAME` for the domain to point at the new target.
4. Wait for DNS propagation (5–60 min; faster on Cloudflare).
5. Verify with `curl -I https://<domain>` — expect `HTTP/1.1 200 OK` (or `307` for routes that redirect to `/login` etc.).

**Phase 5 — Integrations:**
1. **Sentry:** if integrated via Vercel marketplace, re-add on the new team's project settings → Integrations. Sentry's `SENTRY_AUTH_TOKEN` env var must be set so source maps upload at build time.
2. **Slack notifications** (if any deploys notify Slack): re-add in new team settings.
3. **Cron jobs:** auto-restored by reading `vercel.json` on first deploy. Verify by checking each project's Cron tab.

**Phase 6 — Verification (this is where I, the agent, take over post-cutover):**
1. Owner tells me the new team ID (`team_<new>`) and confirms GitHub is connected.
2. I run `list_projects` on the new team → confirm 10 projects exist + match names + IDs.
3. I run `list_deployments` on each → confirm all latest deploys are READY.
4. I `curl -I` each custom domain → expect 200 / 307.
5. I trigger one fresh build per project (push an empty commit or use Vercel API) to confirm the build pipeline is fully wired.
6. I check Vercel runtime logs across all projects for any new error patterns.

**Phase 7 — Cleanup:**
1. After verification, delete the old team's projects (or transfer them to a "legacy" team you keep for reference).
2. Cancel the old team's billing.
3. Update any in-repo references to the old team ID / project IDs — none should exist; `.vercel/project.json` files are in `.gitignore`.
4. Update `MEMORY.md` (or any internal reference) with new team ID.

---

## What I'll need from you to complete Phase 6+

Once your new team is set up and GitHub is connected, tell me:
- **New team ID** (format `team_<...>`) or team slug
- **New project IDs** for each app (you can grab them from each project's Settings → General page)
- Confirmation that all 10 projects are imported + their env vars are in
- Confirmation that all custom domains are added + DNS is flipped

I'll then run the verification battery + smoke-test each domain + report back.

---

## Risk register

| Risk | Mitigation |
|---|---|
| DNS propagation delay creates downtime | Pre-stage new team's records, flip DNS during low-traffic window |
| Env var typo on copy-paste | Use Vercel CLI `vercel env pull` then `vercel env push` (per project) instead of manual paste |
| Forgotten env var for a feature you don't use daily (e.g., Twilio if you rarely send SMS) | Cross-check old team's env list against the KEY inventory above per app |
| Cron jobs don't fire on new team | Verify `vercel.json` is present in each app dir; confirm `CRON_SECRET` env is set |
| Sentry source maps stop uploading | Verify `SENTRY_AUTH_TOKEN` is set as a Production env var (build-time) on each app |
| Custom domain config error | Cross-check the domain shows up in the new project's Domains tab AND `dig <domain>` resolves to the new CNAME |
| Cloudinary uploads fail in production | Verify `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` set on every project that uploads |
| Supabase service-role key exposed by accident | Always tag `SUPABASE_SERVICE_ROLE_KEY` as Production-only + Sensitive in Vercel UI; never as `NEXT_PUBLIC_*` |

---

**The migration is achievable in one focused session once you have the new team set up. Total wall-clock time once pre-flight is done: ~45 min for project imports + 30 min for DNS cutover + ~15 min for my verification = ~90 min for a clean, complete migration.**
