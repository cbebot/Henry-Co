# MODULES-01 — Foundation UX: Mobile module landings + catalog truth

> **STATUS: SHIPPED — PR #144.** Wallet is a registered first-class module (`@henryco/dashboard-modules-wallet`), the catch-all `/modules/[...slug]` router resolves slugs against the live registry (not a hardcoded list), and the Track A customer gates were widened from `viewer.kind === "customer"` to `viewerCanUseCustomerSurface(viewer)` so owners/staff using the customer surface no longer hit "not exists". This file is the elevated canonical record of that fix plus the catalog-truth contract; treat "Mandatory scope" as the verification/extension contract, not unbuilt work.

**Pass ID:** MODULES-01  ·  **Phase:** B (Foundation Lock — regression follow-up)  ·  **Pillar:** P12 (Global UX), P3 (Personalization)
**Dependencies:** dashboard-shell module registry + role-gate (merged)  ·  **Effort:** S  ·  **Parallel-safe:** Y
**Owner gate:** none (visual sign-off on mobile + recommendation review for any catalog expansion)  ·  **Risk class:** —

---

## Role
You are the V3 Foundation-UX modules engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass guarantees every registered module resolves on mobile for an eligible viewer, that the catch-all module router reads the live registry rather than any static list, and that the customer-surface catalog is truthful (no module silently absent, no module the viewer can't actually use shown as available). The line you must not cross: never register a new module without explicit owner sign-off — you surface the recommendation; the owner authorizes each addition.

Owner directive, verbatim (the bar):
> "Also the modules landing pages shows as not exists on mobile check if it is an error or a problem from my own account. For the modules mobile marketplace, wallet, and I think there should be more? Just asking."

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/fix-mobile-module-landings` (per pass) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Modules are defined in per-division packages (`@henryco/dashboard-modules-account`, `-marketplace`, `-wallet`, `-building`, `-hotel`, plus `-owner` / `-staff` for the operator surfaces). Each exports a `DashboardModule` (`slug`, `title`, `description`, `icon`, `railSlot`, `getEligibleViewer(viewer)`, `getRoleGate(viewer): RoleDecision | null`, `getHomeWidgets(viewer)`). Modules register as an import side effect: `apps/account/app/(account)/_modules/index.ts` imports each package, which calls `registerModule()` against the shell registry (idempotent on slug). The customer catch-all `apps/account/app/(account)/modules/[...slug]/page.tsx` imports `_modules` once, then `getRegisteredModules().find(m => m.slug === moduleSlug)` and `targetModule.getRoleGate(viewer)` — `notFound()` (the "not exists" surface) fires when the slug is unregistered OR the gate denies.

The "not exists on mobile" symptom had two real causes, both closed here: (1) `wallet` had no registered module package — it existed only as top-level `/wallet` routes, so `/modules/wallet` `notFound()`'d; (2) Track A customer gates keyed on `viewer.kind === "customer"`, so an owner/staff account browsing the customer surface failed the gate on otherwise-universal modules. The fix added `@henryco/dashboard-modules-wallet` (registered in `_modules/index.ts`) and widened the gate to `viewerCanUseCustomerSurface(viewer)` (defined in `packages/dashboard-shell/src/role-gate.ts`); the wallet *data* layer keeps `kind === "customer"` because the `customer_wallet_*` tables are customer-scoped. The router was confirmed registry-driven, never a hardcoded slug list.

## Mandatory scope

### S1 — Reproduce + diagnose against the live registry
Read `apps/account/app/(account)/modules/[...slug]/page.tsx`: confirm it resolves the slug via `getRegisteredModules()` and gates via `getRoleGate(viewer)`, and pinpoint exactly when `notFound()` renders. Enumerate every registered module by reading each `packages/dashboard-modules-*/src/module.tsx` (slug, title, `getEligibleViewer`, `getRoleGate`). Run the gate mentally for a typical customer viewer AND an owner/staff-on-customer-surface viewer requesting `/modules/marketplace` and `/modules/wallet`; identify any false-negative. Verify `wallet` is registered in `apps/account/app/(account)/_modules/index.ts`.

### S2 — Catalog-truth document
Write `docs/v3/module-catalog-audit.md`: a full table of module id · division · registry package · customer-eligible? · owner-eligible? · staff-eligible? · direct-route status (where the canonical detail page lives) · notes. Include the reproducing slug for the complaint and the root cause of "not exists". This is the durable catalog-truth artifact the owner reviews.

### S3 — Registry-driven router + widened gate (the fix)
- Confirm the catch-all router looks the slug up against the registry and never a static list; if any static list remains, replace it with the registry lookup.
- Confirm Track A customer gates use `viewerCanUseCustomerSurface(viewer)` (not `viewer.kind === "customer"`) for modules every human can use; keep stricter gates where a module is genuinely customer-only, and keep customer-scoped data-layer gates (`kind === "customer"`) intact.
- For a registered-but-ineligible viewer, the surface must read as a clear "module not enabled for your account" with a next-step CTA — never a raw 404 dead end where eligibility is the real story.

### S4 — Catalog expansion recommendation (owner-authorized only)
In the PR body, list: modules currently in the customer catalog; division-level products that exist but are not yet customer modules (care, jobs, learn, logistics, property, studio surfaces); and any natural module candidate (e.g. Documents, Subscriptions). Propose ownership per candidate. Register NOTHING new without explicit owner OK — `building` / `hotel` stay gated behind their `MODULE_ENABLED` constants until the owner flips them.

## Out of scope
- Registering new division modules → owner-authorized, future per-division passes own each.
- Operator-surface module catalog depth (owner/staff workspaces) → `@henryco/dashboard-modules-owner` / `-staff` future work.
- `packages/search-ui/**` → owner-reserved.
- Destructive edits to `apps/account/lib/cloudinary.ts` → forbidden.

## Dependencies
Depends on the dashboard-shell module registry + `role-gate.ts`. Blocks nothing; it stabilizes the module-resolution contract that every later module-adding pass relies on.

## Inheritance
Builds on `@henryco/dashboard-shell` (`getRegisteredModules`, `registerModule`, `viewerCanUseCustomerSurface`, `DashboardModule`/`RoleDecision` types, `WorkspaceSlot`/`DivisionLanding`/`HeroCard`/`EmptyStateCard` surfaces) and `@henryco/dashboard-modules-*` package modules. Uses `buildUnifiedViewer` from `@henryco/auth/server`.

## Implementation requirements
### Files
- `apps/account/app/(account)/modules/[...slug]/page.tsx` (verify registry-driven; no static list).
- `apps/account/app/(account)/_modules/index.ts` (wallet registered).
- `packages/dashboard-modules-wallet/src/module.tsx` + `data.ts` + `widgets/` (the registered module; data-layer gate intact).
- `packages/dashboard-shell/src/role-gate.ts` (`viewerCanUseCustomerSurface`).
- `docs/v3/module-catalog-audit.md` (new — the catalog-truth table).

### Trust / safety / compliance
Gate widening must NOT widen *data* access: surface eligibility (`getRoleGate`) may broaden to `viewerCanUseCustomerSurface`, but every module's data loader keeps its scoped predicate so RLS-backed customer tables are never read for the wrong principal. Confirm `customer_wallet_*` reads stay `kind === "customer"`. No new mutating route; no payment-surface behaviour change.

### Mobile + desktop parity
The defect was mobile-only in report but the cause is viewer-gate/registry logic, identical on both. Verify `/modules/marketplace` and `/modules/wallet` render (or redirect to canonical detail) on customer dashboard mobile + desktop. Expo super-app consumes the same registry contract — parity preserved.

### i18n
All module landing copy routes through `@henryco/i18n` via `translateSurfaceLabel(locale, …)` (Pattern B) as the router already does; the catalog labels (`module.title` / `module.description`) flow through the same surface namespace. No raw strings; `pnpm i18n:check:strict` stays green.

### Brand & design system
Module landings render inside the dashboard-shell design system (locked tokens, no ad-hoc hex). Any division/brand label is sourced from `@henryco/config` (`COMPANY` divisions = "Henry Onyx <Division>"), never hardcoded "Henry & Co.". Any URL uses `henryDomain()` / `getAccountUrl()` from `@henryco/config`.

## Validation gates
1. `pnpm -F @henryco/account typecheck` + `pnpm -F @henryco/dashboard-shell typecheck` + `pnpm -F @henryco/dashboard-modules-wallet typecheck` PASS.
2. `pnpm lint` PASS for touched packages.
3. `pnpm i18n:check:strict` PASS.
4. Smoke: `/modules/marketplace` and `/modules/wallet` resolve for a customer viewer AND an owner/staff-on-customer-surface viewer (mobile + desktop); an ineligible viewer sees the clear not-enabled CTA, never a bare 404.
5. RLS check: wallet data loader reads only customer-scoped rows; no cross-principal leakage when the surface gate is widened.

## Deployment gate
All gates green; owner reviews `docs/v3/module-catalog-audit.md` + the expansion recommendation; squash-merge to `main`; Vercel autodeploys. No new module registered without owner sign-off.

## Final report contract
`.codex-temp/fix-mobile-module-landings/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] S1: router confirmed registry-driven; `notFound()` trigger and the reproducing slug documented.
- [ ] S2: `docs/v3/module-catalog-audit.md` has the full module × eligibility × direct-route table.
- [ ] S3: marketplace + wallet resolve on mobile for customer + owner/staff-on-customer-surface viewers; registered-but-ineligible shows a clear CTA, not a 404.
- [ ] Wallet registered in `_modules/index.ts`; surface gate `viewerCanUseCustomerSurface`, data gate `kind === "customer"` intact.
- [ ] S4: catalog-expansion recommendation in PR body; zero new modules registered without owner OK.
- [ ] Typecheck + lint + `i18n:check:strict` PASS; no brand/domain hardcoding; RLS not widened.
- [ ] PR opened with the catalog table + recommendation.
