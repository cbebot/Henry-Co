# Founder Command Center + Founder Intelligence — Program Spec

**Date:** 2026-07-10 · **Owner directive:** rebuild the founder dashboard so
everything is smart and functional ("all buttons have what they're there for…
all operations across the entire ecosystem"), and replace the fake owner AI
with a real Founder Intelligence System (morning brief, social management,
strategic advice, real-time alerts, audited write access). Study first so
nothing breaks.

## Study conclusion (7-agent workflow `wf_7fdede48-efd`, adversarially verified)

**The command center is overwhelmingly REAL** — 38 owner pages + ~30 API/cron
routes, no dead buttons, one service-role aggregation layer
(`apps/hub/lib/owner-data.ts`, 27+ live tables + auth admin), a read-only
double-entry ledger console, a real owner inbox (HMAC-verified Cloudflare
Email Worker → `received_emails`, SES reply), real staff/brand/pages CRUD,
HQ team chat, audit surfaces, owner reporting crons. Deleting it wholesale
would destroy working capability; the rebuild targets what is actually fake
plus the gaps.

**The fake, precisely:** the "owner AI" — a gold assistant FAB that is a bare
`<Link>`, "AI & Helper Layer" branding over deterministic threshold rules,
five canned recommendation templates (`buildHelperInsights`), zero model
calls anywhere in hub owner code. Secondary honesty debts: invented
"Health score X/100" (hand-tuned heuristic), static freshness prose, a stale
hardcoded incident claim, hardcoded division roster prose, two dead tile
files, stale Resend comments, an orphan v3-launch route.

**Refuted by verification (do NOT "fix"):** owner/login "dead branches" —
the page imports the `{ok,reason}`-returning gate (`app/lib/owner-auth.ts`),
not the OwnerUser-returning one (`lib/owner-auth.ts`); the two same-named
gates coexist deliberately (page-gate redirects, API-gate returns). The
workforce dataHealthNote is factual mechanism prose, not a fake freshness
claim. The inbox reply path IS SES (comments were stale, now fixed).

## Phases

- **F1 — Truth pass (THIS PR):** every AI claim removed until earned
  ("Signals & Insights"; FAB honestly labeled), stability-index rename with
  formula disclosure at source + render sites, computed freshness note,
  stale incident/roster prose fixed, dead tiles deleted, v3-launch linked
  into the rail, SES comment truth. Copy module: EN + fr/es/pt/ar/de/it/zh
  native rewrites; hi/ig/yo/ha fall back to EN by omission (doctrine).
- **F2 — Founder Intelligence (real):** `hub.founder.assist` surface in the
  ai-gateway registry (owner-gated BEFORE runAiTask, separate flag
  `NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE`, decide kill-switch independence);
  founder-scale facts builder over `getOwnerBaseDataset` +
  `getFinanceLedgerSnapshot`; envelope {answer, navigate(closed owner-route
  catalog), proposeAction(closed catalog, F3), escalate}; deny-RLS
  `founder_intelligence_*` tables (independent access model from support AI);
  ChatThread embed replaces the FAB link; every call audited via
  createAiTelemetry (henry_events + audit log). Morning brief: DAILY cron on
  the owner-reporting pattern, SES.
- **F3 — Governed write actions:** closed action registry over the 23
  inventoried write operations (payout decisions, dispute resolve, KYC
  verdicts, refunds via /api/payments/intents/[id]/refund, vendor
  applications, newsletter approve/send, staff management, care/studio/learn
  ops). The model may only NAME an action; the server re-authorizes
  (requireOwner + per-action gate) and executes through the EXISTING
  routes/RPCs; owner explicitly confirms before execution; every execution
  lands add_audit_log_v2. Money paths remain guarded-RPC-only. GAP to build:
  wallet-withdrawal review has NO write path today (W3 rail design).
- **F4 — Data completeness:** studio_payments + logistics revenue into the
  owner rollup; signups time-series; refund amounts; port the stubbed
  getDashboardSummary owner branch; honest "no money model" labels for
  jobs/property until wired.
- **F5 — Security hardening:** FIRE HUB-1..4 all STILL PRESENT (verified) —
  is_owner() → SECURITY DEFINER (owner_inbox_is_owner is the proven idiom),
  owner_profiles WITH CHECK pinning, hq_ic_members role constraint,
  email-fallback removal/verification across FOUR gate copies (hub×2, cms,
  viewer.ts). Migrations applied via MCP with owner authorization.
- **F6 — Social pipeline (needs owner platform keys):** mirror the
  newsletter engine (10-state lifecycle, voice guard, approval, suppression)
  for TikTok/Facebook/X/Instagram/LinkedIn/Pinterest; WhatsApp Cloud API
  webhook/env discipline is the Meta-platform precedent. Ships flag-dark;
  owner action: platform apps + tokens.

## Constraints (standing)

Money invariants absolute; founder AI access model independent of support
AI; audit on all writes; keep-list surfaces preserved (inbox, HQ gates,
finance console, team chat, staff/brand CRUD, reporting crons, palette,
realtime bridge); voice = calm authority (no "Jarvis" branding in product).
