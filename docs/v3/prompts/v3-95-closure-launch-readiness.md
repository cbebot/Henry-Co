# V3-95 — Closure: Launch Readiness & Owner Sign-Off Pack

**Pass ID:** V3-95  ·  **Phase:** I (Platform / Global / Observability / Closure)  ·  **Pillar:** P12 (Global, Mobile, Observability, Closure)
**Dependencies:** V3-94 (cross-pillar integration test — INTEGRATION-VERIFIED)  ·  **Effort:** M  ·  **Parallel-safe:** N (sequential close of V3)
**Owner gate:** none to start — but the pass terminates in the owner's signature on the readiness pack  ·  **Risk class:** Money, Identity, Compliance (final re-confirmation)

---

## Role

You are the V3 launch-readiness auditor for Henry Onyx. You execute exactly this one pass, then stop and report. This is the final verification gate before the public launch (V3-96): you do not build features and you do not re-run V3-94's integration walk — you **assemble the single sign-off pack that proves the platform is launch-ready**, close every operational item that a functional test cannot cover (credential rotation, backup restore drill, production capacity, incident response), and walk the owner through the pack to collect a signature. The line you must not cross: you ship no new product code; you do not mark any checklist item green without live evidence; you do not rotate a credential without confirming the new key works in production scope first; and you do not declare LAUNCH-READY while a single Money / Identity / Compliance item, owner decision, or gating legal item is open.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/95-closure-launch-readiness` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-94 returned **INTEGRATION-VERIFIED**: every pass V3-13 → V3-93 is re-verified on `main` and production, the Foundation Lock regression holds, the auth + role matrix is clean, every Money / Identity / Compliance flow re-passed live, and the owner walked the platform end-to-end. That proves the platform *works*. This pass proves it is *ready to launch* — a different bar. Launch readiness is the operational and governance layer V3-94 cannot cover by walking surfaces: are all secrets rotated and revoked-where-stale? Is there a verified, recent restore drill? Are Vercel, Supabase, Cloudinary, and every provider on capacity tiers sized for expected V3 launch load? Is there a published incident-response runbook with an on-call rotation? Are all 17 owner decisions (`DECISIONS-REQUIRED.md` D1–D17) answered, all 18 legal/business items (`LEGAL-AND-BUSINESS.md` L1–L18) closed or explicitly deferred, and every integration key (`INTEGRATION-KEYS.md`) provisioned in production scope?

The raw material exists: `INTEGRATION-KEYS.md` enumerates every env var and its rotation interval; `LEGAL-AND-BUSINESS.md` enumerates the 18 prerequisites; `DECISIONS-REQUIRED.md` holds the 17 decisions; `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` and every phase report sit on file; the `/api/health` probe (`buildHealthResponse()`) and Sentry are live across all 13 apps; `audit_log_v2` records every sensitive action. What does not yet exist is the **single consolidated pack** that ties all of it into one owner-signable document — plus the operational drills (rotation, backup, capacity, incident runbook) that have never been done as a launch gate. This pass produces both.

## Mandatory scope

### S1 — The launch-readiness sign-off pack

