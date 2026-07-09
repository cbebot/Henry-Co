# Decision record — the dashboard and the division workspaces

**Date:** 2026-07-09 · **Question (team argument):** should vendor/seller
workspaces move into the account dashboard as modules — and if not, how does
the dashboard "do its purpose" so users actually visit it?

## The decision

**Workspaces stay in the divisions. The dashboard gets first-class operator
WINDOWS into them.** The rule, stated once:

> **The dashboard is the RECORD. The division workspace is the TOOL.**
> A module is a *window* — live standing + the one exact next step — never a
> re-implementation of the room it looks into.

## Why moving workspaces in is the wrong move

1. **The tools need their division's context.** Marketplace `/vendor` is seven
   sub-surfaces (products, orders, payouts, store, disputes, analytics,
   onboarding) riding marketplace's catalog, RLS scopes, staff roles, and
   deploy cadence. Rebuilding that inside `apps/account` duplicates
   money-adjacent flows (payouts — behavior-locked), doubles the audit
   surface, and couples every division team to one app's release train.
2. **It's how the reference ecosystems do it.** Google Account doesn't embed
   YouTube Studio; Shopify's admin isn't the Shop app; App Store Connect isn't
   Apple ID. One identity, one record, many tools — linked with context.
3. **Our own architecture already voted.** The DASH-2 module contract says it
   explicitly: `homeHref` — *"when a module's real, primary surface already
   lives at a top-level route… open the actual surface in one tap"* — and
   `nextStep` — *"the exact next step, not more text."* The registry was built
   for windows. The PASS-22 comments in the marketplace module ("no
   `/marketplace/vendor` page exists in the account shell yet") are this exact
   argument, frozen mid-sentence.

## Why "users will never visit the dashboard" is still a real problem

The concern is correct — and the cause is precise: **the dashboard's windows
today are customer-only.** A vendor sees their *buying* life (orders, saved
items) but their *selling* life — the thing they'd check every morning — has
no window (the seller card existed but was buried at weight 70 and the module
wrapper linked back to the account-side summary). A jobs **employer has no
window at all.** People visit the surface that answers "what needs me?"; for
operators, ours didn't answer.

So the fix is not relocation — it's **completing the window set**:

- Every operator standing gets a home widget: live standing, real data, and
  the exact next step **deep-linked to the real workspace** (cross-domain).
- Operator windows rank **above** customer windows for operators (a seller's
  morning question is "any orders to fulfil?", not "what did I buy?").
- Detection rides the same rails as everything else: `*_role_memberships`
  via the shared grant predicate (vendor), `customer_activity` employer
  memberships (jobs) — never a parallel role system. The Aware Layer
  (`@henryco/aware`, PR #456) supplies the standing lattice and labels so the
  dashboard and the division chrome can never disagree about who someone is.

## What this makes the dashboard (its purpose, settled)

1. **The record** — identity, wallet, notifications, activity, support,
   invoices: things that belong to the PERSON, not to a division.
2. **The morning brief** — every division's window ranked by "what needs me",
   customer and operator lanes both.
3. **The router** — one tap from any window into the right room.

Divisions remain the rooms. Nothing is duplicated; nothing is orphaned.

## Executed in this pass (SP2)

- **Jobs employer window (new):** `dashboard-modules-jobs` detects employer
  memberships (same `customer_activity` read the jobs app uses) and surfaces
  a "Hiring operations" widget (weight 84 — above the candidate widgets) +
  palette entry, deep-linking to `jobs.henryonyx.com/employer`.
- **Marketplace vendor window (completed):** the seller-status widget's
  card-tap now lands on the REAL vendor workspace (it previously bounced to
  the account-side summary), its weight rises 70 → 84 for vendors, and the
  vendor palette entry ("Manage store") points at the workspace.

## Follow-ups (tracked)

Studio client/team, learn instructor, care staff, logistics ops, property
agent windows — same pattern as division PRs land. Counts-on-cards ("3 orders
to fulfil") once each division's cheap-count query is verified against prod.
