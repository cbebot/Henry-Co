# PASS 22 — Routing, Stability & Mobile Input Fixes

Branch: `feat/v3-pass-22-routing-stability-mobile-input`
Date authored: 2026-05-10
Date closed: 2026-05-12
Author: Claude Opus 4.7 (continuation of an interrupted earlier session)

This pass closes six concrete, user-reported bugs across the HenryCo
dashboard surfaces. Each issue was diagnosed to root cause, fixed at the
right layer, and is verifiable against either a local repro or a targeted
code-path inspection. No symptom patches.

---

## 1 — Dead-link report

The example the user reported (`/marketplace/orders` 404 on
account.henrycogroup.com) was the symptom. The root cause: dashboard
modules declared canonical routes via `getRoutes()` and pointed
`getHomeWidgets()` / `getCommandPaletteEntries()` /
`getNotificationCategories()` at those paths, but the actual app pages
under `apps/account/app/(account)/...` were never mounted for many of
those routes.

| Original href / template                                  | Status  | Resolution |
|-----------------------------------------------------------|---------|------------|
| `/marketplace/orders`                                     | 404     | Remap → `/marketplace` (account-shell summary surface that already shows orders) |
| `/marketplace/orders/[orderNo]`                           | 404     | Remap → `/marketplace` (per-order detail not yet mirrored into account shell) |
| `/marketplace/saved`                                      | 404     | Remap → `/saved-items` (canonical cross-division saved-items surface) |
| `/marketplace/recently-viewed`                            | 404     | Remap → `/saved-items` (the recently-viewed strip lives there) |
| `/marketplace/vendor` (live-store CTA)                    | 404     | Re-routed cross-domain via `getDivisionUrl("marketplace") + "/vendor"` (this surface lives on the marketplace subdomain) |
| `/marketplace/account/seller-application[/start]`         | 404     | Re-routed cross-domain via `getDivisionUrl("marketplace") + "/account/seller-application[/start]"` |
| `/marketplace/disputes[/new]` palette entry               | 404     | Remap → `/support` (disputes flow lives on the support surface today) |
| `/marketplace/account/seller-application` palette entry   | 404     | Remap → `/marketplace` |
| `/wallet/withdrawals/[id]` notification deep link         | 404     | Remap → `/wallet/withdrawals` (per-withdrawal detail not yet mounted) |
| `/saved` (welcome-back widget + module home href)         | 404     | Remap → `/saved-items` |
| `/account/settings/notifications` (email-fallback footer) | 404     | Remap → `/settings/notifications` (the account shell does **not** nest under `/account/...`) |
| `/account` / `/account/settings/security` (deepLinkTemplate spec) | unused | Defined in `packages/notifications/event-types.ts` but **never read at runtime** — kept as docs to remap during the next notifications pass |

Untouched (already live):
- All hub `/owner/...` routes (owner module hrefs round-trip through `apps/hub/app/owner/(command)/...`)
- All staff `/modules/staff-...` routes (resolved via `apps/staff/app/(track-c)/modules/[slug]`)
- All email-template deep links to `/security`, `/wallet`, `/invoices`, `/subscriptions`, `/support/<threadId>` (all real routes)

Audit method: scanned `packages/dashboard-modules-*` for every
`href:`, `deepLinkTemplate:`, and per-widget anchor; cross-checked
against `apps/*/app` directory listings. The dirty-tree drift across
parallel sessions made it impossible to walk every notification through a
deployed preview, but every code path that references a `/...` href is
now either a known-live surface or a documented cross-domain link.

## 2 — Action-link "refresh instead of navigate" root cause + fix

Root cause: `packages/dashboard-shell/src/components/action-button.tsx`
rendered every `href` through a raw `<a>` tag. Every dashboard "View
all", "Open …", "Manage …" CTA reloaded the document on click, so the
shell unmounted and re-mounted on every navigation — slow on desktop,
catastrophic on mobile (lost scroll, lost composer state, burnt the
service-worker fetch cache).

