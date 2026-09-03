# V3-FIRE-STAFF — Pre-launch adversarial security audit · STAFF division

**Entity:** Henry Onyx Limited (brand henryonyx.com). `@henryco/*`, `*_role_memberships`, `customer_*` are internal codenames.
**Division:** `apps/staff` — the internal staff console: KYC/identity review, cross-division support, moderation, finance ops, newsletter authoring/sending, and the staff-auth model that gates all of it.
**Date:** 2026-06-27 · **Branch:** `v3/fire-staff-audit` (off `origin/main`) · **Run:** 9th and final in the V3-FIRE program.
**Posture:** READ-ONLY. Live prod (`rzkbgwuznmdxnnhmjazy`) probed as `anon`/authenticated-stranger only — **never** service_role. No prod change; fixes are held for architect re-verification.
**Method:** 2 parallel mapping agents (KYC/support/auth-model; newsletter) + first-hand reads of every newsletter route + service + the canonical suppression package + live MCP probes.

---

## Verdict

**0 CRITICAL (live) · 2 HIGH (design/governance, pre-data launch-blockers) · 6 MEDIUM · LOWs.**

The **data layer is sound**: authenticated-stranger reads = **0** on every sensitive staff table (`platform_moderation_queue`, `customer_verification_submissions`, `customer_documents`, `support_threads`), and `platform_moderation_queue` is a deny-all lockbox (RLS-on + 0 policies). The risk lives in the **application layer**: the two staff API routes (`/api/kyc/review`, `/api/support/reply`) and all newsletter routes use the **service-role admin client, which bypasses RLS** — so the TypeScript gate is the *only* control. Two design weaknesses there are pre-launch blockers; the rest are the program's recurring systemic patterns (user_metadata trust, email-OR binding) plus newsletter governance/consent correctness.

| ID | Sev | Title | Live exposure |
|----|-----|-------|---------------|
| STAFF-1 | HIGH (design) | KYC verdict-tamper: `/api/kyc/review` gated by cross-division `division.moderate`, no dedicated reviewer role | Pre-data: **0 active moderation-family** holders; 1 high-trust `marketplace_owner` |
| STAFF-2 | HIGH (governance) | Newsletter: no 4-eyes (single manager author→approve→send) + per-division permission gates a platform-wide blast | Pre-data: 1 subscriber, 0 campaigns |
| STAFF-3 | MEDIUM (latent) | `user_metadata.role` escalation in both auth stacks | 0 today (no NULL `profiles.role`) |
| STAFF-4 | MEDIUM | `test-send` arbitrary-recipient relay over the verified email domain | Authenticated content-staff only; pre-data |
| STAFF-5 | MEDIUM | email-OR membership binding | 1 active claimable seed (`academy@henryonyx.com`); marketplace seeds now inactive |
| STAFF-6 | MEDIUM | Newsletter send diverges from canonical suppression evaluator → marketing to opt-outs | Pre-data; consent/compliance |
| STAFF-7 | PASS + LOW | `/api/support/reply` is division-scoped (NOT the studio STU-1 class); residual: reply body skips contact-safety floor | — |
| STAFF-8 | MEDIUM (bounded) | Cross-division Track C modules `getRoleGate → allow` (UI gate is a no-op; relies wholly on RLS) | Escalation REFUTED (queue deny-all) |
| STAFF-9 | LOW | `suppress` endpoint gated only by `division.read` → blocklist-griefing | Internal |
| STAFF-10 | INFO | Orphaned `getKycQueue` dead code; missing KYC review-queue UI vs live endpoint; `x-supabase-user` header-trust not reachable here | — |

---

## Live probe evidence (read-only)

