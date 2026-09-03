# FIX-LT-01 — Foundation UX: Kill residual loading theater (property + account + care)

> **STATUS: SHIPPED — PR #140.** The property managed-portfolio "warming lane" was deleted (3 keys × 12 locales removed from `apps/property/lib/public-copy.ts`; the consuming JSX cleaned), care's `CareLoadingStage` defaults were de-theatered and `TrackLookupClient` "Loading"/"Preparing" verbs rephrased to plain language, and the account + marketplace-account `loading.tsx` files were moved to `StructuredSkeleton`. This file is the elevated canonical record of that cleanup plus a standing residual-scan contract; treat "Mandatory scope" as the verification/extension contract, not unbuilt work.

**Pass ID:** FIX-LT-01  ·  **Phase:** B (Foundation Lock — V3-05 follow-up)  ·  **Pillar:** P12 (Global UX)
**Dependencies:** V3-05 (kill-loading-theater, merged) — `StructuredSkeleton` primitive available in `@henryco/ui/loading`  ·  **Effort:** S  ·  **Parallel-safe:** Y
**Owner gate:** none (visual sign-off on live URLs before merge)  ·  **Risk class:** —

---

## Role
You are the V3 Foundation-UX cleanup engineer for Henry Onyx. You execute exactly this one pass, then stop and report. V3-05 was meant to kill loading theater everywhere but shipped incomplete on property, account, and care; this pass finishes the three named surfaces to the V3-05 bar: real content on first paint, OR `StructuredSkeleton` from `@henryco/ui/loading` during a genuine in-flight query — never warmup copy. The line you must not cross: do not replace one theater with another ("Welcome to X", "Get ready"), do not touch apps the owner did not name, do not keep dead warming-lane translations because they exist.

Owner directive, verbatim (the bar):
> "KILL THE LOADING STATE HAVENT DEPLOYED ON PROPERTIES, ACCOUNT, AND CARE"

