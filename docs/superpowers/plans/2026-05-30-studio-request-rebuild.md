# Studio `/request` Rebuild — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. The studio app has **no unit-test harness** (confirmed: `apps/studio/package.json` has no vitest/jest). Verification per stage = `pnpm --filter @henryco/studio typecheck` + `lint`, then `verify:live` + Vercel preview for flows. Pure logic is written side-effect-free so `tsc` is the proof.

**Goal:** Rebuild `/request` into a calm hub with three on-ramps (AI chat, guided interview, manual builder) that all converge on one submit contract, fixing the silent-incomplete-submission bug, adding serviceKind-adaptive disclosure, and making the co-pilot conversational — merged to `main` and live on Vercel.

**Architecture:** A shared draft (`useFormDraft` over localStorage, key `studio-brief-new`) is the bridge: every on-ramp writes a complete `StudioBriefDraft` then routes to `/request/build`, which owns the only `<form action={submitStudioBriefAction}>`. A single `request-fields.ts` module is the source of truth for field names, the structured→draft mapping, and per-step validation. serviceKind drives progressive disclosure; framer-motion (reduced-motion-gated) supplies micro-interactions.

**Tech Stack:** Next 16 App Router (RSC + server actions), React 19, framer-motion 12, `@anthropic-ai/sdk` 0.92 (Haiku), `@henryco/lifecycle/drafts`, `@henryco/i18n` (`translateSurfaceLabel`), Tailwind v4 + studio tokens.

**Branch/merge:** Build in an isolated worktree off `origin/main` (owner runs parallel sessions on a shared tree). Commits "Studio: <imperative>". Squash PR → `main`; merge is gated on CI green; Vercel auto-deploys `main`.

---

## Reconciliation with #171 (added in the resume session, 2026-05-30)

This plan was first drafted against the working-tree state. `origin/main` already contains commit #171 *"consolidate /project → /client + rebuild /request flow"*, a prior `/request` rebuild. Verified against the actual post-#171 code, these adjustments are LOAD-BEARING — implementers must honor them:

- **The silent-incomplete-submission bug is already fixed.** `request-builder.tsx` has an always-mounted hidden-input shell mirroring every contract field (20 scalar + 4 multi-value), `request-builder.tsx:612-659`. Defect B's money-integrity half is done. **Do NOT regress this shell** — `/request/build` keeps it verbatim. The remaining, genuinely-missing piece is per-step **required-field gating** (today Continue only disables on an empty package lane — `request-builder.tsx:881`). `validateStep` (Stage 0) + gating (Stage 1.2) deliver that.
- **`StudioBriefDraft` has 25 fields and INCLUDES `domainIntentJson: string`** (inline at `request-builder.tsx:43-69`). The Stage 0.1 type MUST add `domainIntentJson` (the original draft omitted it). Shape stays version 1.
- **Do NOT remove the "BUYING LANE" Package/Custom toggle.** It is the ONLY emitter of `packageIntent`/`packageId` (`request-path-step.tsx:67-124`), not a redundant duplicate. Stage 1.4 is revised to KEEP it; the package-as-recommendation affordance is purely additive.
- **serviceKind disclosure already exists** for priced options via `filterPricedOptions`/`filterModifierOptions` (`request-config.ts:860-872`). Stage 1.3 is mostly verification, not new branching.
- **Draft writes use the standalone `saveDraft(envelope)`** from `@henryco/lifecycle/drafts` — the `useFormDraft` hook returns `{ value, setValue, isRestored, isStale, savedAt, discard, clear }` and has NO save method. Envelope = `{ key, value, savedAt, version }`.
- **Submit values stay canonical English** (pricing matches labels in English via `findPricedOptionByLabel`); on-ramps translate for display only.
- **Co-pilot today is single-shot**, auto-applying via an `onApply` prop + parent re-mount keyed by `seedVersion`/`skipRestore`. The new multi-turn chat (`/request/copilot`) does NOT reuse that mount-time handoff; it accumulates structure, writes the draft via `saveDraft`, and routes to `/request/build` (which restores normally).
- **`BriefCopilotStructured`** = 20 fields incl. `summary/confidence/uncertainties` (`brief-copilot-action.ts:89-110`); `StudioServiceKind` = 7 kinds (`website|mobile_app|ui_ux|branding|ecommerce|internal_system|custom_software`).

