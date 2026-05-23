# FIX-LOADING-THEATER — Property + Account + Care residual theater cleanup

**Pass ID:** FIX-LT-01
**Phase:** V3-05 follow-up
**Pillar:** P12 (Global)
**Dependencies:** V3-05 merged (0c33ffa2 on main); StructuredSkeleton primitive available in `@henryco/ui/loading`
**Effort:** S (1 session)
**Parallel-safe:** YES
**Owner gate:** Visual sign-off on live URLs before merge
**Risk class:** None

---

## Role

You are the V3-05 follow-up engineer. Owner directive, verbatim:

> "KILL THE LOADING STATE HAVENT DEPLOYED ON PROPERTIES, ACCOUNT, AND CARE"

V3-05 was supposed to kill the loading theater everywhere but **shipped incomplete on property, account, and care**. The conductor verified residual theater on live prod (`care.henrycogroup.com`, `property.henrycogroup.com`) — "Loading" and "warming up" copy still rendering.

**The bar:** after this pass, `curl https://{care,property,account}.henrycogroup.com/*` returns ZERO matches for: `Loading X`, `Preparing X`, `Warming up`, `Just a moment`, `One moment please`. Real content renders on first paint, OR `StructuredSkeleton` from `@henryco/ui/loading` renders during genuine in-flight queries.