After this pass, the rendered HTML of the property, account, and care surfaces contains ZERO non-test occurrences of `Loading X`, `Preparing X`, `Warming up`, `Just a moment`, `One moment please`.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/fix-loading-theater` (per pass) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
V3-05 shipped `StructuredSkeleton` in `@henryco/ui/loading` and the inventory scanner `scripts/v3/loading-theater-inventory.mjs`, then swept most public surfaces — but left residual theater on three. The worst was structural: `apps/property/lib/public-copy.ts` held a managed-portfolio "warming lane" — `managedPortfolioWarmingHint`, `warmingEyebrow`, `warmingBody`, each across 12 locales (en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha) — UI that pretended the managed-property service was "warming up" while empty. That is exactly the anti-pattern V3-05 forbids ("no empty dashboards pretending to be active systems"). Care carried `CareLoadingStage` warmup defaults plus `TrackLookupClient.tsx` "Loading the service timeline" / "Preparing the next verified handoff" verbs. Account carried warmup `loading.tsx` copy under `(account)/learn` and the marketplace-owned `app/account` subpath.

This pass closed it: the property warming lane is deleted (the keys no longer exist in `public-copy.ts`), care's `CareLoadingStage` defaults are plain-language and the `TrackLookupClient` verbs are rephrased (annotated in-file as `FIX-LT-01`), and the account / marketplace-account `loading.tsx` files render `StructuredSkeleton`. The standing contract this file encodes: the three surfaces stay theater-free, enforced by the V3-05 scanner.

## Mandatory scope

### S1 — Inventory + classification
Run the V3-05 scanner against the three apps: `node scripts/v3/loading-theater-inventory.mjs --app=property --app=care --app=account` (if `--app` filtering is unsupported, run full + filter the JSON). Classify each hit per V3-05 spec: Class A (real in-flight — keep but rephrase the verb, Loading→Fetching / Preparing→Confirming, OR replace with a skeleton); Class B (fake/decorative — DELETE); Class C (mis-coded empty/error state — fix the classification). Output `docs/v3/loading-theater-property-account-care-inventory.md` with per-file classification + chosen fix.

### S2 — Property cleanup (the structural fix)
For the managed-portfolio "warming lane" in `apps/property/lib/public-copy.ts`: delete it entirely (preferred) — remove the 3 keys × 12 locales = 36 entries, the consuming JSX, and the type declarations; when the managed-property catalog is empty, render NOTHING for it (the catalog appears when the work does). Fallback only if the lane is load-bearing for navigation: remove the 36 entries and wrap the lane in `<StructuredSkeleton variant="card-list" />` from `@henryco/ui/loading` (skeleton renders, no warmup text). Document the choice in the PR body. Also: `apps/property/app/account/loading.tsx` and any other property `loading.tsx` → replace warmup `subtitle`/`description`/`title` with `<StructuredSkeleton />`. Sweep remaining `Loading`/`Preparing` hits in `apps/property/`.

### S3 — Care cleanup
`apps/care/components/ui/CareLoading.tsx` (`CareLoadingStage`) — its warmup defaults are the "Loading X" rotation V3-05 forbids; make the defaults plain-language and route real in-flight states to `<StructuredSkeleton />` where appropriate. `apps/care/components/care/TrackLookupClient.tsx` — the user's track-order experience: rephrase "Loading the service timeline" / "Preparing the next verified handoff" to plain V3-05 verbs ("Fetching…" / "Confirming…") or delete if the surrounding bullets already convey activity. Inspect surrounding code to pick; annotate the changed lines `FIX-LT-01`. Sweep remaining hits in `apps/care/`.

### S4 — Account cleanup
`apps/account/app/(account)/learn/loading.tsx` and every sibling `apps/account/app/**/loading.tsx` → replace warmup text with `<StructuredSkeleton />` (variant matching the surface). `apps/marketplace/app/account/loading.tsx` (marketplace owns this account subpath) → `<StructuredSkeleton variant="detail" />`. Sweep remaining `Loading X` hits in `apps/account/`.

### S5 — Standing residual-scan contract
Encode that the V3-05 scanner's Class B count for property + care + account stays at ZERO going forward; this is the regression line V3-94's closure pass re-runs.

## Out of scope
- Apps the owner did not name (hub, studio, jobs, logistics, hotel, building) unless the scanner explicitly flags an identical Class-B hit AND the fix is a small mechanical skeleton swap.
- Rebuilding `StructuredSkeleton` or the scanner → V3-05 owns them.
- `packages/search-ui/**` → owner-reserved.

## Dependencies
Depends on V3-05 (the `StructuredSkeleton` primitive + the inventory scanner). Blocks nothing; it is the V3-05 completion follow-up on the three surfaces V3-05 missed.

## Inheritance
Builds on V3-05: `StructuredSkeleton` (variants `card-list` / `detail` / `metric`) in `@henryco/ui/loading`, and `scripts/v3/loading-theater-inventory.mjs`. Uses the existing `@henryco/i18n` surfaces in property/care/account.

## Implementation requirements
### Files
- `apps/property/lib/public-copy.ts` (warming-lane keys removed) + the consuming JSX + `apps/property/app/account/loading.tsx`.
- `apps/care/components/ui/CareLoading.tsx` + `apps/care/components/care/TrackLookupClient.tsx`.
- `apps/account/app/(account)/learn/loading.tsx` + sibling `apps/account/app/**/loading.tsx` + `apps/marketplace/app/account/loading.tsx`.
- `docs/v3/loading-theater-property-account-care-inventory.md` (new).

### Trust / safety / compliance
None — presentation-only. No auth/RLS/money/identity surface touched. No payment-surface behaviour change. When removing i18n keys, confirm no consumer references them so the `i18n:check` gate stays green.

### Mobile + desktop parity
`StructuredSkeleton` is responsive by design; verify the replaced surfaces render correctly on mobile + desktop with CLS ≈ 0 (the skeleton must match the real content's dimensions so first paint doesn't shift).

### i18n
Removing the warming-lane keys reduces the property surface namespace; no new strings added. Any retained plain-language verb routes through `@henryco/i18n` (Pattern A typed copy or Pattern B `translateSurfaceLabel`) in the existing `surface:property` / `surface:care` / `surface:account` namespaces. `pnpm i18n:check:strict` (the V3-07 gate) must stay green with no new GAPs and no orphaned keys.

### Brand & design system
Skeletons use locked design-system tokens only (no ad-hoc hex), light + dark. Any brand label sourced from `@henryco/config` (divisions = "Henry Onyx <Division>"; never "Henry & Co."). Live-verification curls MUST target URLs built from `henryDomain('care')` / `henryDomain('property')` / `getAccountUrl()` (`@henryco/config`) — never the literal base domain hardcoded in code or scripts.

## Validation gates
1. `pnpm -F @henryco/property typecheck` + `pnpm -F @henryco/care typecheck` + `pnpm -F @henryco/account typecheck` + `pnpm -F @henryco/marketplace typecheck` PASS.
2. `pnpm lint` PASS for touched packages.
3. `pnpm i18n:check:strict` PASS — no new GAPs, no orphaned keys from removed warming lane.
4. `node scripts/v3/loading-theater-inventory.mjs` re-run: Class B count for property + care + account = 0.
5. Live verification: the rendered HTML for the care, property, and account surfaces (URLs resolved via `henryDomain()` / `getAccountUrl()`) contains no `Loading X` / `Preparing X` / `Warming up` / `Just a moment` in non-test, non-doc-comment positions.
6. Replaced skeletons render light + dark, mobile + desktop, CLS ≈ 0.

## Deployment gate
All gates green; owner visually signs off on the live URLs (post Vercel rebuild); squash-merge to `main`. No auto-merge before the visual sign-off.

## Final report contract
`.codex-temp/fix-loading-theater-property-account-care/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env [N/A] · validation evidence · smoke · live verification · telemetry baseline [N/A] · deferred items · pass-closure assertion).

## Self-verification
- [ ] S1: `docs/v3/loading-theater-property-account-care-inventory.md` with per-file classification + chosen fix.
- [ ] S2: property warming-lane keys (3 × 12 locales) removed and consuming JSX cleaned; property `loading.tsx` files use `StructuredSkeleton`.
- [ ] S3: care `CareLoadingStage` de-theatered; `TrackLookupClient` verbs rephrased or deleted (annotated `FIX-LT-01`).
- [ ] S4: account `learn/loading.tsx` + siblings and `marketplace/app/account/loading.tsx` use `StructuredSkeleton`.
- [ ] S5: scanner Class B = 0 for property + care + account.
- [ ] No theater-for-theater swap; no un-named apps touched; no orphaned i18n keys.
- [ ] Typecheck + lint + `i18n:check:strict` PASS; CLS ≈ 0; live URLs resolved via `henryDomain()` (no hardcoded domain).
- [ ] PR opened with before/after for the three surfaces + the V3-05 spec link, requesting live visual sign-off.