Net effect: the architecture (hub + three on-ramps + one submit) is unchanged and still the right next step — it delivers exactly what #171 did NOT (multi-turn chat, guided interview, compact hub, gating). The corrections above prevent regressing #171's fixes.

---

## File Structure

**New**
- `apps/studio/lib/studio/request-fields.ts` — source of truth: `REQUEST_FIELD_NAMES`, `StudioBriefDraft` (moved here), `STUDIO_BRIEF_DRAFT_KEY/VERSION`, `emptyStudioBriefDraft`, `structuredToDraft`, `validateStep`, `STEP_ORDER`.
- `apps/studio/lib/studio/guided-questions.ts` — the adaptive question-graph data + `resolveNextQuestion`.
- `apps/studio/lib/studio/brief-chat-action.ts` — `continueStudioBriefChatAction` (Flavor A multi-turn).
- `apps/studio/app/request/build/page.tsx` — renders the builder (the submit surface).
- `apps/studio/app/request/guided/page.tsx` + `apps/studio/components/studio/guided-interview/guided-interview.tsx` (+ `question-card.tsx`).
- `apps/studio/app/request/copilot/page.tsx` + `apps/studio/components/studio/copilot-chat/copilot-chat.tsx` (+ `chat-bubble.tsx`).
- `apps/studio/components/studio/request-hub.tsx` — the three on-ramp cards + templates link.
- `apps/studio/lib/studio/motion.ts` — shared framer-motion variants + `useStudioMotion` (reduced-motion gate).

**Changed**
- `apps/studio/app/request/page.tsx` — becomes the hub (keeps legacy redirects).
- `apps/studio/components/studio/request-builder.tsx` — imports foundation; adds per-step gating + adaptive disclosure + package-as-recommendation; drops local `StudioBriefDraft`.
- `apps/studio/components/studio/request-path-step.tsx` — remove the "BUYING LANE" toggle; serviceKind picker via `services` cards.

**Reused untouched**
- `lib/studio/actions.ts`, `lib/studio/pricing.ts`, `lib/studio/request-config.ts`, `lib/studio/brief-copilot-action.ts`.

---

## Stage 0 — Shared foundation (`request-fields.ts`)

**Files:** Create `apps/studio/lib/studio/request-fields.ts`. Modify `request-builder.tsx` to import from it.

- [ ] **Step 0.1 — Write `request-fields.ts` in full.**