This is a **focused S-effort cleanup**, not a full pass. One session, ship it, open DRAFT PR.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `fix/loading-theater-property-account-care` |
| Worktree (absolute) | `C:/Users/HP VICTUS/HenryCo/.worktree/loading-theater-fixup` |
| Branch base | `main @ 0c33ffa2` (Wave B.1 + V3-05 + theme/owner-staff still in flight on PR #137) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

Use ABSOLUTE PATHS. For Bash, first call `cd "C:/Users/HP VICTUS/HenryCo/.worktree/loading-theater-fixup"`. For git, prefer `git -C "..." <cmd>`. DO NOT touch the parent repo or sibling worktrees.

---

## Conductor-verified inventory (the work to do)

### Property (worst — STRUCTURAL theater)

`apps/property/lib/public-copy.ts` contains a **`warming` i18n contract repeated across 12 locales**:
- `managedPortfolioWarmingHint` (12 locale strings: en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha)
- `warmingEyebrow` + `warmingBody` (same 12 locales)

The en-US source:
- `managedPortfolioWarmingHint: "Managed-property layer warming up"` (line 274)
- `warmingEyebrow: "Managed lane warming up"` (line 304)
- `warmingBody: "The managed-property service set publishes once at least one managed engagement is live. Operating standards stay the same; the catalog appears when the work does."` (line 305)

This is a structural managed-portfolio "warming lane" — UI that displays when the managed-property service hasn't launched yet. **It is THE anti-pattern V3-05 was supposed to kill.** Decide:

- **Option A (preferred):** delete the warming lane entirely. If the managed-property catalog is empty, render NOTHING for it (no decorative placeholder; the catalog appears when it appears). Remove the i18n keys + the consuming component(s). Owner's bar: "no empty dashboards pretending to be active systems."
- **Option B (fallback):** if the warming lane is load-bearing for navigation, replace the warmup copy with a STRUCTURED skeleton from `@henryco/ui/loading` + remove the i18n keys. The skeleton-with-no-data renders, but no warmup text.

Pick Option A unless removal would break a navigation contract. Document the choice in the PR body.

Other property residuals:
- `apps/property/app/account/loading.tsx:10` — `subtitle="Loading your saved listings, viewings, and inquiries."` → replace with `<StructuredSkeleton variant="card-list" />` from `@henryco/ui/loading` (V3-05 shipped this primitive)
- Any other "Loading" / "Preparing" hits in `apps/property/` — grep + fix

### Care

- `apps/care/components/ui/CareLoading.tsx:135` — `t("Loading your bookings")` (and likely sibling entries; check the surrounding array)
- `apps/care/components/care/TrackLookupClient.tsx:396` — `t("Loading the service timeline")`
- `apps/care/components/care/TrackLookupClient.tsx:397` — `t("Preparing the next verified handoff")`

`TrackLookupClient` — the user's track-order experience. V3-05's agent acknowledged it had "Loading"/"Preparing" verbs and partially rephrased some lines; this pair was missed. Two paths:

- **Option A:** if these are TRUE in-flight states during a real query, rephrase the verbs to match the V3-05 precedent: "Loading the service timeline" → "Fetching the service timeline" or just delete (the surrounding bullets already convey activity). Same for "Preparing the next verified handoff" → "Confirming the next verified handoff" or delete.
- **Option B:** if they're fake first-paint placeholders, delete them entirely + render the real timeline data immediately.

Inspect the surrounding code to pick. Document in PR body.

`CareLoading.tsx:135` — this is a wrapper for skeleton states. Each "Loading X" string is one of a rotation. Replace with `<StructuredSkeleton />` from `@henryco/ui/loading` (variant matching the surface) and remove the rotation entirely. The Loading-with-noun pattern is exactly what V3-05 forbids.

### Account

- `apps/account/app/(account)/learn/loading.tsx:7` — `description="Loading your courses, progress signals, and certificates."` → replace with `<StructuredSkeleton variant="card-list" />`
- `apps/marketplace/app/account/loading.tsx:6` — `title="Loading your account"` → replace with `<StructuredSkeleton variant="detail" />` (marketplace owns this account subpath)
- Any other `apps/account/` "Loading X" hits — grep + fix
- The account app may have nested loading.tsx files; sweep all `apps/account/app/**/loading.tsx`

---

## Mandatory scope

### Phase 1 — Inventory + classification

Run the V3-05 scanner against the 3 apps:
`node scripts/v3/loading-theater-inventory.mjs --app=property --app=care --app=account`

(If the scanner doesn't support `--app` filtering, run the full scan and filter the JSON output.)

For each hit, classify (per V3-05 spec):
- **Class A (real in-flight)** — keep but rephrase verb (Loading → Fetching, Preparing → Confirming) OR replace with skeleton
- **Class B (fake/decorative)** — DELETE
- **Class C (mis-coded empty/error state)** — fix the state classification

Output: `docs/v3/loading-theater-property-account-care-inventory.md` with per-file classification + chosen fix.

### Phase 2 — Property cleanup

For the **structural "warming" lane in `lib/public-copy.ts`**:
- If Option A (delete entirely): remove the 3 keys × 12 locales = 36 entries, remove the consuming JSX (the lane component), remove the type declarations. Verify type-check passes.
- If Option B (skeleton): remove the 36 i18n entries, remove the consuming text-rendering, wrap the lane in `<StructuredSkeleton variant="card-list" />` from `@henryco/ui/loading`. Type-check passes.

For `apps/property/app/account/loading.tsx` and any other property loading.tsx: replace warmup `subtitle`/`description`/`title` with `<StructuredSkeleton />`. Don't keep theater wrappers.

### Phase 3 — Care cleanup

- `CareLoading.tsx` rotation: delete. Replace with `<StructuredSkeleton />` from `@henryco/ui/loading`.
- `TrackLookupClient.tsx:396-397`: either rephrase verbs per V3-05 precedent or remove. Owner-bar judgment — the bullets must communicate REAL activity, not theater.
- Any other "Loading"/"Preparing" hits in `apps/care/` per the scanner output.

### Phase 4 — Account cleanup

- `apps/account/app/(account)/learn/loading.tsx` and any sibling `loading.tsx` files: replace warmup text with `<StructuredSkeleton />`.
- `apps/marketplace/app/account/loading.tsx`: replace warmup text with `<StructuredSkeleton variant="detail" />` (V3-05 shipped this variant).

### Phase 5 — Verification

After all fixes, the V3-05 strict gate must still pass:
- `pnpm i18n:check:strict` (V3-07 gate) — no new GAPs since the baseline
- V3-05 inventory script reruns and Class B count for these 3 apps drops to ZERO
- `curl https://care.henrycogroup.com/` and `curl https://property.henrycogroup.com/` HTML response does NOT contain `Loading`, `Preparing`, `Warming up`, `Just a moment` (in non-test, non-doc-comment positions)

### Phase 6 — DRAFT PR

Commit per logical chunk:
- `FIX-LT-01(P1): inventory + classification for property/care/account`
- `FIX-LT-01(P2): kill property managed-portfolio warming lane + loading.tsx skeletons`
- `FIX-LT-01(P3): care CareLoading rotation + TrackLookupClient verb rephrase`
- `FIX-LT-01(P4): account + marketplace/account loading.tsx skeleton replacement`

Push branch + open DRAFT PR via:
`gh pr create --draft --base main --head fix/loading-theater-property-account-care --title "FIX-LT-01: kill residual loading theater on property + account + care" --body "..."` — body lists before/after for the 3 named surfaces, links the V3-05 spec, requests owner visual sign-off on live URLs after merge + Vercel rebuild.

Report at `.codex-temp/fix-loading-theater-property-account-care/report.md`.

---

## Anti-patterns (HARD stops)

- NO replacing "Loading X" with another natural-language placeholder ("Welcome to X", "Get ready"). Either real content OR `<StructuredSkeleton />`.
- NO keeping warming-lane translations across 12 locales just because they exist. Delete them all if the lane is deleted.
- NO touching `packages/search-ui/` (owner-reserved).
- NO touching apps outside property/account/care/marketplace-account-subpath unless the scanner explicitly says they have the same problem AND it's a small mechanical fix.
- NO breaking the V3-07 strict `i18n:check` gate. If you remove i18n keys, make sure no consumer references them.
- NO `git push --force` (use --force-with-lease only if necessary; this is a fresh branch so plain push should work).
- NO PR auto-merge.

---

## Self-verification checklist

- [ ] `docs/v3/loading-theater-property-account-care-inventory.md` written with classification + chosen fix per item
- [ ] Property: `warming` i18n keys × 12 locales removed (or migrated to skeleton); consuming JSX cleaned
- [ ] Property: `app/account/loading.tsx` uses `<StructuredSkeleton />`
- [ ] Care: `CareLoading.tsx` rotation deleted, replaced with `<StructuredSkeleton />`
- [ ] Care: `TrackLookupClient.tsx:396-397` cleaned (rephrase or delete)
- [ ] Account: `app/(account)/learn/loading.tsx` cleaned
- [ ] Marketplace account: `app/account/loading.tsx` cleaned
- [ ] `pnpm i18n:check:strict` PASS
- [ ] V3-05 scanner shows Class B count = 0 for the 3 apps
- [ ] Typecheck PASS for affected packages
- [ ] DRAFT PR opened with before/after for the 3 surfaces

---

You're Opus 4.7. Owner directive is short and direct — execute it. Don't add scope. Don't touch apps the owner didn't name. Don't theater-replace one theater with another. Real content or structured skeleton — that's it.
