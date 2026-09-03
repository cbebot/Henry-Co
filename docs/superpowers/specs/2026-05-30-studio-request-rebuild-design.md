# Studio `/request` Rebuild — Design Spec

- **Date:** 2026-05-30
- **Status:** Awaiting owner review (no implementation has started)
- **Surface:** HenryCo Studio brief composer — live at `https://studio-three-beige.vercel.app/request`
- **Scope anchor (owner directives, verbatim):**
  - "you have to do everyhting .use your max effort"
  - "building both will be more ok. do it magnificantly. you can seprate them into diffrent pages and sub pages if necessary"

This is a **structural rebuild**, not cosmetic polish. The owner has chosen the maximal scope: fix all four defects (A, B, D, E) and build **both** co-pilot flavors as separate on-ramps.

---

## 1. The four defects

| ID | Defect | Root cause (verified in code) |
|----|--------|-------------------------------|
| **B** | A user can submit a near-empty brief and never know it was incomplete. | `request-builder.tsx` only disables Continue when `pathway === "package" && filteredPackages.length === 0`. No per-step required-field gating. Multi-selects default to `[]`, which the server action treats as valid. |
| **D** | The builder shows the same fields regardless of what's being built (a branding job still sees "pages" and "hosting"). | The fields are rendered statically. Yet the config **already** tags every option with `serviceKinds?` — the data to branch on exists and is unused for disclosure. |
| **E** | The co-pilot is single-shot: one paragraph → one LLM call → auto-apply. No conversation, no follow-up questions. | `generateStudioBriefDraftAction` is a one-shot action; `BriefCopilotPanel` calls it once and applies the result. |
| **A** | Structural duplication; the owner's "maybe some url redirection are wrong" hunch. | "Package vs custom" is asked **twice** (landing tiles → then the PATH step "BUYING LANE" toggle). Three package-like surfaces compete (in-builder `services` cards, in-builder `packages`, and the `/pick` templates link). |

### Defect A — redirect audit result (important)

The redirects the owner suspected are **correct, not broken**:

- `/pick` **exists** at `app/(public)/pick/` (+ `[slug]` detail). It was a false negative in an earlier audit because the `(public)` route group hides it from a literal `app/pick/` search.
- `?path=templates → /pick` ✅ · `?paymentId → /pay/[id]` ✅ · `/pick/[slug] → /checkout/template/[slug]` (buy fixed-price product) vs `/request?template=[slug]` (author a custom brief) ✅ — a deliberate, sound fork between fixed-price products and variable-scope briefs.

**The real defect A is duplication inside `/request`, not a wrong URL.**

---

## 2. Verified ground truth (the design rests on these facts)

- **Sacred submission contract** — `submitStudioBriefAction` (`lib/studio/actions.ts`) consumes these exact FormData field names; any new surface MUST emit identical `name=`s:
  `customerName, companyName, email, phone, serviceKind, businessType, budgetBand, urgency, timeline, goals, scopeNotes, packageIntent ("package"|"custom"), packageId, preferredTeamId, referenceLinks[], techPreferences[], requiredFeatures[], projectType, platformPreference, preferredLanguage, programmingLanguage, frameworkPreference, backendPreference, hostingPreference, designDirection, pageRequirements[], addonServices[], inspirationSummary, depositNow (checkbox "on"), domainIntentJson, referenceFiles[]`.
  Post-submit redirects: project+payment → `/pay/{id}?access=…`; project → `/project/{id}?access=…`; else → `/proposals/{id}?access=…`.
- **Money is absolute** — `estimateStudioPricing` / `StudioPricingSummary` (`lib/studio/pricing.ts`) reused **untouched**. English option labels remain the canonical pricing keys.
- **Draft bridge** — `useFormDraft` (`@henryco/lifecycle/drafts`) is **localStorage-primary + sessionStorage-mirror**, SSR-safe, keyed by a stable string, schema-`version` guarded, 24h staleness. The studio brief persists under key `"studio-brief-new"` as a `StudioBriefDraft` envelope (24 fields). This hook was built for V3-01's reauth round-trip — i.e., to carry form state across a navigation. That is exactly the bridge this design needs.
- **`StudioBriefDraft` shape** (the canonical in-flight state, `request-builder.tsx:41`): `stepIndex, serviceKind, pathway, selectedPackageId, selectedTeamId, selectedProjectType, selectedPlatform, selectedDesign, preferredLanguage, selectedPages[], selectedModules[], selectedAddOns[], selectedTech[], selectedProgrammingLanguage, selectedFramework, selectedBackend, selectedHosting, businessType, budgetBand, urgency, timeline, goals, scopeNotes, inspirationSummary`.
- **Co-pilot** — `generateStudioBriefDraftAction` (`lib/studio/brief-copilot-action.ts`): one real Anthropic call (Haiku `claude-haiku-4-5-20251001`), rate-limited (anon 5/session, auth 20/day, ip 10/day, system 500/day), SHA-256 dedup (24h), deterministic `buildFallbackStructured` keyword parser when no `ANTHROPIC_API_KEY`, Supabase `studio_brief_drafts` persistence. Returns `BriefCopilotStructured`.
- **Adaptive data** — `request-config.ts` `projectTypes / platformOptions / pageOptions / moduleOptions / addOnOptions / frameworkOptions / backendOptions / urgencyOptions / timelineOptions` are all `serviceKinds`-tagged; `filterPricedOptions` / `filterModifierOptions` already filter by serviceKind. This is the engine for defect D.

