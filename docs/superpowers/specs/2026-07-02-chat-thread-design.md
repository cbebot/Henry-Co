# ChatThread — one shared full-viewport chat component (2026-07-02)

## Problem

Two chat surfaces are structurally broken on mobile:

1. **Studio brief-intake chat** — `/request/copilot`, built from the bespoke
   `apps/studio/components/studio/copilot-chat/{copilot-chat,chat-message}.tsx`.
   The *document* scrolls (bottom-sentinel `scrollIntoView`), every message has
   its own avatar, failure is one global "That didn't go through." line, and
   there is no typing animation or suggested-replies row.
2. **Account support ticket threads** — `/support/[threadId]`, built on
   `@henryco/messaging-thread`'s `MessageThread` re-skinned by a 2,098-line
   `editorial.css`. A `HeroCard` hero banner lives *inside* the chat screen,
   autoscroll is unconditional (yanks the user while reading), every message
   renders its own avatar, failed optimistic sends are *deleted* and surface as
   a global composer banner, and the floating mobile "Dashboard" pill (z-91)
   plus the engine's floating "LIVE" pill overlap the chat.

Symptoms shared by both: page-scroll instead of a fixed chat viewport, content
sliding beneath oversized sticky headers, per-message avatars, no per-message
failure state, overlays over the composer, iOS keyboard breaking layout.

## Decision summary

Build **`@henryco/chat-thread`** (`packages/chat-thread`) — a full-viewport
chat *screen* component — and migrate exactly these two surfaces to it.

