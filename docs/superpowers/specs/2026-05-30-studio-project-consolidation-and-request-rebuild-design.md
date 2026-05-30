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

### Canonical surfaces after change

| Audience | Route | Auth | Renders |
|---|---|---|---|
| Logged-in client | `/client/projects/[id]` | login-gated (unchanged) | premium tabbed portal |
| No-login client (post-pay / email) | `/project/[id]?access=KEY` | access-key, no login | **same** premium view (read-only twin) |
| Staff cockpit | `/pm/projects/[id]` **(new)** | staff role | the relocated 734-line action workspace |

`/project/[id]` is **not deleted**. It becomes a smart router + the no-login twin:

```
/project/[id] server entry:
  viewer = getStudioViewer()
  if viewer.isStaff           -> redirect /pm/projects/[id]
  if viewer.user owns lead    -> redirect /client/projects/[id]   (full chrome)
  else if valid ?access=KEY   -> render shared read-only project view (NO login)
  else                        -> getStudioLoginUrl(next=/client/projects/[id])
```

### Why keep `/project` instead of one literal route (owner's option 3)

`/client/*` forces login at the **layout** level (CHROME-01A: never serve a
cached unauthenticated render in the account portal — a real security boundary).
Routing the no-login money/email links through `/client/*` would bounce a
just-paid anonymous customer to a sign-in wall and **drop the access key**,
violating the money-truth invariant. Keeping `/project/[id]` as the access-key
door preserves no-login without weakening the account portal. This satisfies the
owner's option 2 ("make it the same as /clients") — identical rendering, two doors.

### Email + CTA repointing

| Emitter | Before | After | No-login? |
|---|---|---|---|
| `payment_instructions`, `payment_reminder` emails | `/pay/[id]?access=` | **unchanged** | yes |
| pay-page "Open project workspace" CTA | `/project/[id]?access=` | `/project/[id]?access=` (now premium twin) | yes |
| status / update emails | `/project/[id]?access=` | `/project/[id]?access=` (premium twin) | yes |
| PM dashboard + PM list + delivery dashboard | `/project/[id]?access=` | `/pm/projects/[id]` | staff |
| `scripts/smoke-studio.mjs:34` | `/project/[id]` | keep (validates twin) | n/a |

### Flagged decision (owner veto point)

Keep `/project/[id]` alive as the no-login twin rather than literally deleting it,
because deleting forces post-payment customers through a login wall. If the owner
wants exactly one route name and accepts post-payment login friction, that's a
follow-up requiring rework of the account-portal layout gate.

### Implementation steps (Job A)

1. Extract the client project view into a shared presentational component
   consumed by both `/client/projects/[id]` (authed) and `/project/[id]`
   (access-key). Reuse existing portal components (`PortalTabBar`,
   `StudioMessageThread`, `MilestoneProgress`, `FileCard`, `ActivityFeed`,
   `StatusBadge`, `PortalEmptyState`).
2. Create `app/pm/projects/[projectId]/page.tsx` — relocate the staff cockpit
   (move the `isStaff` branch + action tools from `/project/[id]`). Keep the
   rich workspace component; gate on staff role; redirect non-staff to
   `/client/projects/[id]`.
3. Rewrite `app/project/[projectId]/page.tsx` as the smart router + no-login twin
   per the pseudocode above.
4. Repoint PM dashboard, PM list, delivery dashboard links → `/pm/projects/[id]`.
5. Leave money emails on `/pay`. Status/update emails stay on `/project` twin.
6. Update `scripts/smoke-studio.mjs` if needed.

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
