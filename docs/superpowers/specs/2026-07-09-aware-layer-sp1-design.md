# The Aware Layer — SP1: role-aware chrome & CTAs

**Date:** 2026-07-09 · **Owner directive:** "smart features across the whole ecosystem…
a nav button changes depending on the user's role" · **Status:** SP1 build.

## The problem, precisely

Division surfaces recruit people who are already in. A signed-in **seller** on
marketplace `/sell` still sees "Open seller application". An **employer** on jobs
still sees "I'm hiring" as if they weren't. Each CTA is hardcoded per page, so
every fix would be a local patch — and the next page regresses.

## The shape of the fix

One tested decision engine — **`@henryco/aware`** — that answers a single
question for every division surface: *what is this viewer to this division, and
therefore what belongs in the chrome?*

```
standing  =  visitor | customer | applicant(track) | operator(track) | staff
plan      =  resolveChromePlan(division, standing)
          →  { primaryCta, aside, workspace, recruit }
```

- **Pure TS, no I/O.** Apps already know who the viewer is (marketplace
  `viewer.roles`, jobs `viewer.roles`); the package owns only the *policy* —
  the who-sees-what matrix — so it can be table-tested exhaustively.
- **`standingFromRoles`** adapts each app's role vocabulary (declared per
  division as a typed vocab constant) into the standing lattice with fixed
  precedence: `staff > operator > applicant > customer > visitor`.
- **Plans carry EN label + division-local href.** Apps localize labels through
  their existing `translateSurfaceLabel` path (Principle 12: packages never
  hardcode rendered strings — they hand them to the app's `t()`).

## Invariants (tested)

1. **Never recruit an operator.** For every division, the operator/staff plan
   contains no application-flavoured action (`apply`, `application`, `become`,
   `start selling`, `i'm hiring`).
2. **Applicants track, not re-apply.** Where a division has an applicant state
   (marketplace `vendor_applicant`), the plan points at status, not the form.
3. **Precedence is total** — every (division × standing) resolves; missing
   `applicant`/`staff` rows fall back to `customer` (never to `operator`).
4. **Hrefs are division-local** (`/…`); cross-app URLs (auth, account) stay the
   app's job — the chrome identity cluster already owns Sign in / Get started.
5. **Voice holds** — labels are calm-authority, no exclamation, no urgency.

## SP1 proving ground (this PR)

- `packages/aware` + full test suite.
- **Marketplace** (the owner's exact example): `/sell` hero + home "Sell on
  Henry Onyx" become standing-aware — vendor → "View your vendor workspace"
  (`/vendor`), vendor_applicant → "Track your seller application", customer /
  visitor → today's apply CTA. Sign-in ghost CTA hides for signed-in viewers.
- **Jobs**: shell primary/aux become standing-aware — employer → "Your employer
  workspace" (`/employer`) with "Browse open jobs" aside; candidates keep the
  candidate hub; `/hire` recruit CTA flips to the workspace for employers.
- `AccountDropdown` gains additive `workspaceLabel` so the workspace item can
  read "Your vendor workspace" / "Your employer workspace".

## Later (SP2+, tracked)

Continue-where-you-left-off chips off `@henryco/lifecycle`; role-aware empty
states; palette actions; remaining divisions adopt as their PRs land.