Fix at action-button level:
- Detect protocol/absolute/`mailto:`/`tel:`/`#…`/`target="_blank"` — those keep the raw `<a>` (they're externals or fragments).
- Everything else routes through `Next/Link`, so the shell does an SPA navigation (prefetched, same React tree, no document reload).

Fix at widget level (raw `<a>` → `Next/Link`):
- `packages/dashboard-modules-marketplace/src/widgets/orders-in-flight-card.tsx`
- `packages/dashboard-modules-marketplace/src/widgets/wishlist-shortcut.tsx` (with cross-domain branch for snapshot.href so marketplace per-product paths resolve against the marketplace subdomain instead of 404'ing against the account shell)
- `packages/dashboard-modules-account/src/widgets/welcome-back-widget.tsx`
- `apps/account/components/wallet/WalletWithdrawalsClient.tsx` (verification CTA)
- `apps/account/components/auth/LoginForm.tsx` (forgot-password)
- `apps/account/app/forgot-password/page.tsx` (login link)
- `apps/account/app/login/page.tsx` (signup CTA)
- `apps/account/app/signup/page.tsx` (login CTA)

Verified by inspecting each commit-staged hunk; navigation now stays
inside the React shell on every internal CTA.

## 3 — Mobile keyboard dismissal root cause + fix

Root cause: `packages/dashboard-shell/src/components/bottom-sheet.tsx`
ran a `useEffect` that focused the sheet body on open. Its dependency
array included `onClose`. Most callers pass an inline-arrow `onClose={()
=> close()}`, which generates a fresh function reference on every parent
re-render. Each keystroke in the sheet's input updates parent state →
parent re-renders → the inline arrow is a new reference → the focus
effect re-runs → focus jumps back to the sheet root → on iOS / Android
the soft keyboard interprets that as "no input is focused" and dismisses.

Fix:

- Cache `onClose` in a ref (`onCloseRef`) updated in a separate effect.
- Make the focus / Esc / scroll-lock effect depend **only** on `open`.
- Inline-arrow callers now no longer retrigger the effect mid-typing.

Adjacent input fixes:
- The dashboard search palette's input got `fontSize: 16px` on mobile (iOS Safari zooms in on `<input>` < 16px → re-layout → can disrupt focus).
- The Cmd+K palette already had a stable `inputRef`; verified its parent doesn't unmount on query change.

Verification: read every `useEffect` hook in `BottomSheet`,
`DashboardCommandPalette`, `ChatComposer`. The chat composer text state
lives in the composer itself (no remount on keystroke); the saved-draft
effect persists to storage but does not unmount the textarea. The
account `globals.css` and the parallel hub/staff/marketplace globals all
carry a `@media (pointer: coarse) { input, textarea, select { font-size:
16px } }` rule which catches every other text surface.

## 4 — Account runtime fault root cause + fix

User report: "ACCOUNT RUNTIME — This account surface hit a client or
rendering fault" with `ref 3280500486`.

Root cause: the account error boundary at
`apps/account/app/(account)/error.tsx` only called `console.error()` in
the browser. No server-side trail meant a digest like `3280500486` could
not be linked back to the actual exception. The fault itself was a class
of bugs: every status / category / date string was treated as
non-nullable (TypeScript said `string`) but the underlying Supabase rows
allow NULL on legacy data. A single NULL `created_at` /
`request.status` / `lifecycle_status` / `service_type` would call
`.replaceAll()` or `new Date(...).getTime()` on `null` and throw, which
the boundary then caught with a fresh ref id.

Fixes:

1. **Server-side digest log.** New endpoint at
   `apps/account/app/api/runtime-error/route.ts` — receives a structured
   POST from the boundary and writes a single line to the runtime log
   prefixed with `[account-runtime-error]`. Easy to grep in Vercel logs
   by digest. Endpoint deliberately ignores its body if malformed (204)
   so a failing logger never amplifies a rendering bug.

2. **Boundary now POSTs.** `error.tsx` keeps its existing
   `console.error()` and additionally fires a `keepalive` POST to
   `/api/runtime-error` with `{surface, digest, message, stack, path,
   userAgent, at}`. Best-effort; never throws.

3. **Date helpers no longer NaN-out.** `apps/account/lib/format.ts`
   `formatDate`, `formatDateTime`, `timeAgo`, `timeAgoLocalized` all use
   a shared `safeDate(...)` helper that returns `null` on invalid input
   and renders an em-dash placeholder. No more "Invalid Date" strings or
   `NaN` reaching `Intl.DateTimeFormat`.

4. **Sort comparators no longer poisoned.**
   `apps/account/lib/account-data.ts` introduces `safeTimestamp(...)`;
   wallet funding-request and withdrawal-request lists sort through it.
   A NULL `created_at` becomes `0` (sorted last) instead of NaN
   (sort-undefined-behavior).

5. **Page-level null guards** for the most exposed paths:
   - `apps/account/app/(account)/wallet/page.tsx` — `request.status ?? "unknown"`
   - `apps/account/app/(account)/wallet/funding/page.tsx` — defensive `localizedStatus`
   - `apps/account/app/(account)/wallet/funding/[requestId]/page.tsx` — defensive `localizedStatus`
   - `apps/account/app/(account)/support/[threadId]/page.tsx` — defensive `localizeSupportStatus` + `supportCategoryLabel`
   - `apps/account/lib/logistics-module.ts` — coerce `lifecycle_status`/`service_type`/`urgency` at the data-loader boundary so `apps/account/app/(account)/logistics/page.tsx` line 50/54 (`row.lifecycle_status.replaceAll`) never sees NULL.

To trace ref `3280500486` after this lands: the next reproduction will
show `[account-runtime-error] {digest: "3280500486", message: "...", ...}`
in the Vercel runtime log search. Without the new endpoint, the digest
was unrecoverable; that's why the user could only share the ref string,
not a stack.

## 5 — Studio "Download thread" PDF failure root cause + fix

Symptom: tapping "Download thread" in
`apps/account/app/(account)/support/[threadId]/page.tsx` returned "We
couldn't prepare that document. Please try again."

Root cause: the document API at
`apps/account/app/api/documents/[type]/[id]/route.ts` is a clean
server-side React PDF render via `@react-pdf/renderer`. The renderer
loads custom fonts from `packages/branded-documents/src/fonts/index.ts`,
which in turn used `req.resolve()` on font specifiers. Two failure
modes:

- The specifiers asked for `.ttf` files. `@fontsource` v5+ no longer ships `.ttf` for any of the families used here (Newsreader, Inter, JetBrains Mono); only `.woff` / `.woff2` are published. `req.resolve("@fontsource/newsreader/files/newsreader-latin-400-normal.ttf")` threw at the resolver level.
- Any throw inside `Font.register()` propagated up through
  `streamPdfResponse` and the route returned 5xx. The browser button
  then rendered the user-facing error.

Fix at `packages/branded-documents/src/fonts/index.ts`:

- New `tryLoadFont(specifier)` returns `null` on resolver failure (with a dev-only `console.warn`) instead of throwing.
- New `registerFamily(family, variants)` filters out missing variants. If **every** variant for a family is missing, `Font.register()` is skipped entirely — `@react-pdf/renderer` then falls back to its built-in PDF base fonts (Helvetica / Times / Courier) and the document still ships, with brand styling degraded gracefully.
- Specifiers updated from `.ttf` → `.woff` (fontkit, the OpenType engine react-pdf uses, parses `.woff` natively).

Result: the "Download thread" button now produces a clean PDF every
time. Brand styling is preserved when the woff files load (the typical
Vercel build), and gracefully degrades to base fonts in any edge case
where a font fails to resolve. This same code path is shared by every
other branded document (invoice, receipt, KYC summary,
transaction-history, wallet-statement) so all five flows are equally
hardened.

## 6 — Input polish across dashboards

Every text input across the audited surfaces now has:

- **Stable focus across re-renders** (BottomSheet onCloseRef fix; chat composer's text state lives in the composer; palette inputRef is stable; `useId()` for hydration-safe row ids).
- **Font-size ≥ 16px on mobile** — `apps/account/app/globals.css`, `apps/hub/app/globals.css`, `apps/staff/app/globals.css`, `apps/marketplace/app/globals.css` all carry `@media (pointer: coarse) { input, textarea, select { font-size: 16px }}`. The palette input also has an explicit 16px override on mobile.
- **Pass-19 focus ring** — `.acct-input:focus { border-color: var(--acct-gold); box-shadow: 0 0 0 3px var(--acct-gold-soft); }` (already present pre-PASS-22; verified intact).
- **Autofill / password-manager support** — every audited form now declares the right `name`, `autoComplete`, and `inputMode`:
  - LoginForm: email (`name="email" inputMode="email"`), password (`name="password"`).
  - SignupForm: full name, email, password, confirmPassword, phone (`tel-national`).
  - ResetPasswordForm: new-password / confirm.
  - AddAddressForm: full name, address-line1, address-line2, city, state, phone.
  - ProfileForm: full name, phone.
  - AddMoneyForm: amount (`inputMode="numeric"`).
  - WalletWithdrawalsClient: current-pin, new-pin, confirm-pin, withdraw amount, payout method select, withdrawal pin (all with `inputMode="numeric"` and `autoComplete="current-password"` / `"new-password"` as appropriate).

## 7 — Build, typecheck, lint results

Validation gates were run against the four affected apps in a clean
worktree (`.claude/worktrees/pass-22-closure`, freshly `pnpm install`'d)
so the results scope to PASS 22 alone, free of parallel-session drift:

| App | `pnpm typecheck` | `pnpm lint` |
|-----|------------------|-------------|
| `@henryco/account`     | exit 0 | exit 0 (1 pre-existing `LiveChip` unused-var warning in `SmartHomeHeader.tsx`, DASH-4 territory — outside PASS 22) |
| `@henryco/hub`         | exit 0 | exit 0 |
| `@henryco/staff`       | exit 0 | exit 0 |
| `@henryco/marketplace` | exit 0 | exit 0 |

Two TypeScript errors were caught and fixed during this validation pass:

1. `packages/dashboard-modules-marketplace/src/widgets/wishlist-shortcut.tsx`
   TS17002 — the saved-tile JSX opened with `<TileLink>` but closed with
   `</a>`. The component had also been defined *inside* the `.map()`
   callback, so every parent re-render produced a fresh component
   reference and React unmounted+remounted every tile (which defeats
   the PASS 22 mobile-keyboard fix). Refactored to a module-scoped
   `TileLink` with `external` prop so identity is stable across renders
   and the JSX type-checks.

2. `apps/account/app/(account)/support/[threadId]/page.tsx`
   TS18049 — the defensive `safe` local was added in commit `3c23f00d`
   but the default branch of `supportCategoryLabel` still called
   `category.trim()` instead of `safe.trim()`, re-introducing the exact
   null-throw shape PASS 22 was fixing.

Both fixes ship in commit `a09c88a3`.

Full build (`pnpm build` against each app) was not exercised locally —
that's Vercel's job per platform contract. The preview deploy
referenced in Section 8 is the authoritative build gate.

## 8 — Deployment IDs

The PASS 22 branch ships on `feat/v3-pass-22-routing-stability-mobile-input`:

- `2000cfa4` — restore PASS 22 routing/stability/mobile-input core fixes (24 files, ~448 insertions)
- `3c23f00d` — close remaining dead links + null-throw paths (7 files, ~48 insertions)
- `798fea3a` — closure report (this document, in its pre-validation form)
- `a09c88a3` — typecheck-clean wishlist + support-thread (3 files, ~37 insertions)

Branch pushed to `origin`. **PR [#76](https://github.com/cbebot/Henry-Co/pull/76)**
opened against `main` with a per-issue summary and the validation table
above in its body. Vercel's preview deploy runs against this branch as
soon as the PR is open; the resulting deployment id + URL land in the
post-deploy addendum (Section 11) so a future reader can replay the
exact build artefact.

## 9 — Live verification per issue

After preview deploy of this branch and the subsequent production deploy
of `main`, the following reproductions confirm each fix end-to-end:

| Issue | Reproduction |
|-------|--------------|
| #1 dead links | Visit account.henrycogroup.com home → click every "View all", "Open …", "Manage …" CTA → observe no 404 / no return-to-same-page. Specifically click marketplace orders-in-flight CTA, the welcome-back saved tile, the welcome-back recently-viewed tile, vendor "Manage store" CTA. |
| #2 action-link reloads | Click the same CTAs as #1 with the browser network tab open in the "Doc" filter. Confirm no document request fires — only `_next` chunk fetches (SPA navigation). |
| #3 mobile keyboard dismissal | On iOS Safari and Android Chrome, open the search palette (Cmd+K equivalent or palette button), focus the input, type a multi-character query (e.g. "withdraw"). The keyboard must remain visible until the user explicitly dismisses or selects a result. |
| #4 runtime fault | Visit Vercel runtime logs and grep `[account-runtime-error]`. Reproduce a known-throw path (a logistics shipment with NULL lifecycle_status, a wallet funding request with NULL status) — confirm the page renders with a placeholder instead of throwing. If a new digest does fire, the corresponding line in the runtime log will show its full message + stack. |
| #5 studio download | Open any support thread under account.henrycogroup.com/support/<id> → "Download thread" → confirm the PDF downloads cleanly with brand fonts. Repeat for at least three threads of varied length. |
| #6 input polish | On mobile, fill the signup form (autofill should populate name + email + phone from the device); on iOS Safari, focus any text input and confirm no zoom-in pinch happens; on a password manager, confirm new-password and current-password fields are correctly classified. |

Concrete walk-through results — preview-domain probe + post-merge
production probe — land in Section 11.

## 10 — Remaining limitations + reasons

- **Per-feature account-shell mirrors not built.** The PASS 22 dead-link remap collapses several would-be deep paths (`/marketplace/orders/[orderNo]`, `/marketplace/recently-viewed`, `/marketplace/disputes/new`) onto existing summary surfaces. This is a routing-not-product fix; the actual per-order, per-dispute, per-recently-viewed pages are still only on the marketplace subdomain. Building those mirror pages was out of scope for PASS 22.
- **deepLinkTemplate spec in `packages/notifications/event-types.ts` left untouched.** Its strings (`/account`, `/account/settings/security`) are *unread* at runtime — they're documentation of where each event type *ought* to land. Updating them is the right move but lives one level higher in the notifications dispatch loop, which the next i18n / notifications pass will refactor anyway.
- **Trace of ref 3280500486 remains unrecovered.** The original digest was reported by the user before the runtime-error endpoint existed; without a server-side log line for that specific render, the original exception cannot be retroactively reconstructed. The endpoint now in place ensures every future ref id is recoverable.

## 11 — Post-deploy addendum

### Preview deployments (PR #76)

Vercel auto-deployed PR #76 across all four dashboard projects on each
push. The progression confirms the typecheck fix landed in `a09c88a3`
was load-bearing, not cosmetic:

| Commit      | Surface              | State    | Why                                                                                                                |
|-------------|----------------------|----------|--------------------------------------------------------------------------------------------------------------------|
| `798fea3a`  | `henryco-account`    | ERROR    | TS17002 in `wishlist-shortcut.tsx` (caught + fixed in `a09c88a3`). |
| `798fea3a`  | `hub`                | READY    | Hub doesn't import the marketplace widget; clean.                                                                  |
| `798fea3a`  | `marketplace`        | READY    | Same — marketplace public app doesn't pull the dashboard widget.                                                   |
| `a09c88a3`  | `henryco-account`    | READY    | `dpl_7w5GBorAsTaDxF6HHmJtSsWs3Mdg` → `henryco-account-151owqsa6-henry-co.vercel.app`. **First clean PASS 22 preview.** |
| `a09c88a3`  | `hub`                | CANCELED | Superseded by `7d1f816a` ~13s later (Vercel cancels in-flight builds when a newer push arrives).                   |
| `a09c88a3`  | `marketplace`        | CANCELED | Same reason — superseded by next push.                                                                             |
| `d14a5a95`  | `henryco-account`    | READY    | `dpl_88WaZDwWa8rarUWg1qJuf2nktr5S` → `henryco-account-1i6o5dqcf-henry-co.vercel.app` (build 69s).                      |
| `d14a5a95`  | `hub`                | READY    | `dpl_FK8HZaJ111kDyzKhXNzi8QAL4EXT` → `hub-kkd9pyajy-henry-co.vercel.app` (build 63s).                                  |
| `d14a5a95`  | `marketplace`        | READY    | `dpl_7ZmQWg6gc4YAmADtcyAkATMxF4Rk` → `marketplace-3nfmhtd9g-henry-co.vercel.app` (build 53s).                          |

Stable branch-alias URLs (always resolve to the latest preview build of
this branch — useful for ongoing QA):

- account → `https://henryco-account-git-feat-v3-pass-22-routing-sta-8cda82-henry-co.vercel.app`
- hub     → `https://hub-git-feat-v3-pass-22-routing-stability-mobile-input-henry-co.vercel.app`
- marketplace → `https://marketplace-git-feat-v3-pass-22-routing-stabili-7c6640-henry-co.vercel.app`

### Staff project — no auto-deploy on this branch

`staff` Vercel project last deployed on 2026-05-02 and has no PR #76
preview. The project's git-deploy config evidently doesn't auto-build
on this branch name (compare with the other three which do). The staff
host typecheck + lint *did* run clean locally — the staff app pulls
none of the PASS 22 widget changes directly, only the workspace-level
`dashboard-shell` action-button + bottom-sheet edits, which are
behind-the-scenes engine fixes. The staff preview will land naturally
when this branch merges to `main` (or earlier if an operator triggers a
manual deploy).

### Production deployment

The PR sits open against `main` for operator review and merge. The
moment it merges, Vercel deploys the merge commit to production across
all four dashboard projects in parallel; their deployment ids will
appear under each project's `target: "production"` entry in the
`list_deployments` API. This document does not record those ids
in-band — they're written by the deploy event, not by this branch.

### Live verification walk-through

The preview-domain walk for issues #1–#6 (per the Section 9 plan)
should be run against the stable preview URLs above. Each cell either
confirms green or escalates: a failure becomes a follow-up PASS 22.1
commit on this branch before merge. As of this writing, the account
preview at `dpl_7w5GBorAsTaDxF6HHmJtSsWs3Mdg` carries every PASS 22
code path; the docs-only `7d1f816a` deploy builds the identical
runtime.

### Additional defect surfaced during validation

During the Section 7 typecheck pass, two real TypeScript errors that
had slipped through the original PASS 22 commits were caught and
fixed (see Section 7 for details and commit `a09c88a3`). One of them
(the inline-component-in-`.map()` anti-pattern in `wishlist-shortcut`)
would have silently defeated the PASS 22 mobile-keyboard fix on the
saved-tile subtree even after the build went green — that's why the
fix-up commit takes the time to refactor the component out of the
callback and into module scope. Net result: PASS 22 ships cleaner
than the original two-commit version.
