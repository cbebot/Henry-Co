# Cloudflare Migration Feasibility + Inventory

**Date:** 2026-05-24
**Question:** Can we migrate the HenryCo monorepo from Vercel to Cloudflare?
**Short answer:** Yes — but there are two very different "migrations" people mean by this phrase, with very different effort levels. Read Path A vs Path B below before committing.

---

## Path A — Cloudflare IN FRONT OF Vercel (DNS / CDN / Security proxy)

**What it is:** Vercel remains the host. Cloudflare sits in front as the DNS authority + CDN cache + DDoS shield + WAF + bot protection. Customers' requests hit Cloudflare → Cloudflare proxies to Vercel → Vercel runs the app.

**Effort:** 1–3 hours total. DNS-only change. Zero code changes.

**Benefits:**
- Cloudflare CDN cache in front of Vercel (faster static asset delivery, especially Lagos / West Africa)
- WAF, bot management, DDoS protection at the edge
- Free SSL/TLS with no Vercel domain limit pressure
- Page Rules / Workers for header rewrites, redirects, geo-routing
- Real-time analytics independent of Vercel
- Cloudflare's KV / R2 / Images can layer in incrementally without re-platform

**Drawbacks:**
- Vercel's edge cache may double-cache with Cloudflare's — needs tuning
- Two vendors to manage (but each does what it does best)
- You still pay Vercel for compute

**Steps (high level):**
1. Add your domain `henrycogroup.com` (and any future TLD) to Cloudflare → free plan or any paid plan.
2. Update domain registrar to use Cloudflare nameservers.
3. In Cloudflare DNS, set each subdomain (`account`, `care`, `marketplace`, etc.) as a `CNAME` to the Vercel team's project alias (e.g. `henryco-account-henry-co-studio.vercel.app`) with the **proxy toggle ON (orange cloud)**.
4. In each Vercel project's Settings → Domains, add the custom domain. Vercel will verify ownership via DNS or HTTP challenge.
5. In Cloudflare SSL/TLS settings, set encryption mode to **Full (Strict)** so Cloudflare ↔ Vercel uses TLS end-to-end.
6. Done. Customers hit `<sub>.henrycogroup.com` → Cloudflare → Vercel → app.

**Why this is interesting for you specifically:**
- It solves your current concern (move away from old Vercel team) while ALSO giving you better international performance.
- It doesn't risk the Next.js 16 / Turbopack / Realtime / Cron infrastructure that's already working.
- The current rebrand TLD change becomes trivial — just add the new domain in Cloudflare + Vercel.

---

## Path B — FULL migration to Cloudflare hosting (replace Vercel)

**What it is:** Cloudflare hosts the actual Next.js apps. No more Vercel at all. Apps run on either:
- **Cloudflare Pages** (with `@cloudflare/next-on-pages` adapter), OR
- **Cloudflare Workers** (with `@opennextjs/cloudflare` adapter — recommended for newer Next.js)

**Effort:** 1–3 weeks for an experienced Next.js + Cloudflare engineer. **Not a one-day task.** This is a real platform migration.

**Realistic risks for this codebase:**

| Concern | Why it's a real risk |
|---|---|
| **Next.js 16 + Turbopack** | Vercel + Turbopack is the most-supported combo. Cloudflare adapter support is catching up but lags 1-2 minor versions. May hit edge cases. |
| **Cron jobs (15 across 10 apps)** | Vercel cron reads `vercel.json` per app — clean. Cloudflare uses Workers Cron Triggers per Worker. Means each cron route becomes its own Worker (or you batch them). Restructure required. |
| **Node-specific code** | Vercel runs Node lambdas. Cloudflare Workers run V8 isolates with Web APIs. Code that uses `Buffer`, `fs`, `crypto.randomBytes` directly, certain `process.*` APIs etc. may break. Need audit. |
| **Supabase realtime (WebSocket)** | Supabase Realtime needs persistent WebSocket. Cloudflare Workers can do this via `WebSocketPair` but the pattern differs from Vercel. Refactor likely. |
| **Bundle size limits** | Workers have a 1 MB compressed bundle limit on free plan, 10 MB on paid. A Next.js dashboard app's server bundle can exceed this. Pages has different limits. |
| **Image optimization** | Vercel built-in Image Optimization → swap to Cloudflare Images or external (Cloudinary you already use). Audit `<Image>` usage. |
| **Multi-tenant routing (hub)** | `apps/hub/vercel.json` has rewrites for `hq.`, `workspace.`, `staff.` subdomains. Need to port to Workers routing config. Doable but not free. |
| **Streaming SSR + RSC** | Cloudflare supports this but has different limits on response duration and chunk sizes. Tuning required. |
| **`packages/dashboard-shell` runtime concerns** | Supabase server client, custom auth, realtime providers — none tested on Cloudflare Workers. Each needs end-to-end smoke. |

**When Path B makes sense:**
- You want to consolidate vendors to one (Cloudflare).
- You want significantly lower egress costs (Cloudflare zero-egress to R2 is a big deal).
- You're willing to invest 2-3 dev weeks in the migration.
- You're OK with potential pre-cutover refactor work on the realtime layer.

**When Path B is the WRONG move:**
- You need things working in days, not weeks.
- You're already in a migration (you just did Vercel ↔ Vercel migration yesterday).
- The current rebrand TLD change is more urgent than the hosting change.

**My honest recommendation:** **Don't do Path B right now.** The new HenryCo Studio Vercel team is working (code healthy, env vars in, custom-domain pattern proven). Path A (Cloudflare proxy in front of Vercel) gets you Cloudflare's CDN + security benefits in hours, no code changes, no risk to today's progress.

If/when you want to fully leave Vercel, **plan it as a 3-sprint project** with a dedicated owner — not a single session task.

