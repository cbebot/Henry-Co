# Studio — Project-Page Consolidation + `/request` Rebuild

**Date:** 2026-05-30
**Author:** Claude (self-authored prompt, per owner mandate "write the prompt you need and execute")
**App:** `apps/studio` (live: studio-three-beige.vercel.app, Vercel)
**Branch:** `studio/project-consolidation` (worktree off `origin/main` @ bd6b45da)

---

## Why

Two independent problems on the live Studio app:

- **Job A — duplicate project surfaces + wrong post-payment landing.** One route
  (`/project/[id]`) is doing three jobs with three auth models: no-login client
  (access-key), authed lead-owner, and staff action cockpit. After payment, the
  "Open project workspace" CTA lands customers on this generic surface instead of
  the premium `/client/projects/[id]` portal. The owner wants one canonical client
  surface and the staff cockpit given its own home.
- **Job B — `/request` brief composer needs a from-scratch premium rebuild.**
  Same data/pricing/AI engine, reinvented visual layer: expensive, structured,
  intelligent, zero hardcoded prices/option-lists.

Money flows through both areas. The governing constraint: **never regress the
no-login money-truth path** (memory: `feedback_payments_money_truth`) and **never
serve a giant viewport hero** (memory: `feedback_no_giant_hero_text`).

---

## Current state (verified by inspection)

| Route | Lines | Auth | Audience |
|---|---|---|---|
| `app/project/[projectId]/page.tsx` | 734 | access-key OR authed lead OR `isStaff` | triple-duty |
| `app/client/projects/[projectId]/page.tsx` | 626 | login-gated at **layout** (CHROME-01A) | premium tabbed portal |
| `app/pm/projects/page.tsx` | 38 | staff | list → links into `/project/[id]?access=` |
| `app/pm/page.tsx` | 65 | staff | dashboard → links into `/project/[id]?access=` |
| `app/delivery/page.tsx` | — | staff | links into `/project/[id]?access=` |
| `app/pay/[paymentId]/page.tsx` | 197 | access-key OR authed | money surface; CTA → `/project/[id]` |
| `app/pm/projects/[projectId]/` | — | — | **does not exist** |

`isStaff` roles in `/project/[id]`: `studio_owner, sales_consultation,
project_manager, developer_designer, client_success, finance`.

Deep-link emitters of `/project/${id}?access=`: `lib/studio/email/send.ts`
(9 builders), `lib/studio/store.ts` (activity-feed `actionUrl`),
`lib/studio/actions.ts`, `scripts/smoke-studio.mjs:34`.

---

## Job A — design

### Principle: extract the view, give each audience its own door

The duplication is one route with three auth models. Fix = collapse the
**rendering** into one shared presentational view, then route each audience to
its own door without forcing them all through the same auth gate.

### REVISED after reading the code: bridge, not merge

Reading both surfaces showed they are **different subsystems**, not one view in
two skins:

| | `/project/[id]` | `/client/projects/[id]` |
|---|---|---|
| Loader | `getProjectWorkspace` (access-key capable) | `getClientProjectDetail` (auth-scoped) |
| Auth | access-key OR authed OR staff | login-gated at **layout** (CHROME-01A) |
| Money unit | major units (`formatCurrency`) | kobo (`formatKobo`) |
| Pay route | `/pay/[paymentId]?access=` | `/client/payment/[invoiceId]` |
| Layout | single-scroll + staff tools | tabbed portal |

Merging their *rendering* would be a large, risky refactor on a live money app —
violating `clean-works-over-bulk` and `payments-money-truth`. The owner's concrete
pain is narrower: **post-payment authed users land on `/project` instead of the
nice `/client` portal.** The right fix is a **smart bridge**, not a merge.

### Canonical surfaces after change

| Audience | Route | Auth | Renders |
|---|---|---|---|
| Logged-in **owner** | `/client/projects/[id]` | login-gated (unchanged) | premium tabbed portal |
| No-login client (post-pay / email) | `/project/[id]?access=KEY` | access-key, no login | existing rich workspace (unchanged) |
| Authed non-owner via shared `?access=` link | `/project/[id]?access=KEY` | access-key | existing rich workspace (unchanged) |
| Staff cockpit | `/project/[id]` | staff role | existing workspace + staff tools (unchanged) |

`/project/[id]` gains ONE early decision at the top:

```
/project/[id] server entry:
  viewer    = getStudioViewer()
  workspace = getProjectWorkspace({ projectId, accessKey, viewer })
  if !workspace -> (existing login-bounce / notFound)
  if viewer.user && !isStaff && workspace.viewerOwnsViaAuth:
      redirect /client/projects/[id]            // authed owner -> canonical portal
  ...render existing workspace (covers: no-login access-key, shared link, staff)
```