Author `docs/v3/V3-LAUNCH-READINESS.md` — the single owner-signable closure artifact. It consolidates, with live evidence (not assertion) per row:
- **Every pass V3-01 → V3-94 verified** — a row per pass referencing its report + the V3-94 re-verification result; status `verified` / `verified-with-residual` (residual named) / `blocked`.
- **Every owner decision answered** — D1 → D17 from `DECISIONS-REQUIRED.md`, each with its recorded answer (D1/D2/D3/D6/D11 were answered in PR #159 — confirm, do not re-litigate; record any later pivots with their dated notes). Any unanswered decision that gates a *launched* surface is a blocker.
- **Every legal/business item closed or explicitly deferred** — L1 → L18 from `LEGAL-AND-BUSINESS.md`, each marked `Closed YYYY-MM-DD: <evidence>` or `Deferred (V4): <owner ack>`. Any L-item that gates a *live* pass (e.g. L1 entity for live Paystack, L4 merchant approval, L5 KYC contract, L6 privacy policies, L18 refund policy) and is still open is a blocker.
- **Every integration key provisioned + rotated** — cross-reference `INTEGRATION-KEYS.md`; one row per integration confirming a current, working key exists in **production scope** (and, per the Vercel scoping lesson, preview + development scopes too).
- **Performance baseline within targets** — reference the V3-94 perf diff; confirm within tolerance of the V3-12 Foundation Lock baseline.
- **Security posture clean** — V2-PNH-04 headers gate green on all 13 apps; RLS verified denying cross-tenant; no secret in any client bundle (grep the built bundles).
- **Foundation Lock holds** — reference the V3-94 S4 regression result.
- **Each phase (B → I) has a cert / report on file** — list the path per phase.

### S2 — Pre-launch credential rotation

Rotate every production secret in `INTEGRATION-KEYS.md` and revoke the superseded keys. For each: generate the new key in the provider console → set it in the correct Vercel scope(s) (production + preview + development per the scoping lesson) → **confirm the new key works in production before revoking the old one** (probe the dependent flow: a Supabase query, a Paystack test charge, a Resend send, a Cloudinary fetch, an Anthropic call, a Sentry event) → revoke the old key → record the rotation date + the next rotation interval (90–365 days per sensitivity, per `INTEGRATION-KEYS.md`). Record every rotation in `V3-LAUNCH-READINESS.md` §"Credential rotation log". Never log a key value; never commit a key; the `.env`/Vercel settings remain the only source of truth.

### S3 — Backup + restore verification

Confirm a **restore drill < 30 days old**: take a Supabase backup → restore it to a scratch project → verify data integrity (row counts on the high-stakes tables: `payment_intents`, `wallet_transactions`, the ledger, KYC tables, `audit_log_v2`, `henry_events`) → document the restore time. Confirm the off-site replica posture and the RPO/RTO targets per data class (the V3-92 contract — this pass confirms V3-92 shipped and the drill is recent; it does not re-build V3-92). Record the drill date + RPO/RTO evidence in the pack. A drill older than 30 days, or a failed restore, is a blocker.

### S4 — Production capacity

Confirm every dependency is on a capacity tier sized for expected V3 launch load:
- **Vercel:** plan tier, function concurrency, bandwidth, and build-minute headroom for all 13 projects.
- **Supabase:** compute tier, connection-pool size (PgBouncer), storage headroom, and read-replica posture for the project ref `rzkbgwuznmdxnnhmjazy`.
- **Cloudinary:** transformation + bandwidth + storage quota headroom.
- **Providers:** Paystack/Stripe rate limits; Anthropic/OpenAI rate + spend caps; Resend/Brevo send limits; OneSignal/Twilio/Termii throughput; Upstash Redis tier; Typesense host capacity; DeepL quota.
Record the tier + headroom margin per dependency. A dependency with no headroom for projected launch traffic is a blocker (or an owner-acknowledged risk with a scale-up runbook).

### S5 — Incident-response runbook

Author `docs/v3/INCIDENT-RESPONSE-RUNBOOK.md`: the on-call rotation, the escalation path (who, in what order, with what SLA), the severity classification, the comms plan (status page, customer notification, owner notification), the rollback procedure (Vercel instant rollback + the `/api/health` 503 → rollback-trigger evaluation from the V3-12 soak playbook), the money-incident playbook (how to freeze a payment rail, reconcile, and refund safely without violating the money invariants), and the data-breach playbook (NDPR/GDPR notification timelines per L14/L17). Cross-reference the Sentry alerting (V3-89) and the `/api/health` monitoring (`monitoring-conventions.md` — monitors target production aliases, never raw `*.vercel.app`).

### S6 — Final M / I / C re-confirmation

A final, focused re-confirmation distinct from V3-94's broad walk: confirm each Money / Identity / Compliance-flagged pass is in a launch-safe state. Money — the four absolute invariants hold and the live payment rail's merchant account (L4) is approved and the legal entity on receipts is **"Henry Onyx Limited"** (L1). Identity — KYC vendor contract (L5) is signed and the verification-level gating is live. Compliance — privacy policies (L6), refund policy (L18), consent banner (L17), DPAs (L14), and data-residency commitments (L16) are closed or owner-deferred. Record each L1 → L18 status; engage legal review for any live customer-facing flow. Any open M/I/C-gating item is a launch blocker.

### S7 — Owner sign-off ceremony

Walk the owner through `docs/v3/V3-LAUNCH-READINESS.md` row by row on a live screen. For each section the owner confirms or rejects. Any rejection opens a `V3-NN-FOLLOWUP` row in `PASS-REGISTER.md` and the pack stays unsigned until it closes. When every row is confirmed, the owner signs the pack (signature line + date). The signed pack is the single condition that unblocks V3-96 (showcase / public launch). Produce the verdict: **LAUNCH-READY** (signed) or **NOT READY** (every blocking item named).

## Out of scope

- Re-running the V3-94 cross-pillar integration walk — V3-95 *consumes* V3-94's evidence, it does not repeat it.
- New feature work or new product surfaces (acceptance + operational readiness only).
- Building backup/replica infrastructure (V3-92) or Sentry alerting/SLOs (V3-89) — this pass *confirms* they shipped and the drills are recent; it does not build them.
- The public launch announcement, screen recordings, press kit, customer FAQ, what's-new page → **V3-96**.

## Dependencies

- **Requires:** **V3-94** returned INTEGRATION-VERIFIED. Reads every pass report, the Foundation Lock certificate, `INTEGRATION-KEYS.md`, `LEGAL-AND-BUSINESS.md`, `DECISIONS-REQUIRED.md`, the V3-92 backup posture, and the V3-89 observability depth.
- **Blocks:** **V3-96** (public launch showcase) — no announcement ships until the owner signs the readiness pack.

## Inheritance

- `docs/v3/INTEGRATION-KEYS.md` — the env-var + rotation-interval inventory (S1, S2).
- `docs/v3/LEGAL-AND-BUSINESS.md` — the L1–L18 prerequisites (S1, S6).
- `docs/v3/DECISIONS-REQUIRED.md` — the D1–D17 decisions (S1).
- `docs/v3/FOUNDATION-LOCK-CERTIFICATE.md` + every phase report under `.codex-temp/v3-NN-<slug>/report.md` (S1).
- `@henryco/observability`: `buildHealthResponse()` / `healthStatusCode()` (S4/S5 health monitoring), Sentry (S5 alerting), `audit_log_v2` (rotation + sign-off audit trail), the `henry_events` sink.
- The V3-92 backup/DR contract (S3) and V3-89 observability depth (S5) — confirmed, not rebuilt.
- `@henryco/config` (`company.ts`) — the brand + legal-entity source for the pack (**Henry Onyx Limited** on every legal/compliance row); `monitoring-conventions.md` for monitor targets.

## Implementation requirements

### Files
- `docs/v3/V3-LAUNCH-READINESS.md` (new — the signed closure artifact; S1, S2 rotation log, S6 M/I/C status, S7 signature).
- `docs/v3/INCIDENT-RESPONSE-RUNBOOK.md` (new — S5).
- `docs/v3/LEGAL-AND-BUSINESS.md` (edit — mark each L-item `Closed YYYY-MM-DD` or `Deferred (V4)`; **also correct the stale entity name to "Henry Onyx Limited"** — the doc predates the identity unification and still reads the retired name).
- `docs/v3/DECISIONS-REQUIRED.md` (edit — confirm every answered decision; no re-litigation).
- `docs/v3/PASS-REGISTER.md` (edit — append any `V3-NN-FOLLOWUP` raised by the owner ceremony).
- `.codex-temp/v3-95-closure-launch-readiness/report.md`.
- **No migrations; no new feature code.**

### Trust / safety / compliance
This pass is the final governance gate — it does not declare LAUNCH-READY while any Money / Identity / Compliance item, owner decision, or gating legal item is open. Credential rotation (S2) confirms each new key works in production *before* revoking the old one (no self-inflicted outage), never logs a key value, and never commits a secret. The backup drill (S3) verifies row-count integrity on the high-stakes tables. Every rotation and the sign-off itself are recorded in the pack and in `audit_log_v2`. Legal review is engaged for every live customer-facing M/I/C flow.

### Mobile + desktop parity
The S7 owner ceremony confirms the pack covers both web and the Expo super-app surfaces (the V3-87 parity + V3-88 store-submission status row in the pack). Both platforms' launch-readiness is signed, not just web's.

### i18n
Per the D10 localization commitment (confirm its recorded answer — Nigeria-primary unless pivoted), the pack records which markets V3 launches localized for. No new user-facing strings are introduced; any incidental string in an operational surface flows through `@henryco/i18n` under its namespace.

### Brand & design system
The pack and runbook name the brand **Henry Onyx** and the legal entity **Henry Onyx Limited**, sourced conceptually from `@henryco/config` (`company.ts` `legalName`) — never "Henry & Co.", never the retired "Henry Holdings"/"Henry & Co. Limited" names. Receipt/invoice/payment-doc legal entity on every money row = **Henry Onyx Limited** (must match the CAC entity for Paystack compliance, L1). No UI is built; no tokens or domains are touched beyond confirming they resolve through config.

## Validation gates

1. **Standard CI** green on the branch: `Lint, typecheck, test, build`.
2. **S1 pack complete:** every pass V3-01 → V3-94 row present with verified status + evidence; every D1–D17 answer recorded; every L1–L18 closed/deferred; every `INTEGRATION-KEYS.md` integration provisioned in production scope.
3. **S2 rotation:** every production secret rotated; new key confirmed working in production before the old key was revoked; rotation log + next-interval recorded; zero key values logged or committed.
4. **S3 backup drill:** restore drill < 30 days old, row-count integrity verified on the high-stakes tables, restore time + RPO/RTO recorded.
5. **S4 capacity:** every dependency's tier + headroom recorded; no zero-headroom blocker (or owner-acknowledged with a scale-up runbook).
6. **S5 runbook:** `INCIDENT-RESPONSE-RUNBOOK.md` published with on-call rotation, escalation, comms, rollback, money-incident, and data-breach playbooks.
7. **S6 M/I/C:** every M/I/C-gating L-item closed or deferred; the four money invariants re-confirmed; KYC + privacy + refund + consent + DPA status recorded.
8. **S7 ceremony:** owner walked the pack row by row; every gap filed as `V3-NN-FOLLOWUP`; pack signed.

## Deployment gate

This pass **is** the gate. No product code deploys. The branch goes off `origin/main` → PR → CI green → squash-merge (no force-push, no branch-protection bypass). The pass closes only when `V3-LAUNCH-READINESS.md` is **signed by the owner** with every S1–S7 item green and every raised `V3-NN-FOLLOWUP` closed. The signed pack is the single condition that unblocks **V3-96** (public launch). If any item is open, the verdict is NOT READY and the pass stays open until the named follow-ups close.

## Final report contract

`.codex-temp/v3-95-closure-launch-readiness/report.md` with the standard 9 sections: 1) executive summary (verdict: LAUNCH-READY signed, or NOT READY with blockers named); 2) files changed; 3) migration/RLS/env (no schema; the credential-rotation summary belongs here — which env vars rotated, in which scopes, with confirmation-before-revoke evidence; never the values); 4) validation evidence (the completed `V3-LAUNCH-READINESS.md` pack); 5) smoke (S4 capacity + S3 restore-drill evidence); 6) live verification (S6 M/I/C re-confirmation + S2 production-key probes); 7) telemetry baseline (final `henry_events` + Sentry health snapshot at launch); 8) deferred items (every `V3-NN-FOLLOWUP` + every L-item explicitly deferred to V4 with owner ack); 9) pass-closure assertion (LAUNCH-READY, owner signature recorded). Hand-off: **V3-96** (V3 showcase / public launch).