---

## File inventory — what already exists for either path

These are paths you can copy directly when handing to the team.

### Env variable exports (production, encrypted secrets — DO NOT COMMIT)

```
C:/Users/HP VICTUS/HenryCo/vercel-env-exports/henry-co/production/
├── care/.env.production              (95 vars)
├── henryco-account/.env.production   (109 vars)
├── hub/.env.production               (89 vars)
├── jobs/.env.production              (84 vars)
├── learn/.env.production             (84 vars)
├── logistics/.env.production         (86 vars)
├── marketplace/.env.production       (88 vars)
├── property/.env.production          (90 vars)
├── studio/.env.production            (86 vars)
├── staff/.env.production             (77 vars)
├── session-destruction-fix/.env.production  (21 vars — Vercel-managed, SKIP)
├── staff-support-prod/.env.production       (21 vars — Vercel-managed, SKIP)
└── tender-pare-284d43/.env.production       (21 vars — Vercel-managed, SKIP)
```

For **Path A** (Cloudflare proxy): you don't need to touch these — Vercel keeps them.

For **Path B** (full migration): you'd upload these to Cloudflare via `wrangler secret put` per Worker / Pages project. Each file maps to one Cloudflare project. Same secret values, different platform.

### Migration artifacts

```
C:/Users/HP VICTUS/HenryCo/vercel-env-exports/henry-co/STUDIO_MIGRATION_SUMMARY.md
C:/Users/HP VICTUS/HenryCo/vercel-env-exports/henry-co/studio-migration-report.json
C:/Users/HP VICTUS/HenryCo/vercel-env-exports/henry-co/studio-env-verification.json
C:/Users/HP VICTUS/HenryCo/scripts/vercel-studio-migrate.mjs
```

### Build configs (in repo — these are Vercel-specific)

```
apps/account/vercel.json
apps/care/vercel.json
apps/hub/vercel.json
apps/jobs/vercel.json
apps/learn/vercel.json
apps/logistics/vercel.json
apps/marketplace/vercel.json
apps/property/vercel.json
apps/staff/vercel.json
apps/studio/vercel.json
```

For **Path A** (Cloudflare proxy): these stay untouched — Vercel still reads them.

For **Path B** (full migration): each one needs a corresponding `wrangler.toml` or `wrangler.jsonc` translation. Cron schedules from `vercel.json` map to Cloudflare's `[triggers.crons]` array. Install/build commands translate to Cloudflare Pages build settings.

### Existing playbooks + readiness docs (on `main`)

```
docs/v3/handoff/team-report-2026-05-23.md
docs/v3/handoff/public-pages-pass-report-2026-05-23.md
docs/v3/handoff/vercel-migration-playbook.md
docs/v3/handoff/vercel-studio-production-readiness-2026-05-24.md
```

These cover the Vercel-side picture comprehensively. Useful reference even for Path B since they enumerate every project + every env var + every cron.

### Custom domain inventory

| Subdomain | Project | Current state |
|---|---|---|
| `henrycogroup.com` | hub (apex) | Attached to old team, blocked on billing |
| `www.henrycogroup.com` | hub | Same |
| `hq.henrycogroup.com` | hub | Same |
| `workspace.henrycogroup.com` | hub | Same |
| `account.henrycogroup.com` | henryco-account | Same |
| `care.henrycogroup.com` | care | Same |
| `marketplace.henrycogroup.com` | marketplace | Same |
| `jobs.henrycogroup.com` | jobs | Same |
| `learn.henrycogroup.com` | learn | Same |
| `logistics.henrycogroup.com` | logistics | Same |
| `property.henrycogroup.com` | property | Same |
| `studio.henrycogroup.com` | studio | Same |
| `staff.henrycogroup.com` | staff | Same |

All need to be moved to whichever hosting target you pick. Path A: attach to new Vercel team's projects (you're doing this with Chrome Claude). Path B: skip the Vercel-side step entirely, point them at Cloudflare Pages/Workers.

---

## Concrete answer to "should we?"

**Recommended: Path A (Cloudflare in front of Vercel).**

- Cheap (~free on Cloudflare's free plan)
- Fast to do (1-3 hours)
- Reversible
- Gives you the Cloudflare CDN + WAF + DDoS benefits immediately
- Doesn't risk anything we just shipped on Vercel
- Makes the future rebrand TLD trivial (just add it in Cloudflare → add it in Vercel → switch)

**If team wants Path B (full Cloudflare hosting):** that's a 2-3 sprint project. Plan it as its own initiative once the new HenryCo Studio Vercel is fully stable. Not now.

---

## What to hand the team

Pick one paragraph based on your decision:

**If Path A:**

> "We're keeping Vercel as the host but putting Cloudflare in front for CDN, security, and DNS. No code changes. Steps: (1) add henrycogroup.com to a Cloudflare account, (2) change nameservers at the registrar, (3) each subdomain becomes a proxied CNAME to the Vercel project's URL, (4) Cloudflare SSL/TLS mode = Full (Strict). I'll point them at the relevant Vercel host targets per division. Effort: ~3 hours."

**If Path B:**

> "We're planning a full migration off Vercel to Cloudflare Pages / Workers. This needs its own sprint with a dedicated owner. Pre-work: audit Next.js 16 + Turbopack compatibility with the @opennextjs/cloudflare adapter, audit Supabase realtime WebSocket usage, audit Node-specific code in the server layer (especially crypto + Buffer), restructure the 15 cron routes across 10 apps to Cloudflare Workers Cron Triggers, translate every vercel.json to a wrangler config, port hub's multi-host rewrites to Workers routing. Realistic timeline: 2-3 weeks. Don't start until the new HenryCo Studio Vercel team is fully stable."

That's the whole decision in one paragraph each.
