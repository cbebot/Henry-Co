# Studio Brief Composer — design (owner-approved)

Date: 2026-07-03
Status: APPROVED (owner) — implementation branch `feat/studio-brief-composer`
Surface: `apps/studio/app/request/build` only. The `/request` landing keeps the
existing 4-step wizard (`StudioRequestBuilder`) unchanged this pass.

## Intent

Flip `/request/build` from a form-to-fill (4-step wizard; the Scope step alone
stacks 30+ inputs) into **a brief you review**. Most visitors arrive with the
brief already AI-drafted — the chat coach, co-pilot, and guided interview all
stage a draft in localStorage (`studio-brief-new`, envelope v1) and navigate
here. The page should read as their brief, priced honestly, with calm ways to
adjust each part.

## One screen, no wizard

1. **Six section cards** in the main column:
   - **Project** — pathway / package / serviceKind / projectType / platform /
     design / preferredLanguage
   - **Scope** — pages / features / add-ons
   - **Stack** — programming language / framework / backend / hosting /
     tech preferences
   - **Business & timeline** — businessType / budgetBand / urgency / timeline
   - **Domain** — the `StudioDomainLaunchSection` (intent JSON)
   - **Goals & notes** — goals / scopeNotes / inspirationSummary

   Each card renders its current state as calm prose + priced chips (reusing
   the pricing-config lookups the steps already use). A card with data starts
   COLLAPSED (summary + "Adjust"); an empty card sits OPEN. "Adjust" expands a
   focused editor containing ONLY that section's existing controls — reusing
   the existing step components' internals (StudioListbox, PricedCheckboxList,
   StudioDomainLaunchSection, textareas) by extracting/importing rather than
   rewriting. Every input `name` stays identical.

2. **Sticky right rail** (compact fixed bar on mobile): the live
   honest-pricing panel (client-side `estimateStudioPricing`, same wiring as
   the wizard), a readiness/progress hint, and the submit block — team
   listbox, reference links/files, contact fields, depositNow checkbox,
   submit button (the current activation step's real inputs).

3. **"Describe a change"** — a calm one-line box above the cards. The user
   types e.g. "make it 3 pages and add booking" → the client calls the
   existing FREE one-shot action `generateStudioBriefDraftAction` with
   `description` composed as:

   ```
   CURRENT BRIEF:
   <compact JSON of the current draft's brief-relevant fields>

   REQUESTED CHANGE:
   <user text>

   Return the FULL updated brief.
   ```

   On `{ok: true, structured}` compute the field-level DIFF vs the current
   draft (structuredToDraft overlay semantics), show a small preview list
   ("Pages: 6 → 3 · adds Booking") with Apply / Discard; Apply patches the
   draft envelope (which re-prices live). On `{ok: false}` show
   `result.message` verbatim — the action already returns honest, calm copy.
   Disable while pending. The surface is FREE with server-side caps; the
   client invents no limits of its own.

## Preserve bit-for-bit (the money spine)

- `submitStudioBriefAction` stays the form action with the SAME always-mounted
  hidden-input mirror of every contract field (copied from
  `request-builder.tsx`): preferredTeamId, serviceKind, packageIntent,
  packageId, designDirection, preferredLanguage, programmingLanguage,
  frameworkPreference, backendPreference, hostingPreference, projectType,
  platformPreference, businessType, budgetBand, urgency, timeline, goals,
  scopeNotes, inspirationSummary, domainIntentJson, plus one hidden input per
  selected item of pageRequirements / requiredFeatures / addonServices /
  techPreferences.
- Server-side re-pricing untouched. Editor controls in the composer carry NO
  contract `name` for multi-value fields (the action reads them via
  `getAll`; a mounted named checkbox would double-count into pricing). The
  mirror is the single posting source for draft-backed fields; contact fields,
  referenceLinks/referenceFiles and depositNow remain real named inputs.
- Draft envelope key / version / shape untouched (`studio-brief-new`, v1,
  25-field `StudioBriefDraft`). `stepIndex` stays in the type, clamped but
  unused for navigation — old drafts and all on-ramps keep working (chat and
  guided save the draft with `stepIndex: 1` then navigate here; the landing
  passes `copilotSeed` + skipRestore).
- Validation logic reused (`validateStep`) but surfaced as per-section badges
  instead of step-jumping; the submit-time validateStep sweep stays — failures
  map to the owning SECTION card, open it, and scroll to the first error.

## Component architecture (new files under `apps/studio/components/studio/brief-composer/`)

- `brief-composer.tsx` (client) — the shell: draft state (same `useFormDraft`
  wiring as the wizard), pricing memo, section registry, describe-a-change,
  submit form with hidden mirror. Rendered by `app/request/build/page.tsx` in
  place of `StudioRequestBuilder`. The `/request` landing (request-landing.tsx)
  also mounts the wizard — that surface is left UNCHANGED this pass.
- `sections.ts` (PURE, TDD, tsx --test) — the section model:
  - `COMPOSER_SECTIONS` — 6 sections: key + which draft fields belong to it
    (covers every brief field of the draft except `stepIndex` and
    `selectedTeamId`, which lives in the submit block).
  - `sectionSummary(section, draft, ctx)` — short prose summary parts for the
    collapsed card (copy through an injected `t`).
  - `sectionIsComplete(section, draft)` — drives collapsed vs open + badges.
  - `sectionForErrorKey(errorKey)` — maps `validateStep` error keys to the
    owning section card.
  - `diffStructuredAgainstDraft(structured, draft)` →
    `Array<{field, from, to}>` for the AI-revise preview (overlay semantics;
    includes a `serviceKind` follow-on change when the projectType change
    implies a different service kind).
  - `composeChangeDescription(draft, request)` — the composed action input,
    kept within the action's 1600-character ceiling.
- `section-card.tsx`, `section-editors.tsx`, `describe-change.tsx`,
  `pricing-rail.tsx`, `submit-block.tsx` — client pieces extracted from the
  existing step files, preserving input names + the `studio-panel` /
  `studio-input` visual language and the existing i18n pattern (every string
  through `translateSurfaceLabel` `t`).

## Hard rules

- No gateway/package changes (`packages/ai-gateway` untouched — the AI revise
  composes the EXISTING action). No new dependencies. Provider/model never
  named anywhere. Calm-authority voice, no exclamation marks. `.hc-prose`
  never carries colour.

## Gates

`pnpm --filter @henryco/studio run typecheck` · `run lint` · `run build` ·
root `pnpm tone:check` · `pnpm i18n:check:strict` ·
`pnpm --filter @henryco/studio exec tsx --test
components/studio/brief-composer/sections.test.ts
lib/studio/ai-runtime.test.ts lib/studio/brief-chat-roundtrip.test.ts
lib/studio/brief-copilot-structured.test.ts`.