`viewerOwnsViaAuth` is a new boolean returned by `getProjectWorkspace`, derived
from the ownership terms the loader *already* computes (user-id / email / lead
match) — NOT from the access-key term. This is the precise distinction that keeps
a shared `?access=` link working for a logged-in non-owner.

### Why this is correct for every case

- **No-login + `?access=`** (post-pay, email): `viewer.user` falsy → no redirect →
  renders in place. Money path untouched.
- **Authed owner** (clicks pay CTA / portal / email and owns it): redirect to
  `/client/projects/[id]`. Fixes the owner's pain.
- **Authed non-owner via shared link**: `viewerOwnsViaAuth` false → no redirect →
  renders access-key view. Shared-link sharing preserved.
- **Staff**: `isStaff` true → no redirect → staff cockpit. Unaffected.

### What does NOT change (bridge centralizes the decision)

- Pay-page "Open project workspace" CTA stays `/project/[id]?access=` — the bridge
  routes authed owners onward.
- Email deep links + `store.ts` activity `actionUrl` stay `/project/[id]?access=`
  — same bridge.
- PM dashboard / PM list / delivery links stay `/project/[id]?access=` — staff are
  never redirected.
- `scripts/smoke-studio.mjs` — unchanged.
- No staff relocation, no component extraction, no data-unit changes.

### Flagged decision (owner veto point)

This delivers "one canonical page for authed clients" (`/client`) while keeping
`/project` as the no-login + staff mechanism. It does NOT literally delete
`/project` (still load-bearing for no-login money + staff) and does NOT port the
no-login view into the tabbed portal (would require auth-gated `getClientProjectDetail`
to run without auth — a large, risky change). If the owner wants the no-login
post-payment view to *also* be the tabbed portal, that's a larger follow-up.

### Implementation steps (Job A)

1. `lib/studio/data.ts` — extract the auth-ownership terms in `getProjectWorkspace`
   into `ownsViaAuth` and return it as `viewerOwnsViaAuth`.
2. `app/project/[projectId]/page.tsx` — compute `isStaff` early; after the
   workspace null-check, redirect authed non-staff owners to
   `/client/projects/[id]` (preserve `?tab=` if present). Render unchanged otherwise.

### Preserve

- Access-key HMAC mechanics (`projectAccessKey`, `projectMatchesAccess`).
- `/pay/[id]?access=` money surface — untouched.
- All staff actions (`setMilestoneStatusAction`, `completeRevisionAction`,
  `addDeliverableAction`, `createProjectUpdateAction`, `appendProjectMessageAction`).

---

## Job B — `/request` rebuild

### Principle: reinvent the view, preserve the engine

Rebuild the visual/component layer; keep the data + action contract byte-for-byte.

**Preserve (do not touch the wiring):**
- `lib/studio/request-config.ts` (952-line catalog) — all options/prices come from here.
- `estimateStudioPricing(input, config)` — single pricing source, runs client + server.
- `submitStudioBriefAction(formData)` — exact form field names are load-bearing
  (`serviceKind`, `packageIntent`, `packageId`, `designDirection`,
  `preferredLanguage`, `programmingLanguage`, `frameworkPreference`,
  `backendPreference`, `hostingPreference`; multi-checkbox `pageRequirements`,
  `requiredFeatures`, `addonServices`, `techPreferences`; `budgetBand`,
  `domainIntentJson`, `referenceLinks`×3, `referenceFiles`, `customerName`,
  `companyName`, `email`, `phone`, `depositNow`).
- Co-pilot: `generateStudioBriefDraftAction` → `BriefCopilotStructured` →
  `copilotSeed` (re-mount with new `key`, `skipRestore`, `effectiveX` reconcile).
- Draft persistence: `useFormDraft<StudioBriefDraft>("studio-brief-new")`.
- Page-level short-circuits already in `app/request/page.tsx` (`?paymentId=`,
  `?path=templates`, path priority).

**Rebuild (the look/feel/structure):** `request-landing`, `request-builder`, the
4 step panels (`request-path-step`, `request-scope-step`,
`request-commercial-step`, `request-activation-step`), `request-side-panel`,
`brief-copilot-panel`.

### CRITICAL FINDING — the current form silently drops most of the brief

Verified by inspection across `request-builder`, all 4 step panels,
`useFormDraft`, and `submitStudioBriefAction`:

- The builder renders ONE step at a time — `{stepIndex === N ? <Step/> : null}`
  unmounts the other three.
- The only submit control (`StudioSubmitButton`) lives in step 3 (Activation).
- A React `<form action={serverAction}>` builds its `FormData` from the form
  controls in the DOM **at submit time**. Unmounted steps' inputs are absent.
