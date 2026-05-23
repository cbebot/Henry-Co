# V3-07c — `henrycogroup.com` Domain Sweep (HARDENING)

**Pass ID:** V3-07c
**Phase:** B — Hardening tail (NOT a Phase B blocker)
**Pillar:** P12 (Global)
**Dependencies:** V3-07 merged (the `henryDomain()` / `henryWebRoot()` helper at `packages/config/domain.ts` is on `main`)
**Effort:** S (<1 week; 1–2 agent sessions)
**Parallel-safe:** Y (mechanical replace; no shared-state contention)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **`henrycogroup.com` literal sweep**. V3-07 retired ~40 of ~196 literals (the literals it could close within scope). V3-07c sweeps the remaining ~156. The replacement is mechanical: each literal `'henrycogroup.com'` or `"henrycogroup.com"` becomes a `henryDomain(division)` or `henryWebRoot()` helper call. No logic change. No surface change. The env-aware staging URL pattern works at every call site after V3-07c.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/07c-henrycogroup-domain-sweep` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary

V3-07's grep of `apps/` + `packages/` for literal `henrycogroup.com` returned ~196 hits at scope-start. V3-07 closed ~40 (commits `9eb638b2` `henrycogroup.com literals across hub/jobs/marketplace/property/staff/studio + shared packages` and `6b0cd55e` `henrycogroup.com literals in account app`).

V3-07c's starting baseline: **~156 remaining literals.**

The conductor's count breakdown at hand-off:
- `apps/` — 133 literals before V3-07's sweep; portion remaining after V3-07 commits applied.
- `packages/` — 63 literals before V3-07's sweep; portion remaining after V3-07 commits applied.

Re-grep at V3-07c session start to get the exact current count (the number may have drifted as other passes merged).

---

## Inventory (run as your first step)

Run this exact grep at session start:

```bash
git -C "<worktree-root>" grep -nE "['\"]henrycogroup\\.com['\"]" -- apps/ packages/ \
  ':!packages/search-ui/' \
  ':!**/*.md' \
  ':!**/*.mdx' \
  ':!**/dist/**' \
  ':!**/.next/**' \
  ':!**/node_modules/**' \
  > .codex-temp/v3-07c-henrycogroup-domain-sweep/inventory-pre.txt
```

**Exclusions explained:**
- `packages/search-ui/` — owner-reserved per memory `feedback_dashboard_search_engine_no_touch.md`. NEVER modify.
- `*.md`, `*.mdx` — doc references that explain the domain in prose are KEPT as literals (they document the domain; replacing breaks the doc).
- `dist/`, `.next/`, `node_modules/` — generated output; not source.

Group the inventory by file area for review-ability:

```
apps/account/        →  X literals
apps/care/           →  Y literals
apps/marketplace/    →  Z literals
apps/hub/            →  …
apps/jobs/           →  …
apps/property/       →  …
apps/studio/         →  …
apps/logistics/      →  …
apps/learn/          →  …
apps/super-app/      →  …
apps/company-hub/    →  …
packages/branded-documents/ →  …
packages/email/      →  …
packages/seo/        →  …
packages/share/      →  …
packages/notifications/ →  …
packages/<other>/    →  …
```

Output the grouped count in `.codex-temp/v3-07c-henrycogroup-domain-sweep/inventory-summary.md` before any replacements.

---

## Method

### Mechanical replace rules

For each literal occurrence:

**Pattern 1: Division subdomain**
```ts
// BEFORE
'https://care.henrycogroup.com/booking/123'
// AFTER
`${henryDomain('care')}/booking/123`
```

**Pattern 2: Root domain**
```ts
// BEFORE
'https://henrycogroup.com/about'
// AFTER
`${henryWebRoot()}/about`
```

**Pattern 3: Bare domain in template literal**
```ts
// BEFORE
`Welcome to ${baseUrl}/henrycogroup.com/path`  // (already a template; literal mid-string)
// AFTER (case-by-case; usually the template should use the helper directly)
`Welcome to ${henryWebRoot()}/path`
```

**Pattern 4: Email-from / sender-name string referencing domain**
```ts
// BEFORE
const from = 'noreply@henrycogroup.com'
// AFTER (depends on context; if it's a sender for a specific division, route via the email-senders convention from V3-07b S4; if it's the root mailer, keep `noreply@${henryEmailRoot()}` style helper)
const from = `noreply@${henryEmailRoot()}`
```

If `henryEmailRoot()` doesn't exist in `packages/config/domain.ts` yet, ADD it (the file is owned by V3-07's helper; extending it is in-scope for V3-07c).

**Pattern 5: Doc-comment domain reference**
```ts
// BEFORE
/**
 * Returns the canonical URL for henrycogroup.com.
 */
