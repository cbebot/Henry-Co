# V3-FIRE-STUDIO — Pre-launch adversarial security + smart-leak audit

- **Entity:** Henry Onyx Limited (codename `HenryCo` / `@henryco/*`; only valid domain **henryonyx.com**).
- **Division:** studio (`apps/studio` — client portal, proposals, deliverables, payment-gated assets).
- **Live DB audited:** Supabase project `rzkbgwuznmdxnnhmjazy` ("HENRY ONYX").
- **Date:** 2026-06-27
- **Method:** static map (3 parallel subagents over migrations + routes + the asset-delivery path) → live read-only probing as the **real `anon` role** (`SET LOCAL ROLE anon`) and catalog reads, never `service_role`. Live probes were run via the Supabase SQL editor (MCP OAuth unstable this session); `SELECT`/`pg_catalog`/`information_schema` only, zero mutation.
- **Calibration (owner directive):** public-by-design data (portfolio/showcase, service/pricing catalog, published reviews) is **not** flagged. Every CRITICAL/HIGH carries a live row-returning probe or a concrete code path; unproven hypotheses graded SUSPECTED and resolved here. **Dormant code (table not applied to prod) is not graded as a live finding.**

---

## Executive summary

The studio data layer is **sound**, and the two scariest static-map hypotheses were **refuted by live probes** (not assumed):