```
profiles.role distribution ........... customer 12 · staff 2 · manager 2 · rider 1 · owner 1  (18 rows, ZERO null)  → STAFF-3 shadowed
authenticated-stranger reads ......... platform_moderation_queue / customer_verification_submissions
                                       / customer_documents / support_threads = 0  (deny-all holds)  → STAFF-8 escalation REFUTED
role-membership tables (5 exist) ..... learn · logistics · marketplace · property · studio (all RLS-on; no jobs_/care_/account_ table)
active moderation-family holders ..... 0   (marketplace `moderation` = active:0, the deactivated henrycogroup seed)  → STAFF-1 pre-data
active user_id-null claimable seed ... learn.academy_owner (academy@henryonyx.com) = 1; every marketplace user_id-null seed = active:0  → STAFF-5
newsletter email_* tables ............ RLS-on service-role-only; stranger read=0; PRE-DATA (subscribers=1, campaigns=0, sends=0)
```

---

## Findings

### STAFF-1 — HIGH (design; live exposure pre-data) — KYC identity-verdict tamper via an over-broad cross-division gate
**Asset:** `apps/staff/app/api/kyc/review/route.ts` (admin/service-role client).
**Evidence:** the gate is `viewerHasPermission(viewer, "division.moderate")`, where `viewer.permissions` is the **union across every division the viewer belongs to**. `division.moderate` is conferred by the `moderation_staff` family (`marketplace_moderator`, `jobs_moderator`, `property_moderator`, `certification_manager`) and `system_admin`. There is **no KYC-specific role** and **no entitlement check** binding the reviewer to the customer. So any divisional content moderator could `POST {submissionId, decision:"approved"}` and flip **any** customer's `customer_profiles.verification_status` to `verified` — which gates wallet withdrawals and seller approval. The admin client bypasses RLS, so the TS gate is the only control.
**Why it's not live today (calibration):** the active-role census on prod shows **0 active `moderation`/`*_moderator` holders** (marketplace `moderation` = `active:0` — the deactivated henrycogroup seed); the only active role that carries `division.moderate` is a single, inherently high-trust `marketplace_owner`. So the sharp form (a low-trust moderator tampering with identity verdicts) is **pre-data** — but it is a **HIGH design launch-blocker**: introduce a dedicated KYC/identity-reviewer role (or scope to an `account`/`identity` membership) **before onboarding any divisional moderators.**
**Data-minimization — PASS:** the write path selects only `id, user_id, document_type`; audit/notification meta carry no raw BVN/NIN; the audit insert is fail-closed.

### STAFF-2 — HIGH (governance; pre-data) — Newsletter: no separation of duties + per-division permission gates a platform-wide blast
**Assets:** `apps/staff/app/api/newsletter/drafts/[id]/{submit,approve,send}/route.ts`, `apps/staff/lib/newsletter/service.ts:approveDraft`.
**Evidence (first-hand):** `submit`/`test-send` require `content_staff`+`division.write`; `approve`/`send` require `division.approve` (manager+). The author/approver split is real for a *content author* — but a single **`division_manager`/`supervisor` holds BOTH `division.write` AND `division.approve`**, so one person can author→submit→approve→send a blast alone, and `approveDraft` sets `approved_by = actorId` **without ever checking `approver ≠ author`** (no enforced 4-eyes). Worse, `viewerHasPermission` tests the **union across all divisions**, so a manager in **one** division (e.g. care) can approve+send a **platform-wide** newsletter to every subscriber.
**Live exposure:** pre-data (`email_subscribers` = 1, `email_campaigns` = 0). Insider / compromised-manager vector. **Fix before launch:** enforce `approver ≠ author`, add a newsletter-specific approver role instead of the per-division `division.approve` union, and bind approve/send to the campaign's own division.

### STAFF-3 — MEDIUM (latent) — `user_metadata.role` privilege escalation
**Assets:** `apps/staff/lib/staff-auth.ts` (`profile?.role || app_metadata.role || user_metadata.role`); `packages/auth/src/viewer.ts` (same chain → `hasStaffAccess`).
**Evidence:** `user_metadata` (`raw_user_meta_data`) is writable by the authenticated user via `auth.updateUser({ data: { role: 'owner' } })`. If a victim/attacker account had a NULL `profiles.role`, the `||` chain would fall through to the user-controlled value and admit them to the staff shell.
**Why it's not reachable today (calibration):** the live `profiles.role` distribution is **customer 12 / staff 2 / manager 2 / rider 1 / owner 1 — ZERO null**, and `'customer'` is truthy (not in the role maps), so the `||` short-circuits before `user_metadata` for every existing account. This settles the agent's open question ("F-1 reaches CRITICAL only if `profiles.role` is NULL") — it is **not** NULL anywhere. Same systemic anti-pattern as property PROP-1. **Fix:** drop the `user_metadata.role` fallback; trust only `profiles.role` / `app_metadata` (the SQL `is_staff_in()` source of truth already ignores `user_metadata`).