- The form shell mirrors only **10 single-value** fields as always-present hidden
  inputs (`preferredTeamId, serviceKind, packageIntent, packageId,
  designDirection, preferredLanguage, programmingLanguage, frameworkPreference,
  backendPreference, hostingPreference`).
- `useFormDraft` persists the full envelope to localStorage but never bridges it
  back into the form — it cannot rescue the missing fields.

Therefore, submitting from step 3, these never reach `submitStudioBriefAction`:
`projectType, platformPreference, pageRequirements, requiredFeatures,
addonServices, techPreferences, businessType, budgetBand, urgency, timeline,
goals, scopeNotes, inspirationSummary, referenceFiles, domainIntentJson`.

The loss is **silent**: the action defaults every field
(`String(get(x) || "")` / `|| null` / `asList → []`), so the submit still
"succeeds" and redirects to `/pay`/`/proposals` with an near-empty lead. This is
a money/lead-integrity bug, and it makes the rebuild a correctness fix, not only
a reskin. (Was likely introduced when V3-01 refactored the form to a stepwise
draft envelope.)

### Submission architecture (the fix, folded into the rebuild)

Premium UX and the fix are the same artifact: the final step becomes a
**Review & Send** summary that restates every choice + the live price, rendered
from the draft envelope — so every field is present in the DOM at submit *by
construction*.

- **Form shell (always mounted):** hidden inputs mirroring EVERY envelope field —
  scalars as one input each, multi-values (`pageRequirements`, `requiredFeatures`,
  `addonServices`, `techPreferences`, `referenceLinks`) as N inputs each, plus
  `domainIntentJson`. Driven by `draft.value`, so it is complete regardless of
  which step is visible.
- **Visible step panels (presentational):** controlled (`value`/`onChange` →
  envelope), with NO `name=` on fields the shell already mirrors — avoids
  duplicate form entries (which would double-count multi-values). The shared
  `StudioListbox`/`PricedCheckboxList` gain an optional/absent `name` =
  "presentational mode."
- **Review step (step 3, the submit step):** the live `<input type="file"
  name="referenceFiles">` (files cannot be mirrored as hidden inputs) and the
  contact fields (`customerName` required, `companyName`, `email` required,
  `phone`, `depositNow`) as live inputs, since this step is mounted at submit.
- Net: `FormData` at submit = full envelope (shell) + files + contact (review).
  Nothing drops. Contract field names preserved byte-for-byte.

### Layout (no-giant-hero rule)

```
┌────────────────────────────────────────────────────────────┐
│  STUDIO BRIEF · kicker        Two lanes ▸ Co-pilot | Build   │  compact header
│  Tell us what you need. Pricing appears as you choose.        │  h1 ≤ clamp(1.7,3.6vw+.6,3.2rem)
├──────────────────────────────────────┬─────────────────────┤
│  STEP RAIL ① Path ② Scope ③ Commercial ④ Activation          │
│ ┌──────────────────────────────────┐ │  ┌────────────────┐ │
│ │ Active step (progressive          │ │  │ INVESTMENT      │ │  sticky live rail
│ │ disclosure; done steps collapse   │ │  │ ₦ total          │ │  real estimateStudioPricing
│ │ to a summary chip)                │ │  │ deposit 30%      │ │  numbers, same paint
│ └──────────────────────────────────┘ │  │ line items       │ │
│  [ Co-pilot: describe it → drafts ]   │  │ readiness band   │ │
└──────────────────────────────────────┴─────────────────────┘
```

### Design language

Studio tokens only: `--studio-ink`, `--studio-ink-soft`, `--studio-signal`
(#97f4f3), `--studio-surface`, `--studio-line`; glass via `color-mix`; utility
classes `studio-panel`, `studio-kicker`, `studio-button-primary`, `studio-input`,
`studio-textarea`. Every label/price via i18n + catalog — zero hardcoding.
Motion: calm, intentional; live number transitions; step chips collapse.

### Validation

- `pnpm --filter @henryco/studio typecheck` + `build` clean.
- No-login money flow manually traced (pay → CTA → twin renders, no login).
- Staff cockpit reachable at `/pm/projects/[id]`; non-staff redirected.
- `/request`: each choice updates Naira live; co-pilot seeds builder; submit
  reaches `submitStudioBriefAction` with all fields; draft persists/clears.

---

## Sequencing (clean-works-over-bulk)

1. **Job A first** — coherent bug-fix/consolidation unit. Implement → verify →
   present diff.
2. **Job B second** — bigger, riskier rebuild. Separate logical unit.
3. Merge/squash to `main` per owner authorization → Vercel auto-deploys.

## Out of scope

- Reworking the account-portal layout login gate (CHROME-01A).
- New share-incentive / referral mechanics.
- Pricing-engine or submission-cascade logic changes.