- **F-1 (was SUSPECTED CRITICAL) — CLOSED by probe.** `studio_client_invoices_v` is **`security_invoker=on` on prod** (`views_reloptions`), so it evaluates `studio_invoices` RLS as the caller; an anon `SELECT` returned **0 rows**. No anon invoice/token leak. (The repo migration created the view without `security_invoker`; prod has the fix.)
- **Asset-pack "no payment gate" (was 2× HIGH) — DORMANT.** `studio_asset_packs` + the other V3-PASS-21 tables (`studio_payment_plans`, `studio_payment_plan_releases`, `studio_resource_allocations`, `studio_proposal_signatures`) are **absent from prod** (committed-not-applied — they don't appear in the posture sweep; `asset_packs_policies = null`). The code path is real but unreachable until those migrations apply, so it is a **harden-before-activate** item, not a live HIGH.
- **F-3 (email-OR staff) — CLOSED.** `staff_email_only_rows = 0`: `studio_role_memberships` has no `user_id=NULL + email` seed (unlike marketplace's 7). `studio_is_staff()` carries the email-OR path, but there is nothing to exploit.
- Money model is **SOUND** (no client-driven money state change; webhooks signature-verified + money-inert; amounts server-derived). Proposal signing is **SOUND** (server-derived signature row, ownership re-checked, HMAC secret server-only). SECDEF posture is clean on prod (search_path pinned; `is_staff_in`/`studio_is_staff` are caller-scoped self-checks; `studio_invoice_by_token` token-gated, no PUBLIC grant).

The **one live HIGH** is cross-division, in the shared support surface.

| # | Finding | Category | Severity |
|---|---------|----------|----------|
| **STU-1** | `documents/support-thread/[id]` exports ANY division's support thread (customer name+email+full history) to a studio staffer — no `division` scope; **108 non-studio threads live on prod** | IDOR / cross-tenant PII | **HIGH** |
| **STU-2** | Support write routes (`transitions`/`report`/`mute`/`transfer`) mutate any division's thread by id | Multi-tenant integrity | **MEDIUM** |
| **STU-3** | `/api/portal/download` is an authenticated open proxy — no ownership/payment check, wildcard `*.cloudinary.com`/`*.supabase.co` host allowlist | BOLA / SSRF-lite | **MEDIUM** |
| **STU-4** | Portal access-key HMAC falls back to the hardcoded constant `"henryco-studio-secret"` if env is unset (fail-open) | Auth / secret mgmt | **MEDIUM** |
| **STU-5** | No `FORCE ROW LEVEL SECURITY` on any studio money/PII table | Hardening | **LOW** |
| **STU-6** | `support/mark-read` (no authz) + `studio/revisions` null-owner bypass + milestone `amount` float + deliverables-approve RLS full-row update | IDOR / integrity | **LOW** |
| **STU-7** | `studio_invoice_by_token` returns the full invoice row (PII) to anon by token | Info / harden | **LOW** |
| **STU-8** | Asset-pack delivery has no payment gate + permanent public Cloudinary `type=upload` URLs — **DORMANT** (tables not on prod) | Harden-before-activate | **LOW** |

---

## Findings

### STU-1 — Cross-division support-thread PII export (HIGH, live-confirmed)
- **Category:** IDOR / cross-tenant PII exfiltration via an over-broad staff role. CVSS `AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N` ≈ **7.7**.
- **Asset:** `apps/studio/app/api/documents/support-thread/[id]/route.ts:24-49` (+55-116 PDF build).
- **Pre-fix reproduction (source + live):** the route gates on `requireStudioRoles(["studio_owner","client_success"])` — proving "is a studio support agent" — then fetches the thread and messages via `createAdminSupabase()` (service-role, **bypasses RLS**) **keyed only by `id`, with no `division` predicate**, resolves `customer_profiles.email`/`full_name`, and streams a branded PDF of the customer's name + email + full message history. The support tables are **shared cross-division**, and prod has 108 non-studio threads:
  ```sql
  select division, count(*) from support_threads group by division order by 2 desc;
  -- property 40, account 27, jobs 26, learn 11, care 3, studio 1, logistics 1, (null) 3
  ```
  So a studio `client_success` agent can `GET /api/documents/support-thread/<id>?download=1` for a property/account/jobs/care/etc. thread and exfiltrate that customer's PII. The studio role does not — and should not — confer access to other divisions' customers.
- **Proposed fix:** after fetching, require `thread.division === 'studio'` (404 otherwise) and/or check assignment scope; do not resolve customer PII for out-of-scope threads. (App-layer.)
- **Post-fix reproduction:** as a studio staffer, `GET …/support-thread/<property thread id>?download=1` → 404; only `division='studio'` threads export.
- **Regression test:** route test — studio staffer requesting a non-studio thread id gets 404 and no PDF.

### STU-2 — Support write routes mutate threads cross-division (MEDIUM)
- **Asset:** `support/transitions/route.ts:77-83` (resolve/reopen), `support/report/route.ts:70-76` (priority bump), `support/mute/route.ts:69-75`, `support/transfer/route.ts:99-102` (re-route). Each does `admin.from("support_threads").update(...).eq("id", threadId)` with **no `division` predicate** behind a studio-role gate.
- **Repro:** as studio staff, `POST /api/support/transitions {action:"resolve", threadId:"<care thread id>"}` → flips a care thread's status.
- **Fix:** load the thread, require `division==='studio'` (or assignment scope) before the update; add `.eq("division","studio")`.

### STU-3 — `/api/portal/download` authenticated open proxy (MEDIUM)
- **Asset:** `apps/studio/app/api/portal/download/route.ts:29-37,67-121`.
- **Pre-fix:** authenticates any portal viewer, then proxies **any** `?u=` URL whose host *ends with* `.cloudinary.com`/`.supabase.co` — **no check that the URL belongs to the caller's project, no payment check**. The suffix allowlist accepts any subdomain ⇒ an authenticated proxy for the entire Cloudinary fleet + every `*.supabase.co` project (SSRF-lite), and any leaked deliverable URL is pullable by any signed-in user.
- **Fix:** resolve `u` to a deliverable/attachment id the viewer owns (verify project ownership, + payment for paid assets); pin the allowlist to the exact tenant Supabase host + specific Cloudinary cloud, not wildcard suffixes.

### STU-4 — Portal access-key HMAC fail-open fallback (MEDIUM)
- **Asset:** `apps/studio/lib/studio/store.ts:52,58,107-116` — `stableSecret()` returns `STUDIO_PORTAL_SECRET || CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY || "henryco-studio-secret"`. Access keys (`createAccessKey("proposal:<id>")`) gate unauthenticated proposal/project viewing.
- **Pre-fix:** the id is public and the seed format fixed, so if none of the env vars is set the secret becomes the **published constant**, making every access key deterministically forgeable (capability-URL gate collapses). Prod has `SUPABASE_SERVICE_ROLE_KEY` set, so not triggered today — but a misconfigured preview/staging deploy degrades to a public secret instead of failing closed, and coupling the key namespace to the service-role key is poor hygiene.
- **Fix:** require a dedicated `STUDIO_PORTAL_SECRET`; throw on missing; remove `FALLBACK_SECRET`.

### STU-5 — No FORCE RLS on studio money/PII tables (LOW, hardening)
- **Pre-fix (live):** posture sweep — every `studio_*` table is `relforcerowsecurity=false`. All portal writes flow through service_role (bypasses RLS), so money/PII tables (`studio_invoices`, `studio_payments`, `studio_project_milestones`, `studio_proposal_milestones`, `studio_proposals`, `studio_leads`, `studio_projects`, `studio_notifications`, `studio_brief_drafts`, `studio_revisions`) have no DB backstop.
- **Fix (held migration `01`):** `ALTER TABLE … FORCE ROW LEVEL SECURITY` on those tables (verify service_role read paths unaffected).

### STU-6 — Lower-tier IDOR / integrity (LOW)
- `support/mark-read/route.ts:16-49` — **no role/ownership check**; any authenticated ecosystem user can stamp `staff_last_read_at` on any thread id. Fix: require a studio support role.
- `studio/revisions/route.ts:97` — ownership guard `if (project.client_user_id && project.client_user_id !== viewerId)` is **skipped when `client_user_id` is null** ⇒ any authed user files a revision against an unclaimed project. Fix: resolve by `client_user_id===viewerId || normalized_email===viewerEmail`, deny on neither.
- `studio/milestones/route.ts:93,155` — `amount: Math.max(0, Number(body.amount))` accepts a float (staff-only). Fix: `Math.trunc`.
- `studio_member_deliverables_approve` RLS (`studio_client_portal.sql:276-305`) `WITH CHECK` permits a **full-row** update (not just approval columns) on the caller's own-project deliverables — a client could alter `file_url`/`title` on their own deliverables. Fix: constrain updatable columns via trigger/SECDEF RPC.

### STU-7 — `studio_invoice_by_token` returns full PII row (LOW, harden)
- SECDEF, search_path pinned, **no PUBLIC grant** (acl: anon/authenticated explicit), token-gated — but `returns setof studio_invoices` ⇒ all columns incl. `normalized_email`, `client_user_id`. Fix: return a projected view-model (amount/currency/status/invoice_number); confirm `invoice_token` is minted from `randomBytes` (high entropy), not a sequence.

### STU-8 — Asset-pack delivery: no payment gate + permanent public URLs (LOW, DORMANT)
- `asset-packs/generate/route.ts:121-127` checks ownership but **never** payment (`studio_invoices.status='paid'`); `studio_asset_packs` client-read RLS exposes `archive_url`; archives are built `type:"upload"` ⇒ permanent, unsigned, public Cloudinary URLs (the `expires_at` column is DB-only and rotates nothing). **Currently DORMANT** — `studio_asset_packs` is not on prod (committed-not-applied) and the builder UI is unrendered.
- **Harden before activating:** gate generation + the client-read policy on a paid invoice; serve via short-lived **signed** (`type:authenticated`) Cloudinary URLs, not `type:upload`.

---

## Closed / refuted (proven, not assumed)

| Hypothesis | Verdict | Evidence |
|---|---|---|
| F-1 anon reads all invoices via `studio_client_invoices_v` | **CLOSED (was SUSPECTED CRITICAL)** | view is `security_invoker=on`; anon `SELECT` = **0 rows** |
| Email-OR staff escalation (henrycogroup class) | **CLOSED** | `staff_email_only_rows = 0` |
| Asset-pack no-payment-gate (2× HIGH) | **DORMANT** | `studio_asset_packs` + V3-PASS-21 tables absent on prod |
| SECDEF mutable search_path | **CLOSED** | prod funcs have `search_path` set; `studio_invoice_by_token` no PUBLIC grant |
| Client-driven money state change | **CLOSED** | invoice writes staff/service-only; webhooks signature-verified + money-inert; amounts server-derived |
| Proposal signature forge/replay | **CLOSED** | server derives the signature row after ownership re-check; HMAC secret server-only |
| V3-73 `fileUrl`-into-client-bundle CRITICAL | **DOWNGRADED LOW** | `FileCard` URLs are RLS-scoped to the owner's own deliverables (by-design) |
| By-id project/proposal resolution IDOR | **CLOSED** | `getProjectWorkspace`/`getProposalWorkspace` return null without a matching access key/ownership |
| Realtime firehose | **CLOSED** | money/PII realtime tables carry no anon grant ⇒ anon subscriptions return nothing under RLS |

---

## Proposed fixes index
- **Held migration** `docs/v3/security/v3-fire-studio-proposed-migrations/01_force_rls_studio_money_pii.sql` (STU-5).
- **App-layer (no migration):** STU-1 division scope on `documents/support-thread/[id]`; STU-2 division predicate on the support write routes; STU-3 ownership/payment resolution + de-wildcard the proxy allowlist; STU-4 fail-closed `stableSecret()`; STU-6 (`mark-read` role gate, `revisions` null-owner, milestone `Math.trunc`); STU-7 projected token view-model; STU-8 harden before the asset-pack migration applies.

---

**V3-FIRE-STUDIO COMPLETE — 8 findings (0 critical / 1 high / 3 med / 4 low), each with attached live or source evidence; 1 held migration. Studio's data layer is SOUND — the candidate-CRITICAL invoice-view leak was REFUTED by live probe (`security_invoker=on`, anon=0), the email-OR staff seed is 0, the asset-pack HIGHs are dormant (tables not on prod), and money + signatures are sound. The one live HIGH is cross-division: a studio staff role can export 108 other-division customers' support threads via the shared support tables (missing `division` scope). No severity inflation.**