// AFTER (NO change — this is documentation)
/**
 * Returns the canonical URL for henrycogroup.com.
 */
```

Doc-comments that REFERENCE the domain for explanation purposes are kept literal. They are not user-visible at runtime. Confirm by reading the surrounding code; if the comment is documenting helper behavior, leave it.

**Pattern 6: Test fixture / mock**
```ts
// BEFORE (in __tests__ or *.test.ts)
const fixtureUrl = 'https://care.henrycogroup.com/booking/123'
// AFTER (decision depends: if the test is asserting helper output, keep literal as the expected value;
//        if the test is feeding URL into a mock and asserting downstream behavior, replace with helper)
```

When in doubt for tests, keep the literal — tests document expected output, and the helper-output IS the literal in prod. Mark the test file in the residual report with a one-line justification.

### Helper extension

If session inventory reveals patterns the existing helper doesn't handle, extend `packages/config/domain.ts`:

- `henryEmailRoot()` → returns `henrycogroup.com` (no protocol) for sender domains. Env-aware (staging may use a different mail-sending domain).
- `henryShareRoot()` → if share text generators reference a different root than web.
- `henryApiRoot()` → if API URLs need a separate helper.

Only add helpers actually used by call sites; don't pre-build helpers that nothing consumes.

### Per-app verification

After replacement, for each app touched:

1. `pnpm --filter <app> build` — confirm typecheck + build pass.
2. `pnpm --filter <app> test` — confirm tests pass (some fixture tests may need re-baselining; see Pattern 6).
3. Vercel preview deploys cleanly — the preview-URL pattern is staging-aware after helper substitution.

For packages touched: `pnpm --filter @henryco/<package> build`.

### Commit hygiene

Commit per app/package, not per file:

- `V3-07c: replace henrycogroup.com literals in apps/account`
- `V3-07c: replace henrycogroup.com literals in apps/care`
- ... (one commit per app/package area, ~10–15 commits total)
- `V3-07c: helper extension (henryEmailRoot)` — if any helper additions
- `V3-07c: residual + grep-zero verification` — final commit with inventory-post.txt + grep-zero proof

This makes review tractable; each commit is mechanical + scoped to one area.

---

## Single session OR two sessions?

The expected total is ~156 literals.

**One-session profile (recommended for first attempt):**
- 156 replacements is within a single agent session's capacity if you batch by app and use the Edit tool's `replace_all` mode where the literal is unique within a file.
- Estimated time: 4–6 hours of focused work + 1 hour validation.

**Two-session profile (if session 1 runs out of context):**
- Session 1: apps (133 literals after V3-07). Hand-off note lists remaining packages.
- Session 2: packages (63 literals after V3-07) + helper extensions + final grep-zero verification.

Per memory `feedback_clean_works_over_bulk.md`: prefer one-thing-well + stop. If session 1 closes apps cleanly, stop and hand off packages to session 2 rather than overreaching.

---

## Out of scope

- **`packages/search-ui/`** — owner-reserved. Do NOT modify even if literals are present.
- **Markdown / MDX docs** — kept literal (they document the domain).
- **Helper logic changes** — `henryDomain()` + `henryWebRoot()` from V3-07 are the contract; do not change their signatures or env-resolution behavior in V3-07c. Helper EXTENSIONS (new functions like `henryEmailRoot()`) are in scope.
- **Surface text** — if a literal is inside user-visible copy (e.g., a marketing string saying "Visit henrycogroup.com"), that's V3-07b's job (operator-surface typed-copy), not V3-07c's. Flag in residual.
- **Environment variable references** — `process.env.NEXT_PUBLIC_HENRYCO_ROOT` style references that read from env are already correct; do not "normalize" them through the helper unless the helper read-path is equivalent.

---

## Dependencies

**Must be on `main` before V3-07c starts:**
- V3-07 — provides `packages/config/domain.ts` with `henryDomain()` + `henryWebRoot()`. Commit `b5771899` (`V3-07(S2): domain helper at packages/config/domain.ts`).

**Does NOT block any other pass.**

---

## Inheritance

- `packages/config/domain.ts` — extend with new helpers if needed (S5 above).
- Existing TypeScript types for `HenryDivision` — extend if new divisions appear (unlikely in this pass).

---

## Verification

**Post-pass grep MUST return ZERO matches:**

```bash
git -C "<worktree-root>" grep -nE "['\"]henrycogroup\\.com['\"]" -- apps/ packages/ \
  ':!packages/search-ui/' \
  ':!**/*.md' \
  ':!**/*.mdx' \
  ':!**/dist/**' \
  ':!**/.next/**' \
  ':!**/node_modules/**'