### STAFF-4 — MEDIUM — `test-send` arbitrary-recipient relay over the verified email domain
**Assets:** `…/test-send/route.ts` → `service.ts:sendTestDraft`.
**Evidence (first-hand):** `sendTestDraft({ to })` takes `to` straight from the request body (only `normalizeEmail`), renders the full draft HTML, and sends it via `brevoSendTransactional` over the company's **verified Brevo sending domain** — with **no restriction** that `to` be the actor's own address or on a staff allowlist, and no rate limit. An authenticated `content_staff` (or a phished content-staff account) is therefore an arbitrary-recipient email relay carrying attacker-authored HTML signed by the company's DKIM/SPF.
**Calibration:** MEDIUM, not HIGH — authenticated-insider only (no anon path, no data leak) and pre-data; but a single phished content-staff session turns this into a company-reputation phishing engine, so it is a real pre-launch hardening item. **Fix:** pin `to` to the actor's verified email (or a staff allowlist) + rate-limit.

### STAFF-5 — MEDIUM — email-OR membership binding
**Assets:** `apps/staff/lib/staff-auth.ts` and `packages/auth/src/viewer.ts` (`.or("user_id.eq.… , normalized_email.eq.…")`, read via service-role).
**Evidence:** membership is granted if `user_id` **OR** `normalized_email` matches — the same class as the marketplace henrycogroup seed. Live census: the **only active `user_id`-null, email-claimable seed remaining is `learn.academy_owner` (`academy@henryonyx.com`)**; every marketplace `user_id`-null seed is now `is_active = 0` (the henrycogroup neutralization, re-confirmed). henryonyx.com is company-controlled (lower risk than a public domain), but it is still a claimable active staff seed: whoever provisions/controls that mailbox and registers inherits learn `academy_owner`. Note the SQL `is_staff_in()` matches on `user_id` only, so this weakness lives purely in the TS layer (affects the admin-client API gates + module visibility). **Fix:** match `user_id` only; remediate the learn seed (bind a `user_id` or deactivate). See `v3-fire-staff-proposed-fixes/data-remediation_learn_academy_seed.sql`.

### STAFF-6 — MEDIUM — Newsletter send diverges from the codebase's own canonical suppression evaluator
**Assets:** `apps/staff/lib/newsletter/service.ts:runCampaignSend` (lines ~896-918) vs `packages/newsletter/src/suppression.ts:evaluateSuppression`.
**Evidence (proven by divergence):** the canonical `scopeMatchesCampaign("transactional_only", class)` returns **true → suppress** for every non-`transactional_education` campaign (a transactional-only subscriber must NOT get marketing). But `runCampaignSend` hand-rolls its own filter and does `if (e.scope === "transactional_only") return false` → treats it as **not a block** → **marketing is sent to transactional-only opt-outs**. The inline reimplementation also ignores `campaign_class` entirely and skips the support/trust/legal-hold gates `evaluateSuppression` enforces. This is a consent/compliance (GDPR/CAN-SPAM) correctness bug, not an RLS hole. Pre-data. **Fix:** call `evaluateSuppression()` in the send loop instead of the bespoke check.

### STAFF-7 — PASS (with LOW residual) — `/api/support/reply` is division-scoped (NOT the studio STU-1 class)
**Evidence (first-hand):** the route enforces `threadDivision` membership before writing (`!threadDivision || threadDivision==='account'||'support' || workspace.manage || staff.directory.view || viewer.divisions.some(division===threadDivision)`). A staffer can only reply within their own division (or account/support/empty, or as admin). It is a write path, not a cross-division PII export — so the STU-1 read-leak class does **not** apply here.
**LOW residuals:** (1) the reply `message` is inserted **raw**, bypassing the `@henryco/contact-safety` floor — a rogue/compromised staffer can push off-platform contact details to customers (confirm intent for official staff replies); (2) the `account`/`support`/empty-division branch makes those threads writable by **any** staff, which composes with STAFF-3.

