# MODULES-01 — Mobile module landings + catalog audit

**Pass ID:** MODULES-01
**Phase:** Bug-fix + audit
**Pillar:** P12 (Global UX), P3 (Personalization)
**Dependencies:** Wave B.1 + close-out merged
**Effort:** S–M (1 session)
**Parallel-safe:** YES
**Owner gate:** Visual sign-off on mobile (and recommendation review for catalogue expansion)
**Risk class:** None

---

## Role

You are the V3 Modules engineer. Owner directive, verbatim:

> "Also the modules landing pages shows as not exists on mobile check if it is an error or a problem from my own account. For the modules mobile marketplace, wallet, and I think there should be more? Just asking."

**The bar:**
- (a) Marketplace + Wallet module pages MUST resolve on mobile (no "not exists" / 404 / "module unavailable").
- (b) Audit which modules are currently registered, which are exposed to the customer/account on mobile, which to the owner workspace, which to staff. Surface the catalog list for the owner with a recommendation on what's missing OR what should be promoted/demoted.
- (c) Whatever is broken, fix the root cause — no per-module patches.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `fix/mobile-module-landings` |
| Worktree | `C:/Users/HP VICTUS/HenryCo/.worktree/fix-mobile-modules` |
| Branch base | `main @ 1768a99d` |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/fix-mobile-modules"`. For git, prefer `git -C "<path>" <cmd>`. DO NOT touch the parent repo or sibling worktrees.

---

## Reference architecture (conductor-verified)

### Module registry packages

`packages/dashboard-modules-account`, `packages/dashboard-modules-building`, `packages/dashboard-modules-hotel`, `packages/dashboard-modules-marketplace` — verify the rest via `ls packages/dashboard-modules-*`. Each defines a module schema (id, label, icon, route, eligibility checks).

### Eligibility resolvers

Per the V3 conductor's earlier work + the owner-workspace layout, there are TRACKED resolvers:
- `getEligibleModules(viewer)` — Track A (customer / account-facing)
- `getEligibleOwnerModules(viewer)` — Track B (owner workspace)
- `getEligibleStaffModules(viewer)` — Track C (staff workspace)

`apps/hub/lib/owner-rail-from-registry.ts` and similar wire these into the dashboard rail.

### Account modules entry-point

`apps/account/app/(account)/modules/[...slug]/page.tsx` — catch-all module router for the customer dashboard. The "not exists" message likely lives here when the slug doesn't match a registered module.

Also direct routes:
- `apps/account/app/(account)/marketplace/page.tsx`
- `apps/account/app/(account)/jobs/page.tsx`
- `apps/account/app/(account)/learn/page.tsx`
- … (each division has its own direct route)

Possible bug vectors:

1. **Catch-all `/modules/[...slug]` doesn't know about marketplace/wallet** — slug routing isn't keyed to the dashboard-modules-* registry, and rests on a hardcoded list that's stale.
2. **`getEligibleModules(viewer)` returns a filtered list that EXCLUDES marketplace/wallet on mobile context** — possible if a mobile-context detection (user agent / viewport) is over-aggressive.
3. **No `wallet` module registered yet** — wallet might exist as a feature but never registered in the dashboard-modules-* catalog.
4. **Per-module mobile flag** — some modules might have `mobile: false` flag that hides them on the customer mobile shell.
5. **Route guard rejects** — middleware or `requireCustomer()` style auth check fails on the mobile context.

---

## Mandatory scope

### Phase 1 — Reproduce + diagnose

1. Open `apps/account/app/(account)/modules/[...slug]/page.tsx` — what does the slug router do? When does it render "not exists"?
2. List every module currently registered: read `packages/dashboard-modules-*/src/index.ts` files + any central registry (e.g., `packages/dashboard-modules-*/src/module.tsx`).
3. Run the eligibility resolver mentally for a typical customer viewer accessing `/modules/marketplace` and `/modules/wallet`. Identify whether the resolver excludes them.
4. Check whether `wallet` is even a registered module name. If not, that's part of the bug.
5. Document in `docs/v3/module-catalog-audit-2026-05-23.md`:
   - Full table: module id, division, registry package, customer-eligible?, owner-eligible?, staff-eligible?, direct-route status (where the page lives), notes
   - The reproducing slug for the user's complaint
   - The root cause of "not exists"

### Phase 2 — Fix root cause

Likely fixes (in rank of expected likelihood):

- **Slug-router blind to registry:** make the catch-all route in `apps/account/app/(account)/modules/[...slug]/page.tsx` LOOK UP the slug against the registered modules registry, NOT a hardcoded list. If the module exists in registry + viewer is eligible, render the module's component (or redirect to its direct route if one exists). Otherwise, render a clear "module not enabled for your account" with a CTA.
- **Eligibility resolver false-negative:** if a viewer flag (kyc_status, locale, role) is incorrectly disqualifying customers from marketplace/wallet, fix the resolver predicate.
- **Wallet not registered:** if wallet isn't in the catalog yet, register it. Wallet is a first-class division per the V3 plan, so it should appear in the customer catalogue + module rail.

### Phase 3 — Catalog audit + recommendation

After fixing, write a short recommendation in the PR body:

- **Currently in the customer dashboard catalog:** list all
- **Currently MISSING but should likely be there:** based on the V3 plan + existing apps (care, jobs, learn, marketplace, logistics, property, studio, wallet are clearly division-level products), list which are exposed + which aren't.
- **Suggest additions:** if any natural module is unregistered (e.g., "Documents", "Subscriptions", "Settings"), name it + propose ownership.

Owner will review the recommendation; don't auto-register new modules without explicit OK.

### Phase 4 — Verify

- Manual smoke: load `/modules/marketplace` and `/modules/wallet` on customer dashboard (mobile + desktop). Confirm landing renders or redirects appropriately.
- Typecheck + lint + V3-07 strict `pnpm i18n:check:strict` PASS.

### Phase 5 — DRAFT PR

Commit per logical chunk:
- `MODULES-01(P1): module catalog audit + slug-router diagnostic`
- `MODULES-01(P2): fix slug router to honor module registry`
- `MODULES-01(P3): register wallet module (if missing)`

Push + open DRAFT PR. Body lists fixed slugs + the catalog table + recommendation for missing modules.

Report at `.codex-temp/fix-mobile-module-landings/report.md`.

---

## Anti-patterns (HARD stops)

- **NO hardcoded module slug lists.** The router must read from the registry.
- **NO per-module patches.** Find the class-level bug.
- **NO new modules registered without owner OK.** Author the recommendation; let the owner authorize each.
- **NO touching `packages/search-ui/`** (owner-reserved).
- **NO touching `apps/account/lib/cloudinary.ts`** destructively.
- **NO breaking V3-07 strict gate.**
- **NO `git push --force`** (use `--force-with-lease` if needed).
- **NO PR auto-merge.**

---

## Self-verification checklist

- [ ] `docs/v3/module-catalog-audit-2026-05-23.md` with full module × eligibility table
- [ ] Marketplace + Wallet load correctly on mobile customer dashboard
- [ ] Slug router reads from registry, not hardcoded list
- [ ] Wallet registered (if previously missing) with owner-OK note
- [ ] Catalog expansion recommendations surfaced in PR body
- [ ] Typecheck + lint + i18n:check:strict PASS
- [ ] DRAFT PR opened

You're Opus 4.7. Owner asked "if it's an error or a problem from my own account" — diagnose first, fix the root, then surface the catalogue so the owner can decide what else should exist.
