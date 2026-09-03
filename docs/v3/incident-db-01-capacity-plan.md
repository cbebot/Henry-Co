# V3-INCIDENT-DB-01 — Capacity & Prevention Plan

**Date:** 2026-06-05 · **Project:** Supabase prod `rzkbgwuznmdxnnhmjazy` (PG 17.6, eu-west-1) · **Status:** service restored; prevention partially shipped (see status table).

## 1. What happened

The platform "hung" (every app's DB calls stalled). The database had **already self-recovered** via an administrative restart ~15 min before triage; apex, divisions, and `account.henryonyx.com` were all serving. The reported "detached account domain" was a **false inference** from an incomplete API field — the domain was attached the whole time.

## 2. Root cause

A **deploy-storm cold-start herd**, not a runaway query. Rapid sequential `main` pushes (the incident's own hotfixes #220→#227) each fan out to ~11 monorepo Vercel projects → a fleet-wide serverless cold-start storm → a **PostgREST schema-cache-reload herd** (recursive domain/`pg_type` introspection, `pks_*`, `pg_publication_tables`) plus `pg_timezone_names` and `storage.search` — all landing on a **burstable Micro CPU**. Burst credits exhausted → normally-fast catalog queries ballooned to 11–18 s → because **`service_role` (SSR/admin reads) had no statement_timeout** (inherited the 120 s default), those reads *stacked* instead of shedding → universal hang.

## 3. Measured prod profile

| Dimension | Value | Note |
|---|---|---|
| Compute tier | **Micro** (~1 GB RAM, shared/burstable CPU) | `shared_buffers` 224 MB, `effective_cache_size` 384 MB, `work_mem` ~2 MB, `max_worker_processes` 6, parallel 2 |
| Max connections | **60** (−3 reserved → **57 usable**) | Storage API held ~28–30 (>50%) at peak |
| `statement_timeout` by role | anon **3 s** · authenticated **8 s** · authenticator **8 s** (+`lock_timeout` 8 s) · **service_role → 120 s (was unset)** | service_role was the outlier; now capped (see R2) |
| `idle_in_transaction_session_timeout` | 0 global; auth_admin 60 s | not implicated (0 idle-in-txn during incident) |
| Direct-Postgres paths | only `apps/account/lib/payments/db.ts` | already on the **transaction pooler (:6543)**; all other DB access is supabase-js over HTTP |

## 4. Remediation status

| ID | Action | Status |
|---|---|---|
| — | **Build break** (`packages/seo` `node:crypto` → Edge): rewrote share HMAC to Web Crypto so division builds compile and the SSR-resilience fix can ship | **PR #228** (CI green) — awaiting merge |
| — | **Schema-drift code fixes**: `profiles.id` (search-core role hot path) + drop logistics `created_at` order-by | **PR #229** — awaiting merge |
| — | **Marketplace migration backlog**: the unapplied `20260514*` batch (variant matrix incl. `sort_order`, refunds, review photos, recommendation signals, inventory movements) | **Applied to prod 2026-06-05**, verified forward-safe + non-colliding with the (still-dormant) payment migrations |
| **R2** | **Cap `service_role` statement_timeout** (120 s → 30 s backstop) | **Applied** (`20260605210000_service_role_statement_timeout_cap.sql`) |
| **R5** | **App-layer SSR resilience** (`unstable_cache` + 4 s fetch-abort) | ships with #226/#227 once #228 unblocks the division builds |

## 5. Recommendations still open (owner decisions)

**R1 — Upsize compute Micro → Small (or Medium). [biggest lever; brief managed restart]**
CPU/burst-credit exhaustion was the true bottleneck. Small (~2 GB, `max_connections`→90) or Medium (~4 GB, →120) provides real baseline CPU + connection headroom. Trigger from **Dashboard → Project Settings → Compute and Disk → Compute size** (causes a short restart). Everything else is a band-aid without this.

**R3 — Storage connection-pool cap.** App connection-routing is already healthy (payments on :6543; everything else over HTTP). The remaining item is the **managed Storage service pool**, which held >50 % of the 60-connection ceiling; cap it so a cold-start herd can't exhaust the ceiling. (Supabase-managed setting.)

**R4 — Deploy hygiene (kills the *trigger*).** Batch `main` pushes instead of rapid-fire — each push fans out to ~11 projects; the incident's own hotfix cadence caused the storm. Keep the `Lint, typecheck, test, build` check **required** so a broken shared package can't fan failures across the fleet (as the `node:crypto` break did to every division).

**R2 follow-up.** Once heavier `service_role` job durations are confirmed safe, the 30 s backstop can be tightened toward ~10 s (closer to the 8 s web roles) for faster shedding.

## 6. Prevention checklist

- [ ] R1: upsize compute (owner, dashboard) — **primary durable fix**
- [x] R2: `service_role` statement_timeout backstop (30 s)
- [ ] R3: cap Storage service connection pool (owner, managed config)
- [ ] R4: batch `main` deploys; keep build check required
- [ ] Merge #228 (build) then #226/#227 effects reach divisions (R5)
- [ ] Merge #229 (schema-drift code fixes)
- [x] Marketplace `20260514*` migration backlog applied