### STAFF-8 — MEDIUM (bounded) — Cross-division Track C modules have a no-op role gate
**Assets:** `packages/dashboard-modules-staff/src/{staff-support,staff-moderation,staff-finance-operator,staff-overview,staff-settings}` — each `getRoleGate(viewer) { return { kind:"allow" } }`. Division-bound modules correctly gate on membership; these five cross-division modules are visible to **any** `hasStaffAccess` viewer.
**Why defense-in-depth holds (live-verified):** the module page bodies read via the **user-session client** (RLS applies), and the underlying tables are `is_staff_in()`-scoped. The agent's worst case — that `platform_moderation_queue` RLS might be broad → cross-division data read — is **REFUTED**: prod shows `platform_moderation_queue` is **RLS-on + 0 policies = deny-all**, and the authenticated-stranger read = 0. **Still fix:** gate these modules on a real membership/family (don't rely solely on RLS); this becomes HIGH instantly if any cross-division module is ever switched to the admin client.

### STAFF-9 — LOW — `suppress` endpoint enables blocklist-griefing
`apps/staff/app/api/newsletter/suppress/route.ts` is gated by `division.read` + a broad family list (incl `support_staff`). `manuallySuppress` only **adds** suppression rows, so a low-privilege staffer can blocklist arbitrary emails (deny legit subscribers). LOW (internal griefing). Gate on an audience/marketing role.

### STAFF-10 — INFO
- `apps/staff/lib/kyc-data.ts:getKycQueue()` reads raw `customer_documents.file_url` + customer email/name but is **dead code**; the `(workspace)/kyc` page is a 308 stub redirecting to `staff-moderation`, which ignores the `lens` param and renders `platform_moderation_queue` (no `customer_verification_submissions` read). So the KYC review-**queue UI is effectively absent** while `POST /api/kyc/review` stays live. Confirm where reviewers obtain submission IDs and whether `customer_documents.file_url` is a long-lived/public URL (systemic Cloudinary class).
- `packages/auth/src/viewer.ts:requireUnifiedViewer` trusts an `x-supabase-user` header, but in `apps/staff` it is **not reachable** (`proxy.ts` never sets it; Track C feeds `buildUnifiedViewer` from a real `auth.getUser()`). Flag for whichever app populates that header — strip it from inbound requests.

---

## What is sound (proven)
- Every sensitive staff table denies the authenticated stranger (read = 0); `platform_moderation_queue` is a deny-all lockbox; the SQL `is_staff_in()` predicate joins real membership tables + `profiles.role` and never consults `user_metadata`.
- `/api/kyc/review` does not echo raw identity numbers (data-minimized; audit fail-closed); `/api/support/reply` is division-scoped.
- Newsletter audience tables are RLS-on service-role-only; the editorial state machine (`transitionTo`) enforces valid `from`-states and runs the voice-guard before approve/schedule/send.

## Held artifacts (DO NOT APPLY until architect re-verification)
- `v3-fire-staff-proposed-fixes/README.md` — app-layer (TS) fix specs for STAFF-1..STAFF-6, STAFF-8, STAFF-9 (these are code changes, not SQL migrations).
- `v3-fire-staff-proposed-fixes/data-remediation_learn_academy_seed.sql` — owner-gated data fix for the one active `user_id`-null staff seed (STAFF-5).

## Cross-references
- Systemic `user_metadata.role` (STAFF-3): property PROP-1. Systemic email-OR (STAFF-5): marketplace / studio / jobs / learn / account / hub FIRE reports.
- Calibration: every CRITICAL/HIGH candidate was settled by a live probe before labeling. STAFF-1 worst-case and STAFF-2/4/6 are all **pre-data**; STAFF-8's escalation-to-HIGH was **refuted** by the deny-all queue. This closes the V3-FIRE program at **9/9 divisions**.
