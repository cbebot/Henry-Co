# HenryCo Product Gap Ledger

**Status**: Active blocker ledger for the next flagship Claude pass.
**Last updated**: 2026-04-09
**Scope**: Repo truth, likely live truth, product-claim gaps, and exact next-pass boundaries.

## Current Baseline

- Fetched `origin/main` on 2026-04-09 still points to `00586cc fix(care): persist shared account linkage on bookings`.
- The targeted account/care/session cleanup is local repo work and is not deployed from this pass.
- The durable repo-side reference point before this hygiene pass is local commit `39a8e7f fix(release): audit account truth and session continuity`.

## Confirmed Repo-Side Work Already Completed

- Account notifications now support auto-read on open and manual unread persistence through shared-ledger notification records.
- Account subscriptions and invoices now deep-link into dedicated detail routes instead of staying passive summary rows.
- Care bookings in account now open dedicated booking detail routes instead of dumping users back onto the same page.
- Legacy account care links now route through `/care/bookings/[bookingId]` repo-side instead of generating new `/care?booking=` links.
- Learn, logistics, and hub owner auth now share the same cookie-domain continuity approach as account.
- Care public repo copy is calmer than the earlier noisy version, especially on the home and booking routes.

## Confirmed Functionality Gaps

- Support thread and support message unread state is still not real. The shared tables `support_threads` and `support_messages` do not carry `is_read` or `read_at`.
- Notifications do carry `is_read` and `read_at`, so only notification unread persistence is real today.
- The subscriptions dashboard is wired to real shared-ledger tables, but the live shared ledger currently has `0` `customer_subscriptions` rows.
- The invoices dashboard is wired to real shared-ledger tables, and the live shared ledger currently has `2` `customer_invoices` rows.
- Receipt file publishing is still division-dependent. Account can render invoice truth, but it cannot invent downloadable receipts that were never published.
- The local logistics workspace used for this pass still lacks a valid `app/` or `pages/` tree even though the public logistics site is live.

## Confirmed Repo/Live Mismatches

- Care public live HTML fetched on 2026-04-09 still does not contain the calmer repo-side `Service clarity` block and still exposes loading copy on first render. This is a deploy mismatch until proven otherwise.
- Live shared-ledger notifications still include legacy care links. A direct count on 2026-04-09 returned `409` `customer_notifications` rows matching `/care?booking=%`.
- Live public surfaces still expose loading or warmup copy on first render:
- Care live HTML includes `Preparing the public Care experience`.
- Learn live HTML includes `Loading your learning experience`.
- Logistics live HTML includes `Loading logistics` and `Preparing shipping, tracking, and delivery services`.
- Studio live HTML includes `Loading HenryCo Studio` and `Preparing your creative workspace`.
- Marketplace live HTML includes `Loading marketplace` and `Preparing products, stores, and your personalized experience`.
- Property live HTML still renders a visible loading surface on first response.
- Jobs live HTML still contains employer marketing copy that promises shortlist and interview work in one workspace tied to the HenryCo account.

## Public Surface Truth Notes

### Care

- Repo truth: calmer than before, but still denser than a world-class first impression.
- Live truth: still appears stale versus the current repo branch and still exposes loading copy on first render.
- Next-pass boundary: keep cleanup premium and calm, but do not call it live until a deploy and browser recheck happen.

### Learn

- Repo truth: public loading components still rely on `Preparing` and `Loading` language.
- Live truth: root HTML still exposes learning-loading copy on first render.
- Next-pass boundary: convert loading language from theatrical warmup copy into plain-state, low-drama status language.

### Jobs

- Repo truth: jobs public and workspace messaging still leans heavily on shortlist, interview, recruiter, and employer-console confidence language.
- Live truth: the public site still promises shortlist and interview workflow depth that needs governed verification before it should be sold hard.
- Next-pass boundary: align public claims with the actually governed employer and recruiter implementation.

### Logistics

- Repo truth: session continuity improved, but the local app tree is incomplete for a trustworthy build claim.
- Live truth: the public site is reachable and still exposes loading/preparing copy.
- Next-pass boundary: separate public-site truth from local workspace truth until the logistics source tree is restored.

### Property

- Repo truth: property still uses a generic loading-first entry surface and was not refined in this pass.
- Live truth: root HTML still exposes a loading surface.
- Next-pass boundary: refine the first-render loading experience only after higher-priority truth gaps are closed.

### Studio

- Repo truth: studio was not rebuilt in this pass and still carries broader workflow and fallback persistence risk.
- Live truth: root HTML still exposes `Loading HenryCo Studio` / `Preparing your creative workspace`.
- Next-pass boundary: pair public polish with the larger studio schema and delivery audit, not as isolated cosmetics.

### Marketplace

- Repo truth: marketplace public shell is strong, but the empty-state copy still needed a truth-first tone adjustment in this hygiene pass.
- Live truth: root HTML still exposes loading/preparing copy on first render.
- Next-pass boundary: finish truth-based loading and empty-state copy before claiming premium polish is done.

## Product Claim vs Functionality Gaps

- Any claim that support/messages fully support read/unread is false. Only notifications do.
- Any claim that subscriptions are live for real users is overstated until real subscription rows exist in the shared ledger.
- Any claim that invoices/receipts are fully complete is overstated until divisions publish receipt assets consistently.
- Any claim that Care public is fully cleaned up on live is false until the calmer repo branch is deployed.
- Any claim that logistics local build health is resolved is false in this workspace until a real app tree exists again.
- Any claim that jobs employer shortlist/interview workspace is fully governed needs browser-verified proof, not just marketing copy.

## Remaining Repo-Side Low-Risk Work

- Replace remaining public loading or warmup copy with plain, trust-first loading language across Care, Learn, Jobs, Logistics, Studio, Marketplace, and Property.
- Continue tightening Care public section density after the first viewport.
- Unify money/date/phone formatting helpers instead of leaving account and hub to drift independently.
- Remove any remaining decorative or passive summary surfaces that still imply actions they cannot complete.

## Claude Flagship Work

- Run authenticated browser verification for owner, staff, account, jobs, and division workspaces with real role-scoped sessions.
- Close the support-thread unread-state gap with actual schema and backend support if the product still requires it.
- Audit Studio schema, fallback persistence, and outbound notification reliability against live truth.
- Reconcile jobs marketing, employer flow, recruiter flow, and moderation truth before broad trust claims are made.
- Decide whether to backfill or rewrite legacy care notification links in shared-ledger history after the route fix deploys.
- Finish the deeper premium polish pass on public surfaces only after truth and governance gaps are understood.

## Deploy / Env / Remote Work

- Deploy the current repo-side care/account/session fixes before making any live claims.
- Provide missing Learn admin env needed for a full local build.
- Restore or relink the real logistics app source tree before trusting local build validation.
- Apply any remote schema, storage, or receipt-publishing changes only after access is available and the exact need is confirmed.

## Exact Next-Pass Boundaries

1. Start from this ledger, not from older release claims.
2. Treat repo truth and live truth separately until browser and deploy evidence closes the gap.
3. Do not spend the next flagship pass re-cleaning local generated noise.
4. Keep the flagship scope on governed workflows, verified operator tooling, and public-claim alignment.
