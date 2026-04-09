# Release Status — Pre-Claude Handoff

**Date**: 2026-04-09
**Purpose**: Freeze the verified repo state after the targeted correction pass and before the flagship Claude pass.

## Source Of Truth

- Active blocker ledger: `docs/PRODUCT-GAP-LEDGER.md`
- Support-system truth addendum: `docs/support-platform-audit.md`
- This file is a handoff snapshot, not a marketing status page.

## Git Truth

- `origin/main` fetched on 2026-04-09 is still `00586cc fix(care): persist shared account linkage on bookings`.
- The targeted account/care/session correction work is local repo work until deployed.
- The repo has been cleaned so generated logs and stray local app artifacts do not pollute the flagship handoff.

## What Is Actually Stable Repo-Side

- Account notification read-state now uses real `customer_notifications` persistence.
- Account summary cards for care, subscriptions, invoices, activity, marketplace, learn, and logistics are more actionable and less misleading.
- Care account flows now have dedicated booking detail routes.
- Shared cookie-domain auth continuity is aligned repo-side across account, learn, logistics, and hub owner auth.
- Care public repo copy is calmer than the earlier noisy version, but it is not yet the final flagship pass.

## What Is Not Yet Safe To Claim

- Do not claim full support-thread unread/read behavior.
- Do not claim live subscription sync.
- Do not claim receipt/download completeness.
- Do not claim live Care public cleanup.
- Do not claim resolved logistics local build health in this workspace.
- Do not claim fully governed shortlist/interview workspace behavior for Jobs without browser-verified proof.

## Public Truth Snapshot

- Care live site: reachable, still shows first-render loading copy, and still appears older than the calmer repo branch.
- Learn live site: reachable, still exposes learning-loading copy on first render.
- Jobs live site: reachable, still sells shortlist/interview workspace confidence harder than current governed proof.
- Logistics live site: reachable, but local repo build truth remains incomplete.
- Property live site: reachable, still exposes a loading-first response.
- Studio live site: reachable, still exposes loading/preparing workspace copy.
- Marketplace live site: reachable, still exposes first-render loading/preparing copy.

## Next-Pass Boundaries

### Already Completed Repo-Side

- Account dashboard actionability corrections.
- Care deep-link and booking detail corrections.
- Session continuity repo alignment.
- Initial Care public calming pass.

### Remaining Repo-Side But Low-Risk

- Copy-only cleanup for loading states and lingering wishful empty-state language.
- Shared formatting helper convergence.
- Additional passive-card removal where backend support already exists.

### Claude Flagship Work

- Browser-verified operator and customer workflows.
- Studio truth audit and schema convergence.
- Jobs workflow governance and claim alignment.
- Support-thread unread-state architecture if still required.

### Deploy / Env / Remote Work

- Actual deployment of repo-side fixes.
- Learn env completion.
- Logistics source-tree restoration or relink.
- Remote schema or ledger backfill work.