```ts
import type { StudioService } from "@/lib/studio/content";
import type {
  StudioRequestConfig,
} from "@/lib/studio/request-config";
import {
  filterModifierOptions,
  filterPricedOptions,
} from "@/lib/studio/request-config";
import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-action";

/** The exact FormData field names `submitStudioBriefAction` consumes.
 * Single source of truth — every on-ramp + hidden input references these. */
export const REQUEST_FIELD_NAMES = {
  customerName: "customerName",
  companyName: "companyName",
  email: "email",
  phone: "phone",
  serviceKind: "serviceKind",
  businessType: "businessType",
  budgetBand: "budgetBand",
  urgency: "urgency",
  timeline: "timeline",
  goals: "goals",
  scopeNotes: "scopeNotes",
  packageIntent: "packageIntent",
  packageId: "packageId",
  preferredTeamId: "preferredTeamId",
  referenceLinks: "referenceLinks",
  techPreferences: "techPreferences",
  requiredFeatures: "requiredFeatures",
  projectType: "projectType",
  platformPreference: "platformPreference",
  preferredLanguage: "preferredLanguage",
  programmingLanguage: "programmingLanguage",
  frameworkPreference: "frameworkPreference",
  backendPreference: "backendPreference",
  hostingPreference: "hostingPreference",
  designDirection: "designDirection",
  pageRequirements: "pageRequirements",
  addonServices: "addonServices",
  inspirationSummary: "inspirationSummary",
  depositNow: "depositNow",
  domainIntentJson: "domainIntentJson",
  referenceFiles: "referenceFiles",
} as const;

export const STUDIO_BRIEF_DRAFT_KEY = "studio-brief-new";
export const STUDIO_BRIEF_DRAFT_VERSION = 1;

/** Canonical in-flight brief state. Moved here from request-builder so
 * every on-ramp shares one type. Shape MUST stay stable (version 1) to
 * avoid invalidating drafts already in users' localStorage. */
export type StudioBriefDraft = {
  stepIndex: number;
  serviceKind: StudioService["kind"];
  pathway: "package" | "custom";
  selectedPackageId: string;
  selectedTeamId: string;
  selectedProjectType: string;
  selectedPlatform: string;
  selectedDesign: string;
  preferredLanguage: string;
  selectedPages: string[];
  selectedModules: string[];
  selectedAddOns: string[];
  selectedTech: string[];
  selectedProgrammingLanguage: string;
  selectedFramework: string;
  selectedBackend: string;
  selectedHosting: string;
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  goals: string;
  scopeNotes: string;
  inspirationSummary: string;
  domainIntentJson: string; // RECONCILED: present in the live inline type; carries studio-domain-launch intent. Do not drop.
};

export const STEP_ORDER = ["path", "scope", "commercial", "activation"] as const;
export type StudioStepKey = (typeof STEP_ORDER)[number];

type DraftDefaultsInput = {
  config: StudioRequestConfig;
  services: StudioService[];
  serviceKind?: StudioService["kind"];
  preferredTeamId?: string | null;
};

/** Complete, valid default draft for a serviceKind — extracts the
 * `initial*` derivation that used to live inline in the builder so the
 * chat/interview on-ramps produce identical defaults. */
export function emptyStudioBriefDraft({
  config,
  services,
  serviceKind,
  preferredTeamId,
}: DraftDefaultsInput): StudioBriefDraft {
  const kind = serviceKind ?? services[0]?.kind ?? "website";
  const firstPriced = (opts: Parameters<typeof filterPricedOptions>[0]) =>
    filterPricedOptions(opts, kind)[0]?.label ?? "";
  const firstModifier = (opts: Parameters<typeof filterModifierOptions>[0]) =>
    filterModifierOptions(opts, kind)[0]?.label ?? "";
  return {
    stepIndex: 0,
    serviceKind: kind,
    pathway: "custom",
    selectedPackageId: "",
    selectedTeamId: preferredTeamId ?? "",
    selectedProjectType: firstPriced(config.projectTypes) || "Custom digital program",
    selectedPlatform: firstPriced(config.platformOptions) || "Best-fit recommendation",
    selectedDesign: config.designOptions[0] ?? "Quiet luxury and high-trust",
    preferredLanguage: "English",
    selectedPages: [],
    selectedModules: [],
    selectedAddOns: [],
    selectedTech: [],
    selectedProgrammingLanguage:
      config.programmingLanguageOptions[0] ?? "HenryCo's recommendation",
    selectedFramework: firstPriced(config.frameworkOptions) || "HenryCo's framework recommendation",
    selectedBackend: firstPriced(config.backendOptions) || "HenryCo recommends the backend",
    selectedHosting: config.hostingOptions[0] ?? "HenryCo recommends the host",
    businessType: "",
    budgetBand: "",
    urgency: firstModifier(config.urgencyOptions),
    timeline: firstModifier(config.timelineOptions),
    goals: "",
    scopeNotes: "",
    inspirationSummary: "",
    domainIntentJson: "", // RECONCILED: keep in sync with the 25-field live shape.
  };
}

/** Map a co-pilot structured result onto a complete draft. Anything the
 * model omits falls back to the serviceKind default — so the builder
 * always restores a fully-valid form, never a half-filled one. */
export function structuredToDraft(
  structured: BriefCopilotStructured,
  input: DraftDefaultsInput,
): StudioBriefDraft {
  const base = emptyStudioBriefDraft(input);
  return {
    ...base,
    selectedProjectType: structured.projectType || base.selectedProjectType,
    selectedPlatform: structured.platformPreference || base.selectedPlatform,
    selectedDesign: structured.designDirection || base.selectedDesign,
    preferredLanguage: structured.preferredLanguage || base.preferredLanguage,
    selectedFramework: structured.frameworkPreference || base.selectedFramework,
    selectedBackend: structured.backendPreference || base.selectedBackend,
    selectedHosting: structured.hostingPreference || base.selectedHosting,
    selectedPages: structured.pageRequirements?.length ? structured.pageRequirements : base.selectedPages,
    selectedModules: structured.requiredFeatures?.length ? structured.requiredFeatures : base.selectedModules,
    selectedAddOns: structured.addonServices?.length ? structured.addonServices : base.selectedAddOns,
    selectedTech: structured.techPreferences?.length ? structured.techPreferences : base.selectedTech,
    businessType: structured.businessType || base.businessType,
    budgetBand: structured.budgetBand || base.budgetBand,
    urgency: structured.urgency || base.urgency,
    timeline: structured.timeline || base.timeline,
    goals: structured.goals || base.goals,
    scopeNotes: structured.scopeNotes || base.scopeNotes,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PROSE = 12;

export type StepValidation = { ok: boolean; errors: Record<string, string> };

/** Per-step gating — the fix for the silent-incomplete-submission bug.
 * Adaptive to pathway/serviceKind. Returns field-keyed messages so the
 * UI can render unmissable inline errors. */
export function validateStep(step: StudioStepKey, d: StudioBriefDraft): StepValidation {
  const errors: Record<string, string> = {};
  if (step === "path") {
    if (d.pathway === "package" && !d.selectedPackageId) {
      errors.selectedPackageId = "Choose a package to continue, or switch to a custom build.";
    }
  } else if (step === "scope") {
    const hasScopeSignal =
      d.selectedPages.length + d.selectedModules.length + d.selectedAddOns.length > 0;
    if (!hasScopeSignal) {
      errors.scope = "Pick at least one capability so we know what to build.";
    }
  } else if (step === "commercial") {
    if (d.goals.trim().length < MIN_PROSE) errors.goals = "Tell us the outcome you want — a sentence is plenty.";
    if (d.scopeNotes.trim().length < MIN_PROSE) errors.scopeNotes = "A line on scope keeps the estimate honest.";
    if (!d.budgetBand.trim()) errors.budgetBand = "A budget band sharpens the plan. A range is fine.";
  } else if (step === "activation") {
    if (!d.customerNameValid()) {
      // placeholder guard replaced below
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 0.2 — Fix the activation branch (no method on a plain object).** Replace the `activation` branch with:

```ts
  } else if (step === "activation") {
    if (!d.businessType /* not required */ && false) { /* noop */ }
    if (!nameOk(d)) errors.customerName = "Add a name so we know who to write back to.";
    if (!EMAIL_RE.test(d.businessEmail())) { /* replaced below */ }
  }