**Why not `packages/ui/chat/ChatThread`** (the task's suggested location):
`@henryco/chat-composer` depends on `@henryco/ui` (`workspace:^`). ChatThread
must compose ChatComposer (drafts, attachments, a11y, tones already built and
localized), so placing it in `packages/ui` creates a workspace dependency
cycle. A sibling package keeps the DAG clean:
`chat-thread → { chat-composer, messaging-thread(types only) } → ui`.

**Why not rebuilding inside `@henryco/messaging-thread`**: `MessageThread` is
an embedded *card* widget with four live division consumers (account support,
studio support, studio portal, marketplace, jobs) whose host CSS couples to its
`.mt-*` DOM (account `editorial.css`, account/studio `globals.css`). Changing
its DOM/scroll model would silently break marketplace/jobs/studio-support,
which are out of scope and unverifiable in this pass. `MessageThread` stays
untouched; the two broken surfaces move to the new component. Convergence of
the remaining consumers is explicitly follow-up work.

## Architecture

### Package: `packages/chat-thread` (`@henryco/chat-thread`)

Follows the `messaging-thread` precedent: source-shipped exports
(`.`, `./styles`, `./types`), own `tsconfig` + `tsc --noEmit` typecheck, tests
via root `tsx --test`, peer deps `react`/`react-dom` 19, plain-CSS stylesheet.

**Pure logic modules (TDD, no DOM, `tsx --test`):**

- `src/grouping.ts` — `buildThreadView(messages, opts)`: groups consecutive
  messages from the same sender within a 2-minute window (one avatar + one
  timestamp per group; positions `single|first|middle|last`), and inserts date
  separators between local calendar days. Pure function over
  `ChatThreadMessage[]`.
- `src/outbox.ts` — optimistic-send state machine as a pure reducer:
  `append(text, attachments) → sending`, `ack(localId, serverMessage) → sent`
  (reconciled/deduped against server list), `fail(localId, reason) → failed`,
  `retry(localId) → sending`, `discard(localId)`. Local ids are
  `local-<n>` (namespaced; never collides with server ids or messaging-thread's
  `optimistic-` convention). Server refresh merging: server-confirmed list +
  outbox overlay, dedupe by acked id.
- `src/follow.ts` — follow-state decisions: `isNearBottom(distancePx)`
  (threshold 120), whether a content change should auto-pin, unseen-count
  accounting for the "new messages" chip.

**Component layer (`"use client"`):**

- `src/chat-thread.tsx` — `ChatThread`:
  - Root `.ct-screen`: flex column, `height:100%`, `overflow:hidden`,
    `min-height:0`. Hosts mount it inside a height-fixed container; the
    package also ships `.ct-viewport` — `height:100dvh` (with
    `-webkit-fill-available` fallback consideration and
    `env(safe-area-inset-*)`) and an optional
    `--ct-viewport-offset` (e.g. persistent bottom nav) so hosts control
    chrome, the component owns the interior. Never `100vh`.
  - Header `.ct-header`: ONE compact bar, `min-height:56px; max-height:64px`;
    slots: `onBack`/`backHref`, truncated title, small status line
    (`status` node — ticket status / live dot / "Reconnecting…"), trailing
    `actions` node. Live/realtime status renders HERE, not as a floating pill.
  - Messages pane `.ct-pane`: `flex:1; min-height:0; overflow-y:auto;
    overscroll-behavior:contain; scroll-padding-bottom: var(--ct-composer-h)`.
    Content column `.ct-col` centers with `max-width` for desktop.
  - Composer host `.ct-composer`: LAST child of the flex column (not fixed),
    `padding-bottom:env(safe-area-inset-bottom)`; wraps `ChatComposer`
    (`enableFullScreenOnMobile=false`, `edgeToEdgeMobile` on, auto-grow 1→5
    lines, send disabled while empty/sending — composer's `ready` logic).
  - Scroll behavior: mount pins to newest instantly (`useLayoutEffect`,
    no smooth). Content growth auto-pins only when the reader is within 120px
    of the bottom; otherwise a floating `.ct-chip` "↓ N new messages" appears
    (tap → smooth scroll to bottom). Keys are message ids, never index.
  - Keyboard: `visualViewport` resize/scroll listeners set
    `--ct-kb-inset` on the root and re-pin if following, so the composer stays
    visible and thread position is preserved on open/close.
  - Media: image attachments render in fixed `aspect-ratio` boxes
    (intrinsic `width`/`height` when provided; 4/3 fallback), `object-fit:
    cover` — loading never shifts scroll.
  - Bubbles: own right / other left, `max-width:78%`, `overflow-wrap:
    anywhere` for long strings; ~4px intra-group gap, 16–20px between groups;
    date separators as small centered pills; per-message state on OWN bubbles:
    `sending` (subtle), `sent` (SENT badge in support variant), `failed` —
    inline "Tap to retry" affordance on THAT bubble (re-dispatches through the
    outbox). No global failure banner.
- `src/use-thread-realtime.ts` — headless port of `MessageThread`'s proven
  realtime effect (postgres_changes INSERT subscription, capped 1.5s→15s
  backoff reconnect, own-sender skip, live status), typed against
  `ThreadSupabaseLike`/`ThreadChannelLike` imported from
  `@henryco/messaging-thread/types`. Used by the account host; the studio
  copilot has no realtime.
- Variants via props on the same component:
  - `variant="assistant"` (studio): animated typing indicator (three dots,
    reduced-motion aware), `suggestions?: {id,label,kind?}[]` +
    `onSuggestion` — suggested-replies row above the composer.
  - `variant="support"` (account): attach button + image chips (composer
    attachments + `uploader` bridge), delivery badge (SENT / delivered / read
    from message fields), header status line = ticket status.

**Message shape** (`src/types.ts`): `ChatThreadMessage` — `id`, `authorId`,
`authorName`, `authorRole: 'viewer'|'other'|'system'`, `body`, `createdAt`,
`attachments?: {url,name,type,size?,width?,height?}[]`,
`deliveryState?: 'sending'|'sent'|'delivered'|'read'|'failed'`. A
`fromThreadMessage()` mapper adapts `@henryco/messaging-thread`'s
`ThreadMessage` so the account adapter (`rowToMessage`) ports unchanged.

**CSS**: `src/styles.css`, `.ct-*` namespace (deliberately NOT `.mt-*` — both
stylesheets coexist in account/studio globals). Colors read a small `--ct-*`
token contract with fallbacks chained to existing brand tokens. Brand note:
gold `#C9A227` = `--hc-accent` (canonical), cream `#F5F1E8` = existing
`BRAND.cream`/`--site-text`; the brief's "onyx #0B0B0D" does not exist in the
codebase and the repo bans new magic hex (packages/ui globals.css:111) — the
nearest canonical inks (`#0A0A0A` BRAND.ink / dark `--hc-bg #0a0a0b`) are used
instead. Fonts flow through the existing seams (`--hc-font-display` →
Fraunces, body → Manrope per app). Light + dark both supported: tokens flip
via host theme (`.dark` / `[data-theme]` / scoped wrappers), fallbacks cover
the dark default. `prefers-reduced-motion` disables all animation.

**i18n**: label-injection with English defaults (the messaging-thread hard
boundary — no locale hooks in the package). New additive
`buildChatThreadLabels(t)` in `packages/i18n/src/messaging-chrome-copy.ts`
(chip text, retry, typing, sending/sent/failed, attach labels), English
sources byte-identical to component defaults.

**Additive `@henryco/chat-composer` changes** (no behavior change for the five
existing consumers): `enterKeyBehavior?: 'newline'|'send'` (default
`'newline'` = today's Cmd/Ctrl+Enter contract; copilot passes `'send'` to
preserve its Enter-to-send), and `maxRows?: number` threaded to
`AutosizeTextarea` (default 6; ChatThread passes 5).

### Surface migration 1 — account `/support/[threadId]`

- `SupportThreadRoom` rebuilt on `ChatThread` (support variant) +
  `useThreadRealtime` + the existing `AccountSupportThreadAdapter` (send /
  mark-read / upload flows, `media://` signing boundary, idempotent reply API —
  all unchanged). The known adapter quirk (server returns `reason:
  "contact_blocked"`, adapter reads `error`) gets fixed so blocked sends show
  the localized contact-safety copy as that bubble's failure reason.
- Page: `HeroCard` REMOVED from the thread screen (stays on the support list).
  New compact header: back to `/support`, truncated subject, status line
  (`{status} · {division}` + live dot), overflow actions preserved (download,
  mute, report, copy link/ID) plus the appearance menu, in the trailing slot.
- Screen container: full-immersion fixed viewport at ALL widths (only the
  pane scrolls, acceptance #1 includes desktop). On mobile the thread screen
  hides `BottomActionBar` and the floating `MobileDashboardNavigator` pill
  (WhatsApp-style conversation immersion; the pill's purpose is served by the
  header back affordance). Implemented by route-aware suppression in the
  existing layout bridges, not CSS hacks.
- Old `.mt-*` thread rules in `editorial.css` become inert on this screen (new
  stage class, new `.ct-*` DOM). Rules verified dead-only-for-thread are
  pruned; anything shared with `/support` list/new stays. Full skin cleanup is
  follow-up.
- i18n unchanged: Pattern A `translateSurfaceLabel` + label builders.

### Surface migration 2 — studio `/request/copilot`

- `CopilotChat` keeps ALL business logic (localStorage draft
  `studio-copilot-chat` v1, opener-not-in-transcript invariant, 12-turn
  ceiling, PII redaction, coach fallback, finalize → `/request/build`
  pipeline) and swaps its presentation to `ChatThread` (assistant variant)
  inside a fixed-viewport container.
- Header: compact bar — back to `/request`, title (existing h1 copy), status
  line (kicker copy). The old in-card kicker/h1 hero block is gone from the
  chat screen.
- Messages: `BriefChatMessage[]` normalized on load with stable generated ids
  (kept in component state; the persisted envelope shape is unchanged —
  ids regenerate deterministically per session, keys stay stable within the
  session which is what keyed reconciliation needs).
- Typing: animated indicator while awaiting the server action (replaces
  italic "Thinking…"); reduced-motion respected.
- Suggested replies: example-brief chips when the transcript is empty
  (revives the orphaned panel's example prompts, localized); when
  `ready || assistantTurns >= 3`, the "Build my brief" CTA renders as the
  primary suggestion chip (same gating as today).
- Failure: the optimistic user bubble stays with inline tap-to-retry
  (re-sends that transcript turn); the global warn line is deleted.
- The floating `SupportAssist` capsule is suppressed on this route (overlaps
  the composer); it remains everywhere else in studio.
- Framer `messageIn` animation is replaced by the package's CSS entrance
  (JS-gated reduced-motion equivalent preserved).

### Explicitly untouched

`MessageThread` and its four other consumers (studio support, studio portal,
marketplace, jobs), the studio custom messages-centre, all server routes and
DB behavior (support reply/upload APIs, brief-chat/gateway actions), money,
migrations. `SupportReplyForm.tsx` (orphaned) is deleted only if a final grep
confirms zero importers.

## Error handling

- Send failure = outbox `failed` + inline retry on that bubble; retry re-runs
  the same adapter send with the same payload (server reply route is
  idempotent-keyed). Composer never blocks on in-flight sends (optimistic,
  input clears immediately on dispatch).
- `contact_blocked` surfaces as localized failure reason on the bubble.
- Realtime drop → header status flips to "Reconnecting…" (existing backoff
  logic); no floating banner.
- Upload failures stay in ChatComposer's existing attachment retry/cancel UX.

## Testing

1. **Unit (TDD, `tsx --test`)**: grouping windows/boundaries (2-min edge, sender
   change, day rollover), outbox transitions (ack/fail/retry/dedupe vs server
   refresh), follow decisions (threshold, unseen counting), copilot id
   normalization.
2. **Gates**: `lint:all`, `typecheck:all`, `i18n:check:strict`, `tone:check`,
   `test:workspace`, `build:all` (Windows: `--workspace-concurrency=1`), plus
   package tests for `chat-thread`, `messaging-thread`, `chat-composer`
   typecheck, and account/studio app test scripts (CI doesn't run package
   tests — run explicitly).
3. **Acceptance (Playwright, 390px iPhone / 412px Android / 1280px desktop,
   light + dark)**: all eight items from the brief, on the live studio
   copilot (public route) and on the support variant via a dev-only harness
   route mounting ChatThread with a scripted fake adapter (auth-free), plus
   the real account surface if a dev session is attainable. Evidence
   (screenshots) attached to the PR.

## Rollout

Feature branch `v3/chat-thread-rebuild` → PR to `main`, NOT merged. No flags:
the change is a UI swap on two surfaces with no schema/API changes; revert =
revert the PR. No migrations. Money untouched.