```

Expected output: **(nothing — exit code 1, "no matches")**.

If any matches remain, they MUST be:
1. Inside a doc-comment (`/** … */`) explaining helper behavior. Justify in residual.
2. Inside a test fixture asserting expected helper output. Justify in residual.
3. Inside `packages/search-ui/` (owner-reserved; not in grep scope anyway).

Any other remaining match is a V3-07c failure. Close it before reporting done.

**Build + test pass:**
- Every app touched: `pnpm --filter <app> build` + `pnpm --filter <app> test` green.
- Every package touched: `pnpm --filter @henryco/<package> build` green.
- Repo-level: `pnpm typecheck` + `pnpm test` green.

**Vercel preview passes:**
- Open a Vercel preview deploy URL for each app touched.
- Confirm the helper-substituted URLs render correctly (staging URLs in preview; prod URLs in main after merge).
- Spot-check 3 random replacements per app on the preview deploy.

---

## Trust / safety / compliance

- **No surface-text change.** V3-07c does not change what a user sees; it only changes how the URL is constructed at runtime. If any replacement happens to change displayed URL (e.g., a staging-aware preview showing `*.henrycogroup-staging.com` instead of `*.henrycogroup.com`), confirm that's the intended env-aware behavior from V3-07.
- **No webhook URL accidentally changed.** Webhook URLs registered with third parties (Stripe, Paystack, OneSignal, etc.) are configured by env var, not by helper. Verify by grepping for the literal in webhook-config files; those should already be env-var-driven from V3-07.
- **No share-link URL accidentally changed.** Share links generated for users (e.g., "share this listing") must produce the same URL post-V3-07c as pre — otherwise existing share links break. Spot-check 5 share-link generators after replacement.

---

## Final report contract

`.codex-temp/v3-07c-henrycogroup-domain-sweep/report.md` with:

1. **Before/after grep counts.**
   - Pre: `inventory-pre.txt` (count + grouping).
   - Post: `inventory-post.txt` (should be zero plus justified residual).
2. **Files touched** — list every file modified, grouped by app/package.
3. **Helper extensions** — any new helpers added to `packages/config/domain.ts` with one-line justification.
4. **Justified residual** — any literal matches still present, with the doc-comment / test-fixture justification per match.
5. **Build + test results** — per-app + repo-level green confirmation.
6. **Vercel preview spot-check** — 3 random replacements per app verified on preview.
7. **Hand-off to V3-07b** — if any literal was found inside user-visible surface text (Pattern 6 — surface text out-of-scope), list it with a pointer to V3-07b for typed-copy treatment.

---

## Self-verification

- [ ] Pre-sweep inventory captured: `inventory-pre.txt` + `inventory-summary.md`.
- [ ] All ~156 literals replaced (or justified residual documented).
- [ ] Helper extensions (if any) added to `packages/config/domain.ts` with tests.
- [ ] Per-app + per-package builds green.
- [ ] Per-app tests green; any fixture rebaselining documented.
- [ ] `pnpm typecheck` + `pnpm test` green at repo root.
- [ ] Vercel preview deploys clean for every app touched.
- [ ] Post-sweep grep returns ZERO (excluding doc-comments + test fixtures + `packages/search-ui/`).
- [ ] Share-link generators spot-checked (5 random) — URLs unchanged post-V3-07c.
- [ ] `packages/search-ui/` untouched.
- [ ] Markdown / MDX docs untouched.
- [ ] Report written: `.codex-temp/v3-07c-henrycogroup-domain-sweep/report.md`.
- [ ] Hand-off to V3-07b documented for any surface-text findings.

---

## The bar

V3-07c is mechanical and cheap. It exists because V3-07 ran out of session-time on the long tail of literals, not because the work is hard. Treat it as a sweep: grep, replace, verify, ship. No drama, no scope creep, no extension into typed-copy territory (that's V3-07b's job).

Done = grep returns zero (modulo justified residual) + all builds green + helper extensions tested + preview deploys clean.
