# WS-6 F8 — Localize the shared messaging composer chrome (all 4 divisions)

**Program:** The Onyx Line. **Carry-in from WS-4 T6 review** (cross-division, not a WS-4 regression).
**Branch:** `v3/typography-reading-foundation`. **Posture:** UI-only, no money, no migration. Sequenced AFTER WS-5 (touches `JobsMessageThread`, built in WS-5).

## Problem

The shared thread surface renders **hardcoded English chrome** on every localized thread across account, studio, jobs, marketplace — most visibly the **Send button** ("Send"/"Sending…"), plus composer aria labels, the "Live"/"Reconnecting…" pill, and the failed-send message. A French/Arabic user sees a localized page with an English Send button.

## Root cause (grounded)

- `@henryco/chat-composer` **already** accepts `labels?: ComposerLabels` and reads every composer string from it with an English fallback (`ChatComposer.tsx`, `SendButton.tsx`, `FullScreenComposer.tsx`, `AttachmentPreview.tsx`, `DraftIndicator.tsx`). **Not the blocker.**
- `@henryco/messaging-thread` `MessageThread` mounts `<ChatComposer>` (`thread.tsx:873-891`) **without** passing `labels`, and has **no pass-through prop** → every division falls to English. It also hardcodes its OWN chrome (`thread.tsx`): `liveLabel`/aria (L774,777), `"Reconnecting…"` (L767), real failed-send `"We couldn't send the message. Try again."` (L733), `"(edited)"` (L134), `"You"` (L131), typing labels (L905-909), legacy status text (L84-87), SR announcer.
- Both engine packages are **i18n-agnostic** (no `@henryco/i18n` import) and must stay so — divisions translate and pass strings in (same model as `deliveryPipLabels`).
- Engine packages ship raw source via `exports` (no build). Verify: `pnpm --filter @henryco/chat-composer typecheck`, `pnpm --filter @henryco/messaging-thread typecheck` + `... test` (node `--test`).

## Design — engine takes strings, one shared translator builds them

### T1 — `@henryco/chat-composer`: add the few missing `ComposerLabels` keys
`types.ts ComposerLabels` (L53-69) already has most keys. ADD optional keys for the 1b-uncovered strings + wire them at their render sites (keep English fallbacks so existing callers are unaffected): `composerAriaLabel` (L312 group aria), `bodyAriaLabel` (L340 textarea aria), `dropToAttachLabel` (L325), `srSendingLabel` (L429), `uploadingLabel` (AttachmentPreview L144), `attachmentFailedLabel` (L148), `attachmentListLabel` (L83), `savingLabel` (DraftIndicator L71), `newMessageLabel`/`fullScreenTitleLabel` coverage (FullScreen L223). Remove or wire the 2 dead keys (`attachmentCarouselLabel`, `emptyAttachmentLabel`). *Verify: chat-composer typecheck.*

### T2 — `@henryco/messaging-thread`: forward composer labels + add thread-chrome label props
- `types.ts`: `import type { ComposerLabels } from "@henryco/chat-composer";` add `composerLabels?: ComposerLabels` to `MessageThreadProps`. Add optional thread-chrome props (English defaults preserved): `liveLabel?`, `reconnectingLabel?`, `realtimeAriaLabel?`, `failedSendLabel?`, `editedLabel?`, `ownNameLabel?` (default "You"), `statusLabels?: {sending,sent,delivered,read}`, `typingLabels?: {one,two,many}` (or a `typingLabel(names)` callback).
- `thread.tsx`: destructure the new props (L293-311), pass `labels={composerLabels}` to `<ChatComposer>` (L873-891), and replace each hardcoded chrome literal with `prop ?? "<English default>"`. Keep all defaults so existing callers (and the markdown test) are unchanged. *Verify: messaging-thread typecheck + `node --test` stays green.*

### T3 — `@henryco/i18n`: one shared label builder (single source of truth for chrome copy)
Add `buildMessagingChromeLabels(t: (s: string) => string)` returning `{ composerLabels: {...}, threadLabels: {...} }` — every chrome string wrapped in `t("English source")` so all divisions share identical, locale-correct chrome (ig/yo/ha/hi EN-fallback via the surface-label system; brand names never translated). Engine-type-free (returns plain objects; mounts pass them to typed props). *This avoids 4× duplication and centralizes the copy.*

### T4 — the 4 division mounts pass the labels
Each builds `const { composerLabels, threadLabels } = buildMessagingChromeLabels(t)` and spreads `composerLabels` + `threadLabels` onto `<MessageThread>`:
- `apps/account/components/support/SupportThreadRoom.tsx` (has `t`).
- `apps/marketplace/components/messaging/MarketplaceMessageThread.tsx` (has `t`).
- `apps/jobs/components/messaging/JobsMessageThread.tsx` (has `t`; from WS-5).
- `apps/studio/components/portal/StudioMessageThread.tsx` — **add** the i18n wiring first (`useHenryCoLocale` from `@henryco/i18n/react` + `translateSurfaceLabel` + `t`), matching the marketplace/jobs `/react` split, then pass the labels (studio currently passes none → all English). *Mind the import-entry inconsistency: account imports `useHenryCoLocale` from `@henryco/i18n`, marketplace/jobs from `@henryco/i18n/react` — use whatever compiles in each file.*

## Tasks (subagent-driven, sequential where engine-coupled, then per-division)
- **F8-T1+T2 (engine, one coherent unit):** add the ComposerLabels keys + wire them; add `composerLabels` + thread-chrome props to MessageThreadProps + forward/use in thread.tsx. Both packages typecheck; messaging-thread `node --test` green. Reviewer: no behavior change for English (defaults preserved), no i18n import in engine, no money.
- **F8-T3 (shared builder):** `buildMessagingChromeLabels(t)` in `@henryco/i18n`. Reviewer: copy correct, brand names untranslated, ig/yo/ha/hi EN-fallback.
- **F8-T4 (4 mounts, parallelizable — file-disjoint):** wire each division; studio gets i18n setup. Reviewer per surface: Send/aria localized, AA unchanged, brand names intact.
- **F8-T5:** typecheck all 4 apps + both packages; final review.

## Acceptance
The Send button + composer aria + Live/Reconnecting + failed-send render localized on all 4 division thread surfaces; English is byte-identical to today when locale=en (defaults preserved); engine packages remain i18n-agnostic; ig/yo/ha/hi EN-fallback; brand names never translated; no money; no migration; typechecks + the existing engine test green.