```

That is wrong — `StudioBriefDraft` has no name/email (those live only as form inputs in the activation step, not in the persisted draft). **Correct design:** activation fields (`customerName`, `email`, `phone`, `companyName`, `depositNow`) are NOT in `StudioBriefDraft`; they are entered directly in the builder's final step. So `validateStep("activation", …)` validates the builder's local activation state, not the draft. Implement activation validation **in the builder** (Stage 1) against its own `useState` for those fields, using the same `EMAIL_RE`/`nameOk` helpers exported here:

```ts
export function nameOk(name: string): boolean {
  return name.trim().length >= 2;
}
export function emailOk(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
```

Remove the broken `activation` branch from `validateStep` (it only handles `path`/`scope`/`commercial`, which are draft-backed). Final `validateStep` signature stays `(step, draft) => StepValidation`; the builder calls `nameOk`/`emailOk` for the activation step separately.

- [ ] **Step 0.3 — Point the builder at the foundation.** In `request-builder.tsx`: delete the local `type StudioBriefDraft` (lines ~41-66) and `import { StudioBriefDraft, STUDIO_BRIEF_DRAFT_KEY, STUDIO_BRIEF_DRAFT_VERSION, emptyStudioBriefDraft, structuredToDraft, validateStep, nameOk, emailOk, STEP_ORDER } from "@/lib/studio/request-fields";`. Replace the inline `initialDraft` `useMemo` body with `copilotSeed ? structuredToDraft(copilotSeed, { config: requestConfig, services, serviceKind: resolvedKind, preferredTeamId }) : emptyStudioBriefDraft({ config: requestConfig, services, serviceKind: resolvedKind, preferredTeamId })` (merging `initialStepIndex`/`initialPathway` after). Pass `version: STUDIO_BRIEF_DRAFT_VERSION` to `useFormDraft`.

- [ ] **Step 0.4 — Verify.** Run `pnpm --filter @henryco/studio typecheck`. Expected: clean. Fix any drift (the draft no longer declares activation fields — confirm nothing referenced `draft.value.customerName` etc.; those were always builder-local state).

- [ ] **Step 0.5 — Commit:** `Studio: extract brief field contract + draft mapping into request-fields`.

---

## Stage 1 — Builder = the single submit surface (`/request/build`)

**Files:** Create `app/request/build/page.tsx`. Modify `request-builder.tsx`, `request-path-step.tsx`.

- [ ] **Step 1.1 — `/request/build` route.** Server component mirroring the catalog fetch in `app/request/page.tsx` (getStudioCatalog), rendering `<StudioRequestBuilder>` with `services/packages/teams/requestConfig`, `preferredTeamId` from `?team`, `presetHint` from `?preset`/`?template`, and `initialStepIndex`/`initialPathway` from the preset. No `copilotSeed` prop (data arrives via the restored draft). Keep `maxDuration = 60`.

- [ ] **Step 1.2 — Per-step gating.** In the builder's Continue/Submit handler: compute `const v = validateStep(STEP_ORDER[stepIndex], draft.value)` (and for the activation step also `nameOk(customerName) && emailOk(email)`). Disable Continue when `!v.ok`; on a blocked click, set an `errors` state and scroll to the first errored field (`document.querySelector('[data-field="…"]')?.scrollIntoView`). Render each message inline beneath its field with `role="alert"` + `aria-invalid` + the existing `--studio-warn`/danger token, mobile-first. Remove the old single-condition disable (`pathway === "package" && filteredPackages.length === 0`) — the package case is now covered by `validateStep("path")`.

- [ ] **Step 1.3 — Adaptive disclosure.** Wrap each step's conditionally-relevant section in a framer-motion reveal (`motion.section` with the `reveal` variant from `lib/studio/motion.ts`, Stage 5). The scope step already filters options by serviceKind via `filterPricedOptions`; ensure sections with zero options for the current serviceKind don't render at all (no empty headers).

- [ ] **Step 1.4 — Package as recommendation (REVISED — keep the toggle).** Do **NOT** remove the "BUYING LANE" Package/Custom toggle in `request-path-step.tsx` — reconciliation confirmed it is the ONLY emitter of `packageIntent`/`packageId`. Keep it intact and working. The serviceKind picker (the `services` cards) also stays. **Additive only:** in the side panel, when the current selections map to a `StudioPackage` (reuse existing `filteredPackages`/match logic), render a calm "This matches our {package.name} — lock it in" affordance that, when accepted, sets `pathway="package"` + `selectedPackageId` (i.e. flips the existing toggle programmatically). Default stays `pathway="custom"`. The hidden `packageIntent` input continues to emit `pathway`. Net: no contract emitter is removed; the recommendation is a convenience layered on top.

- [ ] **Step 1.5 — Verify + commit.** `typecheck` clean. Commit `Studio: gate brief steps + make /request/build the submit surface`.

---

## Stage 2 — Hub (`/request`)

**Files:** Modify `app/request/page.tsx`. Create `components/studio/request-hub.tsx`.

- [ ] **Step 2.1 — Hub component.** Three on-ramp cards (client component for hover micro-interactions). Copy via `translateSurfaceLabel` + `useHenryCoLocale`, in studio voice — no invented product/persona names:
  - **"Talk it through"** → `/request/copilot` — "Describe it in your words. We ask, you answer, a brief takes shape." (cyan `--studio-signal` accent.)
  - **"Answer a few questions"** → `/request/guided` — "Tap through quick choices. No blank page." 
  - **"Build it yourself"** → `/request/build` — "Drive every field. Most control." 
  - Footer link: "Know exactly what you want? Browse ready-made templates →" `/pick`.
  - Each card: `.studio-panel` surface, `motion` `whileHover={{ y: -4 }}` + accent underline sweep, gated by `useStudioMotion`. No giant hero (memory: owner rejects oversized hero text) — keep the existing compact kicker+h1.

- [ ] **Step 2.2 — Keep legacy redirects.** In `app/request/page.tsx` retain: `?paymentId → /pay/[id]`; `?path=templates → /pick`; `?path=custom → /request/build`; `?template=`/`?preset=`/`?team=` → `redirect("/request/build?…")` preserving params; bare → render the hub. Render `<RequestHub/>` instead of `<StudioRequestLanding/>`.

- [ ] **Step 2.3 — Verify + commit.** `typecheck` clean. Commit `Studio: turn /request into a calm three-on-ramp hub`.

---

## Stage 3 — Guided interview (`/request/guided`, Flavor B)

**Files:** Create `lib/studio/guided-questions.ts`, `app/request/guided/page.tsx`, `components/studio/guided-interview/guided-interview.tsx`, `.../question-card.tsx`.

- [ ] **Step 3.1 — Question graph.** `guided-questions.ts` exports `type GuidedQuestion = { id; prompt; help?; kind: "single"|"multi"|"text"; options?: (cfg, serviceKind)=>{value,label,detail?}[]; appliesTo?: serviceKinds[]; writes: keyof BriefCopilotStructured-ish }` and `resolveNextQuestion(answers, config): GuidedQuestion | null`. First question always serviceKind ("What are we building?" → services-derived options). Subsequent questions filtered by chosen serviceKind using `filterPricedOptions`. Pure, typecheck-verified.

- [ ] **Step 3.2 — Interview UI.** One `QuestionCard` at a time, chip answers (multi = toggle chips, single = radio chips, text = `.studio-textarea`), a slim progress rail, Back/Next. framer-motion: question cards slide/fade in (`reveal`), chips `whileTap={{ scale: 0.96 }}`. Accumulate answers in `useFormDraft("studio-guided-answers", …)` (separate key — does not touch the brief draft).

- [ ] **Step 3.3 — Synthesis + handoff.** On finish, build the free-text summary from answers and call `generateStudioBriefDraftAction` once. On `ok`, `structuredToDraft(result.structured, {config, services, serviceKind})`, write it to the brief draft via the storage adapter (`saveDraft({ key: STUDIO_BRIEF_DRAFT_KEY, value, savedAt: Date.now(), version: STUDIO_BRIEF_DRAFT_VERSION })`), then `router.push("/request/build")`. On `error`/no-key, the action's deterministic fallback still returns a structured result — same handoff.

- [ ] **Step 3.4 — Verify + commit.** `typecheck` clean. Commit `Studio: add guided adaptive interview on-ramp`.

---

## Stage 4 — Co-pilot chat (`/request/copilot`, Flavor A)

**Files:** Create `lib/studio/brief-chat-action.ts`, `app/request/copilot/page.tsx`, `components/studio/copilot-chat/copilot-chat.tsx`, `.../chat-bubble.tsx`.

- [ ] **Step 4.1 — Chat action.** `"use server"` `continueStudioBriefChatAction(input: { history: ChatTurn[]; message: string })` where `ChatTurn = { role: "user"|"assistant"; content: string }`. Reuse the model/limits/persistence patterns from `brief-copilot-action.ts`: Haiku `claude-haiku-4-5-20251001`, prompt-cached system prompt (interviewer persona in studio voice — calm, concrete, no fake enthusiasm, never invents a human name), turn budget `MAX_TURNS = 12`, the same rate-limit ladder, SHA-256 idempotency per turn. Returns `{ ok: true; reply: string; structured: Partial<BriefCopilotStructured>; done: boolean } | { ok: false; error }`. When no `ANTHROPIC_API_KEY`: a deterministic scripted next-question fallback (walk the same `guided-questions` graph) so the lane works without the model. Persist the running transcript to Supabase `studio_brief_drafts` (append) — no new table.

- [ ] **Step 4.2 — Chat UI.** Message stream (`ChatBubble` user/assistant), a typing indicator while the action is pending, optional chip quick-replies the assistant can suggest, and a sticky "This looks right — build my brief" CTA that lights up once `structured` has enough signal (serviceKind + ≥1 feature/goal). framer-motion: bubbles animate in (`messageIn`), typing dots loop (reduced-motion → static "…"). On accept: `structuredToDraft` → `saveDraft(brief key)` → `router.push("/request/build")`.

- [ ] **Step 4.3 — Verify + commit.** `typecheck` clean. Commit `Studio: add conversational co-pilot chat on-ramp`.

---

## Stage 5 — Motion system + polish

**Files:** Create `lib/studio/motion.ts`. Touch hub/builder/guided/chat.

- [ ] **Step 5.1 — `motion.ts`.** Export `useStudioMotion()` (wraps framer's `useReducedMotion`, returns `{ enabled }`) and variants `reveal`, `messageIn`, `staggerChildren`, `pricingCountUp`. Every consumer passes `initial/animate` only when `enabled`, else renders final state (no animation, no layout shift).

- [ ] **Step 5.2 — Apply micro-interactions.** Hub card hover/underline-sweep; step transitions in the builder; side-panel pricing count-up on change; chip tap scale; CTA shimmer on enable. All reduced-motion-gated. Tokens only — no palette/type change.

- [ ] **Step 5.3 — Verify + commit.** `typecheck` + `lint` clean. Commit `Studio: add reduced-motion-gated micro-interactions`.

---

## Stage 6 — Ship

- [ ] **Step 6.1 — Full local gate:** `pnpm --filter @henryco/studio typecheck` + `lint` + `smoke`. Fix all.
- [ ] **Step 6.2 — PR:** push the worktree branch, open a squash PR → `main` with a Summary + Test plan. Title ≤70 chars.
- [ ] **Step 6.3 — CI gate:** wait for required checks green (merge is gated). Fix failures (refresh i18n hardcoded-scan baseline if it trips — recent commits show this pattern).
- [ ] **Step 6.4 — Vercel preview review:** exercise all three on-ramps → each lands on `/request/build` pre-filled and submits; gating blocks an empty brief; adaptive fields change per serviceKind; redirects resolve.
- [ ] **Step 6.5 — Merge → `main`; confirm Vercel auto-deploy of production is green and `/request` is live.**

---

## Self-Review

**Spec coverage:** B → Stage 0 `validateStep` + Stage 1.2 gating ✅ · D → Stage 0 defaults by serviceKind + Stage 1.3 disclosure + Stage 3 graph ✅ · E flavor A → Stage 4 ✅ · E flavor B → Stage 3 ✅ · A (de-dup) → Stage 1.4 (toggle removed, package = recommendation) + Stage 2 (one lane choice) ✅ · contract preserved → Stage 0 `REQUEST_FIELD_NAMES` + one submit surface (Stage 1) ✅ · pricing untouched ✅ · i18n voice ✅ · motion → Stage 5 ✅ · redirects → Stage 2.2 ✅.

**Placeholder scan:** Step 0.1 contained a deliberately-broken `validateStep` activation branch; Step 0.2 corrects it (activation fields are builder-local, not draft-backed) and exports `nameOk`/`emailOk`. No other placeholders.

**Type consistency:** `StudioBriefDraft` defined once (0.1), imported everywhere. `structuredToDraft(structured, input)` / `emptyStudioBriefDraft(input)` share `DraftDefaultsInput`. `validateStep(step, draft)` used in 1.2. `saveDraft` envelope matches `DraftEnvelope` from `@henryco/lifecycle/drafts` (key/value/savedAt/version). `BriefCopilotStructured` is the existing export reused by 0.1/3.3/4.x.

**Open questions resolved here:** no new Supabase table (append to `studio_brief_drafts`); Anthropic cost bounded by `MAX_TURNS=12` + existing rate-limit ladder + no-key fallback; draft stays version 1.