---

## 3. The unifying idea

**One adaptive question-graph, three on-ramps, one submit.**

- D and E are the **same mechanism** seen two ways. D = "only ask questions relevant to this serviceKind." E = "ask those questions one at a time, conversationally." A single serviceKind-driven question model powers both.
- A is solved by demoting "package" from a *pre-question* to a *recommendation*: nobody declares package-vs-custom up front; if the answers match a `StudioPackage`, the side panel offers it (and accepting sets `packageIntent="package"` + `packageId` for the contract).
- B is solved by gating every on-ramp's progression on a per-step, per-serviceKind required-field schema, with unmissable mobile-first inline errors.

---

## 4. Architecture — routes (the "separate pages" the owner asked for)

```
/request                 → Hub. Choose an on-ramp (3 cards) + link to /pick. No lane re-ask.
/request/copilot         → Flavor A: real multi-turn AI chat.
/request/guided          → Flavor B: scripted-adaptive interview (deterministic branching).
/request/build           → Manual power-builder. THE single submit surface.
/pick (unchanged)        → Ready-made templates (linked from hub, not duplicated).
```

- **`/request` (hub).** Calm, compact (no giant hero). Three on-ramp cards + a secondary "Know exactly what you want? Browse ready-made templates → `/pick`". This is the **only** place a path is chosen. The redundant in-builder "BUYING LANE" toggle is removed.
- **`/request/copilot` (Flavor A — real chat).** Multi-turn conversation. New server action `continueStudioBriefChatAction` takes typed `ChatTurn[]` history + the new user message, calls Anthropic with a prompt-cached system prompt, returns the assistant's next message + a structured-brief delta. Turn budget (≈12) with graceful "let's wrap up", reusing/extending the existing rate-limit ladder. Deterministic fallback (scripted prompts) when no API key. On "this looks right" → maps the accumulated structure to a full `StudioBriefDraft`, writes it, routes to `/request/build`.
- **`/request/guided` (Flavor B — interview).** Pure client question-graph: focused questions, chip / short-text answers, instant per turn (no per-turn LLM). Branches on serviceKind + prior answers. At the end, **one** `generateStudioBriefDraftAction` synthesis call turns the answers into `BriefCopilotStructured` (deterministic fallback already exists) → writes the draft → routes to `/request/build`.
- **`/request/build` (manual + review).** Today's `StudioRequestBuilder`, refactored: full fields, now with adaptive progressive disclosure (D) and per-step gating (B). It owns the **only** `<form action={submitStudioBriefAction}>`. Chat and interview hand off here for a final pre-filled review before submit.
- **Legacy deep-links preserved.** `?paymentId → /pay/[id]`; `?path=templates → /pick`; `?path=custom → /request/build`; `?template= / ?preset= / ?team=` resolve into the builder via the existing preset logic; bare `/request` → hub.

---

## 5. The shared-draft bridge (one submit, zero contract drift)

- All three on-ramps converge on a single `StudioBriefDraft` under key `"studio-brief-new"`, **version 1, shape unchanged** — so no in-flight drafts are invalidated.
- Chat and interview keep their own conversation/answer state under **separate** keys (e.g., `"studio-copilot-chat"`, `"studio-guided-answers"`); only the **final** structured result is written to the brief draft.
- A single shared helper `structuredToDraft(structured, config, services)` maps `BriefCopilotStructured` → full `StudioBriefDraft`, centralizing the `initial*` fallback logic currently inlined in the builder. Chat, interview, and the legacy seed path all use this one mapping → no drift.
- `/request/build` restores the draft normally (not `skipRestore`) and renders review → submit.
- The FormData field names are extracted into one module — `REQUEST_FIELD_NAMES` — referenced by every surface and hidden input, so the contract has a single source of truth.

---

## 6. Defect fixes in detail