## Self-verification

- [ ] S1: `V3-LAUNCH-READINESS.md` authored — every pass V3-01 → V3-94 verified; D1–D17 answered; L1–L18 closed/deferred; every `INTEGRATION-KEYS.md` integration provisioned in production scope; perf within target; security clean; Foundation Lock holds; each phase B–I has a cert/report referenced.
- [ ] S2: every production secret rotated; new key confirmed working in production *before* revoking the old; rotation log + next interval recorded; no key value logged or committed.
- [ ] S3: restore drill < 30 days old; row-count integrity verified on `payment_intents` / `wallet_transactions` / ledger / KYC / `audit_log_v2` / `henry_events`; restore time + RPO/RTO recorded.
- [ ] S4: Vercel + Supabase + Cloudinary + every provider tier + headroom recorded; no zero-headroom blocker (or owner-acknowledged scale-up runbook).
- [ ] S5: `INCIDENT-RESPONSE-RUNBOOK.md` published — on-call, escalation, comms, rollback, money-incident, data-breach playbooks; monitors target production aliases.
- [ ] S6: every M/I/C-gating L-item closed or deferred; four money invariants re-confirmed; receipt legal entity = "Henry Onyx Limited"; KYC/privacy/refund/consent/DPA status recorded.
- [ ] S7: owner walked the pack row by row; every gap filed as `V3-NN-FOLLOWUP`; pack signed.
- [ ] Brand correctness: Henry Onyx / Henry Onyx Limited throughout; stale entity name in `LEGAL-AND-BUSINESS.md` corrected; never "Henry & Co."/"Henry Holdings".
- [ ] Report written with verdict LAUNCH-READY (signed) or NOT READY; hand-off: **V3-96** (showcase).
