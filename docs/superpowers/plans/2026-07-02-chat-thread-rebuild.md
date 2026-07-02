# ChatThread Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared full-viewport chat component (`@henryco/chat-thread`) consumed by the account support thread and the studio brief-intake copilot, fixing the mobile chat-layout defects (page scroll, avatar spam, global failure banner, overlay collisions, iOS keyboard).

**Architecture:** New source-shipped package `packages/chat-thread` (pure-logic core: grouping / outbox / follow, TDD'd; `ChatThread` client component owning a fixed `100dvh` viewport, ≤64px header, contained scroll pane, docked `ChatComposer`, per-message optimistic state). Account `/support/[threadId]` and studio `/request/copilot` migrate to it; `@henryco/messaging-thread`'s `MessageThread` and its four other consumers stay untouched.

**Tech Stack:** React 19 + Next 16 (source-transpiled workspace packages), plain CSS (`.ct-*` namespace, `--ct-*` tokens bridged to `--hc-*`/host tokens), `@henryco/chat-composer` (docked), `tsx --test` unit tests, Playwright MCP for acceptance.

## Global Constraints

- Worktree: `C:\Users\HP VICTUS\hc-chat-thread`, branch `v3/chat-thread-rebuild` (off origin/main c6c822d4). Never touch the main checkout.
- Do NOT modify: `packages/messaging-thread/src/thread.tsx` DOM/behavior, marketplace/jobs/studio-support/studio-portal surfaces, any server route logic (support reply/upload, brief-chat actions), migrations, money.
- No new hex colors (magic-hex ban, packages/ui/src/styles/globals.css:111). Brand: gold = `--hc-accent` (#C9A227 light / #D4AF37 dark), cream `#F5F1E8` only via existing tokens, ink via `--hc-bg`/BRAND.ink. Note: "onyx #0B0B0D" from the brief does not exist in the codebase — use existing ink tokens.
- Shared package copy = label-injection props with English defaults; app copy through `translateSurfaceLabel` (Pattern A). New literals in apps = new i18n GAPs = `i18n:check:strict` failure.
- No Tailwind classes inside the new package (plain CSS only — avoids the delivery-pip content-glob trap).
- `packages are consumed as source`: new package must be added to consuming apps' `next.config` `transpilePackages` AND its stylesheet imported in each app's `globals.css`.
- Tests: root `tsx` devDep (`tsx --test`), no per-package tsx/jest. No jsdom — component behavior is verified via Playwright, logic via pure functions.
- Windows gates: `pnpm -r --workspace-concurrency=1 --filter "./apps/*" run build` (never plain `build:all` locally).
- Composer failure contract: hosts signal failure by THROWING from onSend; resolving clears text + draft. ChatThread resolves onSend at dispatch (optimistic), so composer clears instantly and per-message state takes over.
- `enableTypingPresence`-style identity rules don't apply here (no cross-user presence on either migrated surface; copilot is user↔AI, support typing presence is dropped in this pass — noted in PR).
- Commits: small, `feat(chat-thread):` / `refactor(account):` / `refactor(studio):` style, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Package scaffold + message types

**Files:**
- Create: `packages/chat-thread/package.json`
- Create: `packages/chat-thread/tsconfig.json`
- Create: `packages/chat-thread/src/types.ts`
- Create: `packages/chat-thread/src/index.ts`

**Interfaces:**
- Produces: `ChatThreadMessage`, `ChatAttachment`, `ChatDeliveryState`, `ChatSendResult`, `ChatThreadLabels` — consumed by every later task.

- [ ] **Step 1: package.json** (versions copied from `packages/messaging-thread/package.json`; check `lucide-react` version there and reuse)

```json
{
  "name": "@henryco/chat-thread",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles.css",
    "./types": "./src/types.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "tsx --test src/__tests__/*.test.ts"
  },
  "dependencies": {
    "@henryco/chat-composer": "workspace:^",
    "@henryco/messaging-thread": "workspace:^",
    "lucide-react": "<same as messaging-thread>"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "<same as messaging-thread>"
  }
}
```

- [ ] **Step 2: tsconfig.json** — copy `packages/messaging-thread/tsconfig.json` verbatim (strict, noEmit, jsx react-jsx, moduleResolution bundler, `include: ["src/**/*"]`, `types: []`). The test file imports only pure TS, so `types: []` holds; if `tsx --test` needs node types for `node:test`, use `/// <reference types="node" />` — no: instead follow @henryco/messaging pattern for tests (they run under tsx with its own resolution; `import { test } from "node:test"` works without lib types at runtime; for typecheck, exclude `src/__tests__` from tsconfig include and list `"include": ["src/**/*"], "exclude": ["src/__tests__"]`).

- [ ] **Step 3: src/types.ts**

```ts
export type ChatAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
  width?: number;
  height?: number;
};

export type ChatDeliveryState = "sending" | "sent" | "delivered" | "read" | "failed";

export type ChatAuthorRole = "viewer" | "other" | "system";

export type ChatThreadMessage = {
  id: string;
  authorId: string | null;
  authorName?: string;
  authorRole: ChatAuthorRole;
  body: string;
  createdAt: string; // ISO
  attachments?: ChatAttachment[];
  deliveryState?: ChatDeliveryState | null;
  failReason?: string | null;
};

export type ChatSendPayload = { body: string; attachments?: ChatAttachment[] };

export type ChatSendResult =
  | { ok: true; message?: ChatThreadMessage }
  | { ok: false; reason?: string };

export type ChatThreadLabels = {
  newMessages?: string;      // "New messages"
  retry?: string;            // "Didn't send — tap to retry"
  sending?: string;          // "Sending…"
  sent?: string;             // "Sent"
  delivered?: string;        // "Delivered"
  read?: string;             // "Read"
  typing?: string;           // "Typing…"
  today?: string;            // "Today"
  yesterday?: string;        // "Yesterday"
  back?: string;             // "Back"
  live?: string;             // "Live"
  reconnecting?: string;     // "Reconnecting…"
  systemName?: string;       // "System"
};
```

- [ ] **Step 4: src/index.ts** (grows over later tasks; start with types re-export)

```ts
export type {
  ChatAttachment,
  ChatAuthorRole,
  ChatDeliveryState,
  ChatSendPayload,
  ChatSendResult,
  ChatThreadLabels,
  ChatThreadMessage,
} from "./types";
```

- [ ] **Step 5: register workspace + verify install**

Run: `pnpm install --prefer-offline` (root). Expected: lockfile picks up `@henryco/chat-thread`.

- [ ] **Step 6: Commit** — `feat(chat-thread): scaffold @henryco/chat-thread package`

---

### Task 2: `grouping.ts` (TDD)

**Files:**
- Create: `packages/chat-thread/src/__tests__/grouping.test.ts`
- Create: `packages/chat-thread/src/grouping.ts`

**Interfaces:**
- Produces:
  - `GROUP_WINDOW_MS = 120_000`
  - `type ThreadViewItem = { kind: "day"; key: string; label: "today" | "yesterday" | "earlier"; date: Date } | { kind: "group"; key: string; authorId: string | null; authorName?: string; authorRole: ChatAuthorRole; messages: ChatThreadMessage[] }`
  - `buildThreadView(messages: ChatThreadMessage[], opts?: { groupWindowMs?: number; now?: Date }): ThreadViewItem[]`

Behavior: input assumed ascending by `createdAt` (defensively re-sorted, stable). A `day` item precedes the first message of each local calendar day, labeled today/yesterday/earlier relative to `opts.now` (default `new Date()`; tests always pass `now`). A group breaks when author id changes, author role changes, gap from the PREVIOUS message > groupWindowMs, day changes, or role is `system` (system messages are always single-message groups). Group key = first message id; day key = `day-<yyyy-mm-dd>` local.

- [ ] **Step 1: failing tests** — cover: five same-sender messages within 2 min → one group of 5; sender change breaks; 121s gap breaks while 119s doesn't; day rollover inserts day item AND breaks group; today/yesterday/earlier labels; system single; unsorted input re-sorted stable; empty input → [].

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildThreadView } from "../grouping";
import type { ChatThreadMessage } from "../types";

const NOW = new Date("2026-07-02T12:00:00");
const msg = (id: string, author: string, atIso: string, over: Partial<ChatThreadMessage> = {}): ChatThreadMessage => ({
  id, authorId: author, authorRole: author === "me" ? "viewer" : "other",
  body: `body-${id}`, createdAt: atIso, ...over,
});

test("five same-sender messages within window form one group", () => {
  const list = [0, 30, 60, 90, 110].map((s, i) => msg(`m${i}`, "me", `2026-07-02T10:00:${String(s).padStart(2, "0")}`));
  const view = buildThreadView(list, { now: NOW });
  const groups = view.filter((v) => v.kind === "group");
  assert.equal(groups.length, 1);
  assert.equal(groups[0].kind === "group" && groups[0].messages.length, 5);
});

test("sender change breaks the group", () => {
  const view = buildThreadView([msg("a", "me", "2026-07-02T10:00:00"), msg("b", "you", "2026-07-02T10:00:10")], { now: NOW });
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("gap over window breaks; at/below window keeps", () => {
  const kept = buildThreadView([msg("a", "me", "2026-07-02T10:00:00"), msg("b", "me", "2026-07-02T10:01:59")], { now: NOW });
  assert.equal(kept.filter((v) => v.kind === "group").length, 1);
  const broken = buildThreadView([msg("a", "me", "2026-07-02T10:00:00"), msg("b", "me", "2026-07-02T10:02:01")], { now: NOW });
  assert.equal(broken.filter((v) => v.kind === "group").length, 2);
});

test("day rollover emits day pill and breaks group", () => {
  const view = buildThreadView([msg("a", "me", "2026-07-01T23:59:00"), msg("b", "me", "2026-07-02T00:00:30")], { now: NOW });
  const days = view.filter((v) => v.kind === "day");
  assert.equal(days.length, 2);
  assert.deepEqual(days.map((d) => d.kind === "day" && d.label), ["yesterday", "today"]);
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("system messages never group", () => {
  const view = buildThreadView([
    msg("a", "sys", "2026-07-02T10:00:00", { authorRole: "system", authorId: null }),
    msg("b", "sys", "2026-07-02T10:00:05", { authorRole: "system", authorId: null }),
  ], { now: NOW });
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("unsorted input is sorted ascending; empty returns empty", () => {
  const view = buildThreadView([msg("b", "me", "2026-07-02T10:05:00"), msg("a", "me", "2026-07-02T10:00:00")], { now: NOW });
  const g = view.find((v) => v.kind === "group");
  assert.ok(g && g.kind === "group" && g.messages[0].id === "a");
  assert.deepEqual(buildThreadView([], { now: NOW }), []);
});
```

- [ ] **Step 2: run, expect FAIL** — `pnpm --filter @henryco/chat-thread test` → module not found.
- [ ] **Step 3: implement `grouping.ts`** — pure; local-day key via `new Date(iso)` getFullYear/Month/Date; label by comparing day keys of `now` and `now - 86400000`.
- [ ] **Step 4: run, expect PASS.**
- [ ] **Step 5: Commit** — `feat(chat-thread): message grouping + date separators (TDD)`

---

### Task 3: `outbox.ts` (TDD)

**Files:**
- Create: `packages/chat-thread/src/__tests__/outbox.test.ts`
- Create: `packages/chat-thread/src/outbox.ts`

**Interfaces:**
- Produces:
  - `type OutboxEntry = { localId: string; body: string; attachments?: ChatAttachment[]; createdAt: string; state: "sending" | "failed"; failReason?: string | null }`
  - `type OutboxState = { entries: OutboxEntry[]; counter: number }`
  - `emptyOutbox(): OutboxState`
  - `outboxAppend(s, input: { body; attachments?; now: string }): { state: OutboxState; localId: string }` — localId = `local-<counter>`
  - `outboxFail(s, localId, reason?: string | null): OutboxState`
  - `outboxRetry(s, localId): OutboxState` — state→sending, keeps createdAt/position
  - `outboxAck(s, localId): OutboxState` — removes entry
  - `mergeOutbox(server: ChatThreadMessage[], confirmed: ChatThreadMessage[], s: OutboxState, viewer: { id: string; name?: string }): ChatThreadMessage[]` — server list, then confirmed-local messages whose id is NOT already in server (dedupe), then outbox entries as viewer messages (`deliveryState: entry.state === "failed" ? "failed" : "sending"`, id = localId).

- [ ] **Step 1: failing tests** — append yields sending entry + incremented ids; fail marks with reason; retry restores sending, same position/createdAt; ack removes; merge dedupes confirmed vs server by id, appends outbox last in counter order; ten rapid appends keep order `local-0..local-9`.
- [ ] **Step 2: run, FAIL.** — `pnpm --filter @henryco/chat-thread test`
- [ ] **Step 3: implement.** Immutable updates only.
- [ ] **Step 4: run, PASS.**
- [ ] **Step 5: Commit** — `feat(chat-thread): optimistic outbox with per-message retry (TDD)`

---

### Task 4: `follow.ts` (TDD)

**Files:**
- Create: `packages/chat-thread/src/__tests__/follow.test.ts`
- Create: `packages/chat-thread/src/follow.ts`

**Interfaces:**
- Produces:
  - `FOLLOW_THRESHOLD_PX = 120`
  - `isNearBottom(scrollTop: number, clientHeight: number, scrollHeight: number, threshold?: number): boolean`
  - `type FollowState = { following: boolean; unseen: number }`
  - `initialFollow(): FollowState` → `{ following: true, unseen: 0 }`
  - `onScrollPosition(s, near: boolean): FollowState` — near → following:true, unseen:0; far → following:false, unseen kept
  - `onIncoming(s, count: number, own: boolean): FollowState` — own → following:true unseen:0 (own send always pins); other while following → unchanged; other while not following → unseen+count

- [ ] **Step 1: failing tests** — threshold boundary (exactly 120 = near; 121 = far); own send pins from scrolled-up; unseen accumulates then clears on scroll-to-bottom.
- [ ] **Step 2: run, FAIL.**  **Step 3: implement.**  **Step 4: run, PASS.**
- [ ] **Step 5: Commit** — `feat(chat-thread): follow-state machine (TDD)`

---

### Task 5: additive `@henryco/chat-composer` props

**Files:**
- Modify: `packages/chat-composer/src/types.ts` (ComposerProps)
- Modify: `packages/chat-composer/src/composer/ChatComposer.tsx`
- Modify: `packages/chat-composer/src/composer/AutosizeTextarea.tsx` (only if maxRows isn't already a prop — it is (`maxRows?: number` default 6 per current source); verify and thread through)
- Modify: `packages/chat-composer/src/hooks/useComposerKeyboard.ts`

**Interfaces:**
- Produces: `ComposerProps.enterKeyBehavior?: "newline" | "send"` (default `"newline"` — EXACTLY today's behavior: plain Enter = newline, Cmd/Ctrl+Enter = send) and `ComposerProps.maxRows?: number` (default 6). With `"send"`: plain Enter (without shift) submits, Shift+Enter = newline, Cmd/Ctrl+Enter still submits.

- [ ] **Step 1:** add both props to `ComposerProps` with doc comments; thread `maxRows` to the inline `<AutosizeTextarea maxRows={maxRows ?? 6}>`; extend `useComposerKeyboard(opts)` with `enterSends: boolean` (default false) — when true and `event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey`, prevent default and submit.
- [ ] **Step 2:** typecheck the package: `pnpm --filter @henryco/chat-composer typecheck` → PASS. Grep the five existing consumers to confirm none pass the new props (no behavior change).
- [ ] **Step 3: Commit** — `feat(chat-composer): additive enterKeyBehavior + maxRows props`

---

### Task 6: ChatThread component + styles + keyboard/realtime hooks

**Files:**
- Create: `packages/chat-thread/src/chat-thread.tsx` (ChatThread + header + pane + chip + bubbles + typing + suggestions)
- Create: `packages/chat-thread/src/use-keyboard-inset.ts`
- Create: `packages/chat-thread/src/use-thread-realtime.ts`
- Create: `packages/chat-thread/src/from-thread-message.ts`
- Create: `packages/chat-thread/src/styles.css`
- Modify: `packages/chat-thread/src/index.ts`

**Interfaces:**
- Consumes: Tasks 2–4 pure modules; `ChatComposer`, `AttachmentUploader`, `ComposerLabels` from `@henryco/chat-composer`; `ThreadMessage`, `ThreadSupabaseLike`, `ThreadChannelLike` types from `@henryco/messaging-thread/types`.
- Produces:

```ts
export type ChatThreadHeaderProps = {
  title: string;
  status?: React.ReactNode;          // small status line under the title
  backHref?: string;
  onBack?: () => void;
  actions?: React.ReactNode;         // trailing slot
  live?: "live" | "reconnecting" | null; // renders dot + label in status line
};

export type ChatThreadProps = {
  variant: "assistant" | "support";
  viewer: { id: string; name?: string };
  messages: ChatThreadMessage[];      // server/host-confirmed, ascending
  onSendMessage: (p: ChatSendPayload) => Promise<ChatSendResult>;
  header: ChatThreadHeaderProps;
  typing?: boolean;                   // assistant: animated indicator
  suggestions?: { id: string; label: string; kind?: "default" | "primary" }[];
  onSuggestion?: (id: string) => void;
  otherAvatar?: React.ReactNode;      // group avatar for the other party
  renderBody?: (m: ChatThreadMessage) => React.ReactNode; // markdown hook
  labels?: ChatThreadLabels;
  composer?: {
    placeholder?: string;
    disabled?: boolean;
    tone?: "account" | "care" | "jobs" | "marketplace" | "studio" | "neutral";
    enterKeyBehavior?: "newline" | "send";
    autoFocus?: boolean;
    enableAttachments?: boolean;
    uploader?: AttachmentUploader;
    maxAttachments?: number;
    acceptedMimeTypes?: string[];
    labels?: ComposerLabels;
    extras?: (ctx: { draft: string; setDraft: (v: string) => void }) => React.ReactNode;
  };
  fillViewport?: boolean;             // wrap in .ct-viewport (100dvh − --ct-viewport-offset)
  className?: string;
  emptyState?: React.ReactNode;
};
export function ChatThread(props: ChatThreadProps): JSX.Element;
export function useThreadRealtime(opts: {
  getSupabase?: () => ThreadSupabaseLike | null;
  channelName: string;
  table: string; schema?: string; filter: string;
  onInsert: (row: Record<string, unknown>) => void;
  enabled?: boolean;
}): { status: "connecting" | "live" | "reconnecting" };
export function fromThreadMessage(m: ThreadMessage): ChatThreadMessage; // viewer↔viewer, team→other, system→system; readAt→read, deliveredAt→delivered, else sent
```

**Component internals (binding decisions):**

1. State: `confirmed` (acked messages not yet in `props.messages`, deduped by id each render), `outbox` (Task 3), `follow` (Task 4), `unseenAnchor`.
2. Merged list = `mergeOutbox(props.messages, confirmed, outbox, viewer)`; view = `buildThreadView(merged)`; React keys = item.key / message.id — never index.
3. Send: dispatch → `outboxAppend` → resolve composer promise immediately → `onSendMessage(payload)` async: ok → `outboxAck` + push `result.message` (if provided and not in props) into `confirmed`; !ok/throw → `outboxFail(localId, reason)`. Retry button → `outboxRetry` + re-run the same async block. Own dispatch calls `onIncoming(s, 1, true)` → pin.
4. Scroll: pane ref + `useLayoutEffect` on first paint → `scrollTop = scrollHeight` (instant mount pin, no animation). Effect on merged-length change → if `follow.following`, pin instantly; else `onIncoming(s, delta, false)` → chip shows `labels.newMessages`. Pane `onScroll` (passive) → `onScrollPosition(s, isNearBottom(...))`. Chip click → smooth scroll to bottom (respect `prefers-reduced-motion` → auto).
5. Keyboard (`use-keyboard-inset.ts`): visualViewport `resize` + `scroll` listeners → `inset = max(0, innerHeight − vv.height − vv.offsetTop)` → set `--ct-kb-inset` (px) on root element; after each change, if following, rAF re-pin. SSR-safe (no-op without `window.visualViewport`).
6. Composer host measured via ResizeObserver → `--ct-composer-h` on root → `.ct-pane { scroll-padding-bottom: var(--ct-composer-h) }`.
7. Bubbles: group avatar rendered ONCE per group (other-party only; `otherAvatar` or initials), one timestamp per group (last message time); intra-group gap 4px, inter-group 18px; own right / other left; `max-width: 78%`; `overflow-wrap: anywhere`. Delivery meta on own messages: sending → `labels.sending`, sent → SENT badge (support), failed → `.ct-retry` button (`labels.retry`) wired to retry. Images: `.ct-media { aspect-ratio: W/H | 4/3; }` fixed box, `object-fit: cover`, tap opens in new tab; non-image attachments as name chips.
8. Typing indicator (assistant): last item in pane, three-dot CSS animation, `aria-live` label `labels.typing`; suppressed under reduced motion (static label).
9. Suggestions row: `.ct-suggestions` horizontally scrollable chips ABOVE composer; `kind: "primary"` = accent-filled chip.
10. A11y: pane `role="log"` + visually-hidden `aria-live="polite"` announcer for incoming other-party messages (port the engine's pattern); header is a `<header>`, back is a link/button ≥44px hit area.
11. `use-thread-realtime.ts`: faithful port of `packages/messaging-thread/src/thread.tsx` realtime effect (INSERT subscription, 1.5s→15s capped backoff, CHANNEL_ERROR/TIMED_OUT/CLOSED reconnect, cleanup) minus typing-presence; returns status only, host merges rows.

**styles.css skeleton (complete class list — final code in implementation):** `.ct-viewport` (`height: calc(100dvh - var(--ct-viewport-offset, 0px) - var(--ct-kb-inset, 0px))`), `.ct-screen` (flex column, overflow hidden, min-height 0, background var(--ct-bg)), `.ct-header` (min-height 56px, max-height 64px, flex row, border-bottom hairline, backdrop blur optional), `.ct-header-back`, `.ct-header-titles` (truncate), `.ct-header-status` (12px, muted, live dot `.ct-live-dot[data-state]`), `.ct-header-actions`, `.ct-pane` (flex:1, min-height:0, overflow-y:auto, overscroll-behavior:contain, -webkit-overflow-scrolling:touch, scroll-padding-bottom), `.ct-col` (max-width 44rem, margin-inline auto, padding), `.ct-day` (centered pill), `.ct-group` (+`[data-side=own|other|system]`), `.ct-avatar`, `.ct-bubble` (+first/middle/last radius), `.ct-meta`, `.ct-badge` (SENT), `.ct-retry` (button-styled failure line), `.ct-media`, `.ct-chip-wrap` (position:relative anchor) + `.ct-chip` (absolute bottom center above composer), `.ct-typing` (3 dots), `.ct-suggestions` + `.ct-suggestion[data-kind]`, `.ct-composer` (padding-bottom env(safe-area-inset-bottom)), token block `--ct-*` with fallbacks to `--hc-*`/dark values, `@media (prefers-reduced-motion: reduce)` kill-switch, light theme driven purely by host token overrides.

- [ ] **Step 1:** write `styles.css`, `use-keyboard-inset.ts`, `from-thread-message.ts`, `chat-thread.tsx`, `use-thread-realtime.ts`; export all from `index.ts`.
- [ ] **Step 2:** `pnpm --filter @henryco/chat-thread typecheck` → PASS; `pnpm --filter @henryco/chat-thread test` → PASS (pure modules unaffected).
- [ ] **Step 3: Commit** — `feat(chat-thread): full-viewport ChatThread component, keyboard + realtime hooks, styles`

---

### Task 7: i18n labels builder (additive)

**Files:**
- Modify: `packages/i18n/src/messaging-chrome-copy.ts`

**Interfaces:**
- Produces: `buildChatThreadLabels(t: (s: string) => string): { threadLabels: ChatThreadLabels-shaped object; composerLabels: ComposerLabels }` — reuses the existing composer-label block; new thread strings (English sources byte-identical to package defaults): "New messages", "Didn't send — tap to retry", "Sending…", "Sent", "Delivered", "Read", "Typing…", "Today", "Yesterday", "Back", "Live", "Reconnecting…", "System".

- [ ] **Step 1:** add builder (type the return locally in the i18n package to avoid a dependency on the new package — plain object typing, documented as mirroring `@henryco/chat-thread` `ChatThreadLabels`).
- [ ] **Step 2:** `pnpm --filter @henryco/i18n typecheck` (or app typecheck later). Commit — `feat(i18n): buildChatThreadLabels chrome copy`

---

### Task 8: dev harness route (acceptance rig)

**Files:**
- Create: `apps/account/app/dev/chat-thread/page.tsx` (server: `notFound()` unless `process.env.NODE_ENV === "development"`)
- Create: `apps/account/app/dev/chat-thread/HarnessClient.tsx`
- Modify: `apps/account/next.config.ts` (add `@henryco/chat-thread` to transpilePackages)
- Modify: `apps/account/app/globals.css` (import `@henryco/chat-thread/styles` next to the messaging-thread import)

**Behavior:** mounts `ChatThread` (support variant, fillViewport) with a scripted fake:
- `onSendMessage`: resolves ok after 600ms with echo message; body containing `fail` → `{ ok:false, reason:"Simulated failure" }`; body `slow` → 3s delay.
- Control buttons (rendered OUTSIDE the chat screen is impossible in fill mode — put them in `header.actions`): "+1 incoming" (appends other-party message), "+image" (appends message with a picsum 800×600 attachment `width:800,height:600`), "burst 10" (10 rapid incoming), theme toggle (`document.documentElement.classList.toggle("dark")`), variant toggle (assistant/support: typing + suggestions demo).
- All literals through `translateSurfaceLabel` (Pattern A) to keep `i18n:check:strict` green.

- [ ] Steps: implement → `pnpm --filter @henryco/account typecheck` PASS → commit `feat(account): dev-only ChatThread harness route`.

---

### Task 9: account support thread migration

**Files:**
- Create: `apps/account/components/support/SupportChatScreen.tsx` (new client host; replaces SupportThreadRoom's role on this page)
- Modify: `apps/account/app/(account)/support/[threadId]/page.tsx`
- Modify: `apps/account/components/support/AccountSupportThreadAdapter.ts` (read `reason` in addition to `error` on failure — surfaces localized contact-blocked copy)
- Modify: `apps/account/components/support/editorial.css` (prepend `.acct-chat-stage` rules; old `.acct-support-stage` thread rules become inert but stay for now)
- Keep: `SupportThreadRoom.tsx` (still exported; delete only if final grep shows no other importer — the thread page will no longer import it)

**Interfaces:**
- Consumes: `ChatThread`, `useThreadRealtime`, `fromThreadMessage`, `buildChatThreadLabels`, existing adapter + `signSupportMessageAttachments` server flow, existing `ActionMenu`/`DownloadDocumentButton` from SupportThreadHeader's imports.

**Page structure (server):**

```tsx
<div className="acct-chat-stage">
  <RouteLiveRefresh intervalMs={10000} />
  <SupportChatScreen
    threadId={thread.id}
    subject={thread.subject}
    statusLine={`${statusLabel} · ${divisionLabel}`}
    isClosed={isClosed}
    initialMessages={signedMessages}   // same signing path as today
    viewer={{ userId, fullName }}
    locale={locale}
    /* download/mute/report props preserved from the old header */
  />
</div>
```

HeroCard, SupportThreadHeader, ThreadAppearanceProvider are REMOVED from this page (list page untouched). The appearance/customization gear is dropped on this screen (it targets `.mt-*`; PR notes this).

**SupportChatScreen (client):**
- `messages` state seeded from `initialMessages` (useState initializer — same refresh semantics as the engine); realtime via `useThreadRealtime` with adapter's channel/table/filter (`support-thread-${id}`, `support_messages`, `thread_id=eq.`), `onInsert` → `rowToMessage` → skip own-sender → append + `markReadAction`; `markReadAction` also on mount.
- `onSendMessage` → adapter `sendAction` FormData (unchanged endpoint); ok → return `{ ok:true, message: fromThreadMessage(result.message) }` and append to state; fail → `{ ok:false, reason }`.
- Composer: attachments ON via existing `attachAction` uploader bridge (port the 15→100 progress bridge from the engine verbatim), tone `account`, extras = `<ContactSafetyHint text={ctx.draft} />`, disabled when closed.
- Header: backHref `/support`, title subject, status = statusLine, live = realtime status, actions = overflow ActionMenu (download PDF, mute, report, copy link/ID — same handlers as SupportThreadHeader today).
- Labels: `buildChatThreadLabels(t)` + `buildMessagingChromeLabels(t).composerLabels`.
- `renderBody`: reuse the markdown renderer? `renderMarkdownBody` lives in messaging-thread (`markdown.tsx`, exported?) — check `src/index.ts`; if not exported, render plain text with newlines (support bodies are plain text + the engine had renderMarkdown=true — check what account passes: it passes renderMarkdown. Import the markdown renderer from `@henryco/messaging-thread` if exported; else add an export there (additive) or inline a call to the same module path. Decision: additive named export `renderMessageMarkdown` from messaging-thread index (safe, no behavior change).

**editorial.css additions (scoped to the new stage):**

```css
/* ChatThread full-immersion stage (all widths) */
.hc-shell-main > div:has(.acct-chat-stage) { max-width: none; padding: 0; }
main.hc-shell-main:has(.acct-chat-stage) { padding-bottom: 0; }
body:has(.acct-chat-stage) .acct-mobile-dashnav__trigger,
body:has(.acct-chat-stage) [data-hc-bottom-action-bar] { display: none; }
.acct-chat-stage { /* token bridge */
  --ct-bg: var(--acct-bg); --ct-ink: var(--acct-ink); /* … map the small --ct-* contract to --acct-* */
}
```

(Confirm the BottomActionBar root selector — read `packages/*/bottom-action-bar.tsx` for its class/attr; add `data-hc-bottom-action-bar` attribute there if none exists — additive.)

- [ ] Steps: implement → `pnpm --filter @henryco/account typecheck` + `pnpm --filter @henryco/account test` PASS → commit `refactor(account): support thread on shared ChatThread (fixed viewport, grouped messages, per-message retry)`.

---

### Task 10: studio brief copilot migration

**Files:**
- Modify: `apps/studio/components/studio/copilot-chat/copilot-chat.tsx`
- Delete usage of: `apps/studio/components/studio/copilot-chat/chat-message.tsx` (delete file if no other importer)
- Modify: `apps/studio/app/request/copilot/page.tsx` (stage class + container; keep catalog fetch)
- Modify: `apps/studio/next.config.ts` (transpilePackages + `@henryco/chat-thread`)
- Modify: `apps/studio/app/globals.css` (import chat-thread styles; `.studio-chat-stage` token bridge to `--home-*`/`--studio-*`; `body:has(.studio-chat-stage) .hc-assist-trigger { display:none }` — confirm SupportAssist trigger class from packages/ui/src/support/SupportAssist.tsx)

**Copilot rebuild (keeps ALL business logic):**
- Transcript stays `useFormDraft<BriefChatMessage[]>("studio-copilot-chat", [], {version:1})`. Mapping to `ChatThreadMessage[]`: `id: \`t-${index}\``, opener prepended as display-only `{ id:"opener", authorRole:"other" }` (NOT in stored transcript — invariant preserved); user turns `authorRole:"viewer"`, assistant `"other"`. Append-only list ⇒ index-derived ids are stable (documented in code comment).
- `onSendMessage({ body })`: `next = [...messages, {role:"user", content: body}]` → `continueStudioBriefChatAction({ messages: next })`; ok → `setMessages([...next, { role:"assistant", content: res.reply }])`, `setReady(res.ready)`, return `{ ok:true, message:{ id:\`t-${next.length-1}\`, authorId: "viewer", authorRole:"viewer", body, createdAt: new Date().toISOString() } }`; !ok → `{ ok:false, reason: res.message }`; throw → `{ ok:false, reason: t("That didn't go through. Try sending again.") }` — rendered inline on the failed bubble (global warn line deleted).
- `typing={sending}`; suggestions: transcript empty → three localized example-brief chips (send on tap); `ready || assistantTurns >= 3` → primary chip "Build my brief" → `finalize()` (existing flow untouched, including the LoaderCircle takeover which replaces the screen during finalize).
- Header: backHref `/request`, title = existing h1 copy ("Talk it through" heading), status = existing kicker copy; no hero block inside the chat screen.
- Composer: tone `studio`, `enterKeyBehavior: "send"` (preserves current Enter-to-send), autoFocus, attachments OFF.
- framer `messageIn` removed on this surface (package CSS entrance is reduced-motion-gated).
- Viewport: page renders `.studio-chat-stage` wrapper (fixed 100dvh, only pane scrolls, all widths); `.ct-col` centers content at chat width.

- [ ] Steps: implement → `pnpm --filter @henryco/studio typecheck` + `pnpm --filter @henryco/studio test` PASS → commit `refactor(studio): brief copilot on shared ChatThread (assistant variant)`.

---

### Task 11: gates

- [ ] `pnpm --filter @henryco/chat-thread test` + `typecheck` — PASS
- [ ] `pnpm --filter @henryco/messaging-thread test` + `pnpm --filter @henryco/chat-composer typecheck` — PASS (no regressions)
- [ ] `pnpm -r --workspace-concurrency=1 --filter "./apps/*" run lint` — PASS
- [ ] `pnpm -r --workspace-concurrency=1 --filter "./apps/*" run typecheck` — PASS
- [ ] `pnpm run i18n:check:strict` — PASS (no new GAPs)
- [ ] `pnpm run tone:check` — PASS
- [ ] `pnpm run test:workspace` — PASS
- [ ] `pnpm -r --workspace-concurrency=1 --filter "./apps/*" run build` — PASS
- [ ] account + studio app test scripts — PASS
- [ ] Commit any fixes.

---

### Task 12: Playwright acceptance (8 items × 3 widths × light/dark)

Rig: `pnpm --filter @henryco/account dev` (harness at `/dev/chat-thread`) and `pnpm --filter @henryco/studio dev` (`/request/copilot`, public). Widths: 390×844 (iPhone), 412×915 (Android), 1280×800 (desktop).

Checklist per the brief:
1. Only pane scrolls (scroll page body → no movement; pane scrolls).
2. Keyboard open/close — emulate visualViewport shrink (resize viewport height with composer focused); composer visible, thread position preserved.
3. 10 rapid sends → pinned, optimistic → reconciled (no dup, no flicker).
4. Scroll up ≥300px → inject incoming → NO yank + chip appears → tap → bottom.
5. 5 consecutive same-sender messages → exactly ONE avatar + ONE timestamp.
6. Image message → scroll position unchanged during load (aspect-ratio box).
7. Send "fail" → inline retry on that bubble → tap → succeeds (message reconciles).
8. Header ≤64px (bounding box), nothing overlaps composer (Dashboard pill + LIVE pill absent/relocated; SupportAssist hidden on copilot). Light + dark.

- [ ] Run all, screenshot evidence to `docs/superpowers/specs/assets/chat-thread/` (or PR upload), fix failures, re-run.
- [ ] Real-surface smoke: studio copilot live (anon). Account real thread if dev auth is available; otherwise harness stands in (note in PR).

---

### Task 13: adversarial review + fixes

- [ ] Workflow fan-out: reviewers over (a) regressions in the 4 untouched MessageThread consumers (grep for accidental shared-file edits), (b) silent failures in the new send/retry paths, (c) CSS/token leaks between `.ct-*`/`.mt-*`, (d) i18n/a11y, (e) spec-compliance vs the 8 acceptance items. Verify each finding before fixing.
- [ ] Fix confirmed findings, re-run affected gates, commit.

### Task 14: push + PR (never merge)

- [ ] `git push -u origin v3/chat-thread-rebuild`
- [ ] `gh pr create` → title `feat(chat): shared ChatThread — fixed-viewport chat for account support + studio brief copilot`; body: problem, architecture decision (package location rationale vs packages/ui), surfaces migrated, explicitly-untouched list, acceptance evidence table (8 items × 3 widths), gates output, known follow-ups (editorial.css cleanup, appearance menu, remaining MessageThread consumers convergence, typing presence). Footer: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

## Self-review notes

- Spec coverage: every layout/scroll/message/variant/acceptance requirement maps to Tasks 6/8/9/10/12; brand tokens Task 6 CSS; overlays Task 9 (Dashboard/LIVE) + Task 10 (SupportAssist); global banner deletion Tasks 9/10; PR-not-merge Task 14.
- Types consistent: `ChatThreadMessage`/`ChatSendResult` defined Task 1, consumed 3/6/9/10; outbox API defined Task 3 = used in Task 6 internals; `buildChatThreadLabels` Task 7 = used 9/10.
- Known deliberate deviations from the brief (documented in spec + PR): package lives in `packages/chat-thread` not `packages/ui` (dependency cycle); "onyx #0B0B0D" replaced by canonical ink tokens (magic-hex ban); Dashboard pill/BottomActionBar hidden on the thread screen rather than "moved".