### B — unmissable gating
- A per-step, per-serviceKind **required-field schema**. Continue/Submit is disabled until the current step is satisfied; errors render inline at field level, mobile-first (scroll-to-first-error, `aria-invalid`, polite live region).
- Multi-selects that make the brief meaningless when empty get an explicit "pick at least one".
- Required sets (initial proposal, tuned in the plan): **Path** → serviceKind; **Scope** → the serviceKind-relevant required selections (+ tech stack where the kind needs it); **Commercial** → `goals`, `scopeNotes`, plus `budgetBand` / `urgency` / `timeline`; **Activation** → `customerName`, `email`.

### D — adaptive branching
- serviceKind is established as the **first step inside each on-ramp**, never on the hub (the hub only picks the on-ramp). The chat asks it conversationally; the interview makes it Q1; the manual builder keeps the `services` cards as its opening step. So serviceKind is asked exactly once per session.
- The Scope step renders only options whose `serviceKinds` include the chosen kind (`filterPricedOptions` already does this); sections are progressively disclosed with framer-motion, gated by `prefers-reduced-motion`.
- Package is a **side-panel recommendation** when answers match a `StudioPackage`; accepting sets `packageIntent="package"` + `packageId`.

### E — conversational co-pilot (both flavors)
- **A (chat):** `continueStudioBriefChatAction` — typed `ChatTurn[]`; prompt-cached system prompt; per-turn structured delta; turn budget + extended rate-limit ladder; deterministic fallback; conversation persisted to Supabase (extend `studio_brief_drafts` or a new `studio_brief_chats` — decided in the plan).
- **B (interview):** client question-graph; chip/short-text answers; **one** `generateStudioBriefDraftAction` synthesis at the end; existing deterministic fallback parser.
- Both terminate by writing the brief draft and routing to `/request/build` for review.

---

## 7. Money & i18n invariants (held)

- `estimateStudioPricing` untouched. English labels remain the canonical pricing keys.
- All authored copy via `translateSurfaceLabel` (`@henryco/i18n`) + `useHenryCoLocale()`; option labels via `localizeStudioRequestConfig` (display-only).
- No palette/type token changes in `globals.css` — add motion/layout utilities only.
- No giant hero; compact entry on the hub.

---

## 8. File plan (decomposition — also relieves the oversized `request-builder.tsx`)

**New**
- `app/request/copilot/page.tsx` + `components/studio/copilot-chat/*`
- `app/request/guided/page.tsx` + `components/studio/guided-interview/*` (+ question-graph data module)
- `app/request/build/page.tsx` (renders the refactored builder)
- `lib/studio/request-fields.ts` — `REQUEST_FIELD_NAMES`, `structuredToDraft`, per-step validation schema (shared source of truth)
- `lib/studio/brief-chat-action.ts` — Flavor A server action

**Changed**
- `app/request/page.tsx` → the hub (replaces the current landing render)
- `components/studio/request-builder.tsx` → adaptive disclosure + gating; consumes `request-fields.ts`
- `components/studio/request-path-step.tsx` → remove the redundant "BUYING LANE" toggle; serviceKind picker role
- `request-landing.tsx` → becomes/feeds the hub

**Reused untouched**
- `lib/studio/actions.ts`, `lib/studio/pricing.ts`, `lib/studio/request-config.ts`
- `lib/studio/brief-copilot-action.ts` (gains a clean synthesis entrypoint for Flavor B)

---

## 9. Motion system

framer-motion (already a dependency, currently unused in studio): hub card hover, step/section disclosure reveals, chat message-in, side-panel pricing count-up. Every animation wrapped in a `useReducedMotion` guard. No layout shift; existing tokens only.

---

## 10. Verification

- `pnpm --filter @henryco/studio typecheck` clean.
- Vercel preview (no local `.env`, cannot boot dev server): exercise all three on-ramps → each lands on `/request/build` pre-filled and submits via the contract; gating blocks incomplete briefs; adaptive fields change per serviceKind; redirects resolve.
- Mobile-first checks: gating visibility, scroll-to-first-error, chip ergonomics.
- Ship as a squash PR to `main`, commit style "Studio: <imperative>".

---

## 11. Risks & open questions (resolved in the implementation plan)

1. **Flavor A cost / rate limits** — multi-turn LLM is the main new cost surface. Mitigation: turn budget + reused rate-limit ladder + deterministic fallback. *Confirm the Anthropic budget is acceptable.*
2. **Three on-ramps could dilute** — mitigation: a steering hub that recommends chat as the primary path; all three share one engine, so maintenance cost is bounded.
3. **Draft version stability** — keep `StudioBriefDraft` at version 1 / 24 fields; park conversation state under separate keys to avoid invalidating in-flight drafts.
4. **Supabase persistence for Flavor A** — extend `studio_brief_drafts` vs new `studio_brief_chats`; decided in the plan.

---

## 12. Out of scope

- `/pick` templates surface redesign (only cross-link cleanup).
- Pricing model, payment flow, and auth changes.
