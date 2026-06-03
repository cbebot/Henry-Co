# V3-07c — Foundation hardening: `henrycogroup.com` Domain-Literal Sweep

**Pass ID:** V3-07c  ·  **Phase:** B — Foundation Lock (hardening tail; NOT a Phase B blocker)  ·  **Pillar:** P12 (Global)
**Dependencies:** V3-07 (shipped, PR #134 — `henryDomain()` / `henryWebRoot()` helpers live at `packages/config/domain.ts`)  ·  **Effort:** S  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report.

This pass eliminates every hardcoded `henrycogroup.com` literal from runtime source in `apps/` and `packages/` and routes each through the env-aware domain helpers shipped by V3-07. It is a mechanical sweep, not a redesign: each literal becomes a `henryDomain(division, path?)` / `henryWebRoot(path?)` call, or — for email/sender contexts — references the already-centralized `BRAND_EMAIL_DOMAIN` constant. **The line you must not cross:** no behavior change, no surface change. A user must see the identical URL after the sweep that they saw before; you are only changing how that URL is constructed so staging/preview resolves correctly. Typed-copy work on user-visible URL *text* belongs to V3-07b, not here.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/07c-henrycogroup-domain-sweep` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-07 (PR #134) shipped the env-aware domain helper at `packages/config/domain.ts` and retired the first wave of `henrycogroup.com` literals (commits `9eb638b2`, `6b0cd55e`). The base domain resolves through `NEXT_PUBLIC_BASE_DOMAIN`; the literal `henrycogroup.com` is therefore forbidden in runtime code because it defeats staging/preview resolution and the future `henry.holdings` migration.

**Current real-codebase baseline (re-grep at session start to confirm — counts drift as siblings merge):**

- **25 quoted string literals** (`'henrycogroup.com'` / `"henrycogroup.com"`) across runtime source, concentrated in:
  - `packages/i18n/src/hub-owner-copy.ts` (10) — operator copy strings; **flag these for V3-07b**, do NOT typed-copy-rewrite them here.
  - `packages/config/company.ts` (2), `packages/config/brand-emails.ts` (1 — the `BRAND_EMAIL_DOMAIN` constant, the canonical sink).
  - `packages/notifications/validate-shared.ts`, `packages/notifications-ui/src/deep-link.ts` (1 each).
  - `apps/hub/**` (4: `app/lib/divisions.ts`, `app/lib/company-settings-shared.ts`, `app/components/OwnerDashboardClient.tsx`, `app/(site)/HubHomeClient.tsx`), `apps/jobs/**` (2), `apps/learn/lib/learn/store.ts`, `apps/marketplace/scripts/sync-marketplace-division.mjs`, `apps/company-hub/src/lib/brand-emails.ts`, `apps/account/app/api/cron/notification-email-fallback/route.ts` (1 each).
- **~209 total substring occurrences** of `henrycogroup.com` when template-literal interpolations, sender-address composition, and doc-comments are included — concentrated in `packages/i18n` (34), `apps/super-app` (31), `apps/hub` (26), `apps/company-hub` (24), `apps/marketplace` (19), `packages/config` (17), `apps/jobs` (10).

The single source of truth for the email domain already exists: `BRAND_EMAIL_DOMAIN = "henrycogroup.com"` in `packages/config/brand-emails.ts`. Sender contexts must reference that constant (or a thin env-aware helper layered over it), never re-literal the domain. **The gap this pass closes:** every remaining runtime literal becomes a helper/constant reference, so the env-resolution path is uniform and the staging/preview URL is correct at every call site. The prior "~156 remaining" figure in the original prompt is stale — trust the live grep, not the number.

## Mandatory scope

### S1 — Inventory before touching anything

Create the worktree report directory, then capture the exact starting inventory:

```bash
git grep -nE "['\"]henrycogroup\.com['\"]" -- apps/ packages/ \
  ':!packages/search-ui/' ':!**/*.md' ':!**/*.mdx' \
  ':!**/dist/**' ':!**/.next/**' ':!**/node_modules/**' \
  > .codex-temp/v3-07c-henrycogroup-domain-sweep/inventory-quoted.txt

git grep -nE "henrycogroup\.com" -- apps/ packages/ \
  ':!packages/search-ui/' ':!**/*.md' ':!**/*.mdx' \
  ':!**/dist/**' ':!**/.next/**' ':!**/node_modules/**' \
  > .codex-temp/v3-07c-henrycogroup-domain-sweep/inventory-substring.txt
```

**Exclusions and why:**
- `packages/search-ui/` — owner-reserved per memory `feedback_dashboard_search_engine_no_touch.md`. NEVER modify, even if literals exist there.
- `*.md`, `*.mdx` — prose that documents the domain is kept literal (replacing it breaks the doc).
- `dist/`, `.next/`, `node_modules/` — generated output, not source.

Group both inventories by `apps/<app>` / `packages/<package>` and write `.codex-temp/v3-07c-henrycogroup-domain-sweep/inventory-summary.md` with the per-area counts before any replacement. This summary is the contract: every entry resolves to a replacement, a justified-keep, or a V3-07b hand-off.

### S2 — Mechanical replacement rules

The helpers are already shipped — confirm their signatures before use:

```ts
// packages/config/domain.ts (V3-07, do NOT change signatures)
export function henryDomain(division: HenryDivision, path?: string): string  // → https://<division>.<base>[path]
export function henryWebRoot(path?: string): string                          // → https://<base>[path]
export function henrySubdomain(host: string, path?: string): string
export function henryDomainHost(division: HenryDivision): string             // host only, no protocol

// packages/config/company.ts (already shipped)
getHubUrl(path?) · getAccountUrl(path?) · getHqUrl(path?) · getStaffHqUrl(path?)

// packages/config/brand-emails.ts (already the email sink)
export const BRAND_EMAIL_DOMAIN = "henrycogroup.com"
```

Apply per occurrence:

**Pattern 1 — Division subdomain URL**
```ts
// BEFORE
'https://care.henrycogroup.com/booking/123'
// AFTER
henryDomain('care', '/booking/123')
```

**Pattern 2 — Root domain URL**
```ts
// BEFORE
'https://henrycogroup.com/about'
// AFTER
henryWebRoot('/about')
```

**Pattern 3 — Known account/hub/hq surface**
```ts
// BEFORE
'https://account.henrycogroup.com/wallet'
// AFTER
getAccountUrl('/wallet')   // prefer the named helper over henryDomain when one exists
```

**Pattern 4 — Email sender / from-address**
```ts
// BEFORE
const from = 'noreply@henrycogroup.com'
// AFTER
import { BRAND_EMAIL_DOMAIN } from '@henryco/config'
const from = `noreply@${BRAND_EMAIL_DOMAIN}`
```
`BRAND_EMAIL_DOMAIN` is the single source of truth for the mail domain and already exists. Do NOT invent `henryEmailRoot()` unless a call site needs env-aware *staging-mail-domain* divergence that the constant cannot express — and if you do add it, layer it over `BRAND_EMAIL_DOMAIN` in `packages/config/brand-emails.ts`, do not duplicate the literal. `apps/company-hub/src/lib/brand-emails.ts` must re-export or consume the shared constant, never hold its own copy of the literal.

**Pattern 5 — Doc-comment reference (KEEP)**
```ts
/** Returns the canonical URL for henrycogroup.com. */   // ← unchanged; documentation, not runtime
```
Doc-comments that reference the domain to explain helper behavior are kept literal. Confirm by reading the surrounding code.

**Pattern 6 — Test fixture / mock asserting helper output (KEEP, justify)**
```ts
// in __tests__ / *.test.ts asserting henryDomain output
expect(henryDomain('care')).toBe('https://care.henrycogroup.com')   // ← the prod literal IS the expected value
```
Keep when the test documents expected helper output. If the fixture merely feeds a URL into a mock, replace with the helper. Record any kept fixture in the residual report with a one-line justification. Note `packages/config/__tests__/domain.test.mjs` is the helper's own test — its expected-output literals stay.

**Pattern 7 — Operator-surface i18n copy (HAND OFF to V3-07b, do NOT touch)**
The 10 literals in `packages/i18n/src/hub-owner-copy.ts` (and any other `packages/i18n/src/*-copy.ts` hits) are *typed-copy strings*, not runtime URL construction. Replacing them is V3-07b's typed-copy job, not a mechanical domain swap. List each in the V3-07b hand-off section of the report; leave them untouched.

### S3 — Helper extension (only if a call site demands it)

Extend `packages/config/domain.ts` / `packages/config/brand-emails.ts` ONLY when a real call site needs a shape the existing helpers don't cover:
- `henryEmailRoot()` — only if staging mail diverges from `BRAND_EMAIL_DOMAIN`; otherwise use the constant directly.
- `henryShareRoot()` / `henryApiRoot()` — only if share-text or API URLs need a distinct root.

Add a helper only if at least one call site consumes it. Any new helper ships with a unit test in `packages/config/__tests__/` mirroring `domain.test.mjs`. Never change the signature or env-resolution behavior of the V3-07 helpers.

### S4 — Per-area replacement and commit hygiene

Replace area by area, building and committing each area independently so review is tractable (~10–15 commits total):

```
V3-07c: replace henrycogroup.com literals in apps/account
V3-07c: replace henrycogroup.com literals in apps/hub
V3-07c: replace henrycogroup.com literals in apps/super-app
... (one commit per app/package area)
V3-07c: brand-email domain consolidation (company-hub → shared constant)   # if any
V3-07c: residual + grep-zero verification                                  # final
```

After each area: `pnpm --filter <app> build` and `pnpm --filter <app> test` (or `pnpm --filter @henryco/<pkg> build` for packages). Re-baseline any helper-output fixture per Pattern 6 and note it.

## Out of scope

- `packages/search-ui/` — owner-reserved; never modified (V3-07b inherits the same reservation).
- Markdown / MDX docs — kept literal; they document the domain.
- Operator-surface typed-copy rewrites (the `hub-owner-copy.ts` literals and any other `packages/i18n/src/*-copy.ts` hits) — **owned by V3-07b**. Flag, do not edit.
- Helper *logic/signature* changes to `henryDomain()` / `henryWebRoot()` — the V3-07 contract is frozen here. Only additive new helpers are in scope.
- `process.env.NEXT_PUBLIC_BASE_DOMAIN` references that already read from env — already correct; do not "normalize" through a helper unless the read-path is provably equivalent.
- Webhook URLs configured by env var (Stripe/Paystack/OneSignal callbacks) — already env-driven; out of scope.

## Dependencies

**Requires on `main`:** V3-07 (PR #134) — `packages/config/domain.ts` helpers + `BRAND_EMAIL_DOMAIN` constant. **Blocks:** nothing directly. V3-94 (closure integration) re-runs the grep-zero gate; a V3-07c regression fails V3-94. **Does NOT block** Phase C start.

## Inheritance

- `packages/config/domain.ts` — `henryDomain` / `henryWebRoot` / `henrySubdomain` / `henryDomainHost` (V3-07). Extend additively only.
- `packages/config/company.ts` — `getHubUrl` / `getAccountUrl` / `getHqUrl` / `getStaffHqUrl`.
- `packages/config/brand-emails.ts` — `BRAND_EMAIL_DOMAIN` (the email-domain sink).
- `packages/config/__tests__/domain.test.mjs` — the helper test pattern to mirror for any new helper.

## Implementation requirements

### Files
- **Modified:** per-area runtime source under `apps/*` and `packages/*` carrying quoted/template-literal `henrycogroup.com` (per the S1 inventory) — excluding `packages/search-ui/`, `packages/i18n/src/*-copy.ts` (V3-07b), and docs.
- **Possibly modified:** `packages/config/domain.ts` / `packages/config/brand-emails.ts` (additive helpers only, S3), plus a mirroring test in `packages/config/__tests__/`.
- **New:** `.codex-temp/v3-07c-henrycogroup-domain-sweep/{inventory-quoted.txt, inventory-substring.txt, inventory-summary.md, inventory-post.txt, report.md}`.

### Trust / safety / compliance
- **No surface-text change.** The only acceptable displayed-URL delta is the intended env-aware staging/preview behavior from V3-07 (e.g., preview shows a staging host). Confirm that is the cause for any observed difference.
- **No webhook URL changed.** Third-party callback URLs are env-configured; verify none are touched.
- **No share-link drift.** Spot-check 5 share-link generators (e.g., jobs/marketplace share helpers) — the generated URL must be byte-identical in production after the sweep, or existing shared links break.
- No money/identity/compliance logic is touched; this is a pure URL-construction sweep.

### Mobile + desktop parity
Expo apps are in scope: `apps/super-app` (31 occurrences) and `apps/company-hub` (24) carry the most substring hits. Replace through the shared `@henryco/config` helpers consumed by mobile; confirm `pnpm --filter super-app build` and `pnpm --filter company-hub build` pass. `apps/company-hub/src/lib/brand-emails.ts` must consume the shared `BRAND_EMAIL_DOMAIN`, not hold a duplicate literal.

### i18n
No new namespaces. This pass does not author copy. Operator-surface copy strings containing the domain (`packages/i18n/src/hub-owner-copy.ts` and siblings) are handed to V3-07b for typed-copy treatment under namespace `surface:hubHome` / the relevant operator namespace — flagged here, not edited.

### Brand & design system
The user-facing brand is **Henry Onyx** (legal **Henry Onyx Limited**); the *code/domain shorthand* `henrycogroup.com` and `@henryco/*` are UNCHANGED internal wiring. This pass changes only URL *construction*, never brand *strings*. Any displayed brand text stays sourced from `@henryco/config` (`COMPANY.group.name`), never re-littered here. Zero hardcoded domains is the whole point of the pass.

## Validation gates

1. **Grep-zero:** the S1 quoted-literal grep returns no matches except justified doc-comments (Pattern 5) and helper-output fixtures (Pattern 6). The substring grep returns only: justified-keeps + the `BRAND_EMAIL_DOMAIN` constant definition itself + V3-07b-owned `*-copy.ts` hits (listed in the hand-off).
2. **Per-area build + test:** every touched app `pnpm --filter <app> build` + `pnpm --filter <app> test` green; every touched package `pnpm --filter @henryco/<pkg> build` green.
3. **Repo-level:** `pnpm typecheck` + `pnpm lint` + `pnpm test` green.
4. **CI:** the required "Lint, typecheck, test, build" check green on the PR.
5. **Vercel preview:** preview deploys clean for each touched app; spot-check 3 random replacements per app render the staging-aware URL correctly.
6. **Share-link integrity:** 5 share-link generators produce production URLs identical to pre-sweep.

## Deployment gate

All six validation gates green; CI green; PR squash-merged to `main` (no force-push, no branch-protection bypass). No soak window required — this is a no-behavior-change sweep — but confirm one post-merge Vercel production deploy renders a known division URL (e.g., a care booking link) identically to pre-merge.

## Final report contract

`.codex-temp/v3-07c-henrycogroup-domain-sweep/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus:
- Before/after grep counts (`inventory-quoted.txt` / `inventory-substring.txt` → `inventory-post.txt`).
- Helper extensions added (if any) with one-line justification + test reference.
- **V3-07b hand-off list** — every operator-surface copy literal found (the `hub-owner-copy.ts` set and siblings), with file:line, for typed-copy treatment.
- Justified residual — each kept literal (doc-comment / helper-output fixture) with its reason.

## Self-verification

- [ ] S1: `inventory-quoted.txt`, `inventory-substring.txt`, `inventory-summary.md` captured before any edit.
- [ ] S2: every runtime URL/sender literal replaced via the correct pattern; named helpers preferred over raw `henryDomain` where one exists.
- [ ] S3: helper extensions (if any) added additively, consumed by a real call site, and unit-tested.
- [ ] S4: committed per area; per-area + repo-level build/lint/test green; fixture re-baselines documented.
- [ ] Pattern 7: operator-surface `*-copy.ts` literals flagged for V3-07b and left untouched.
- [ ] Grep-zero achieved (modulo justified doc-comments, helper fixtures, the `BRAND_EMAIL_DOMAIN` definition, and V3-07b-owned copy).
- [ ] Share-link generators spot-checked (5) — production URLs unchanged.
- [ ] `packages/search-ui/` untouched; markdown/MDX untouched.
- [ ] Vercel preview clean for every touched app; 3 spot-checks per app verified.
- [ ] Report written at `.codex-temp/v3-07c-henrycogroup-domain-sweep/report.md` with the V3-07b hand-off list.
