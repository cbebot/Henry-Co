# PASS 24 — Support Chat: Workspace-Grade Upgrade

**Branch:** `feat/pass-24-msg-composer-unify`
**Goal:** Bring the support thread surface across user, owner, and staff dashboards to studio-workspace parity and beyond.
**Reference standard:** the studio `/client/projects/[id]/messages` ProjectThread surface (the strongest messaging surface in the ecosystem prior to this pass).

This pass shipped in four phases on the same branch:

| Phase | Commit | Title |
|---|---|---|
| 1 | `35a7be4c` | unify thread composer onto ChatComposer |
| 2 | `adcdfe47` | rich rendering (markdown subset, file chips, read-receipt status line, polite SR announcer, message-arrival fade-in) |
| 3 | `a7e36b30` | account host migration + workspace-grade header on `/support/[threadId]` |
| 4 | `8a3f2374` | studio host migration + workspace-grade header on `/support/[threadId]` |

---

## 1. Header and thread navigation

### Account (customer-facing) — Phase 3
`apps/account/components/support/SupportThreadHeader.tsx`

- Division pill (Care / Studio / Account / …) + category pill (Billing & Payments / Care Service / …)
- Status pill — open / awaiting / resolved / closed with tone classes; the "open" dot pulses every 2.2s (`prefers-reduced-motion` aware)
- Two-line subject clamp so very long subjects don't break layout
- Branded **Download thread** action (Web Share API on touch devices, direct download on desktop)
- Accessible overflow menu (`role="menu"`, ESC + outside-click close, focus restore on close, first-item focus on open):
  - Copy thread link
  - Copy thread ID
  - "Download (use the action above)" — IA placeholder so the menu stays consistent even though the primary affordance lives on the header itself
- Footer caption with thread subject for context inside the menu

### Studio (owner + client_success staff) — Phase 4
`apps/studio/components/studio/support/StudioSupportThreadHeader.tsx`

- Same surface, tinted with studio's mint/copper palette via `--studio-*` tokens
- Adds a **priority pill** (Normal / High / Urgent / Low) since priority is a staff-relevant signal that customers don't see
- Studio-flavoured download button (`StudioDownloadButton`) — same Web Share / direct download two-mode pattern, mint surface

### Care (staff inbox) — Phase 1
Already shipped in Phase 1: care's existing `SupportThreadWorkspace` (`apps/care/components/support/SupportThreadWorkspace.tsx`) was retained because care's workflow is multi-channel (email + WhatsApp delivery, not real-time chat). Status + urgency pills already exist on the existing surface; quick actions (Reply / Assign / status) are intact.

---

## 2. Composer architecture (focus retention, draft memory, attachments)

All three hosts now route through `@henryco/chat-composer`'s `ChatComposer` (Phase 1 unification). The engine `MessageThread` mounts ChatComposer below the bubble list; the standalone care reply page renders ChatComposer directly. Inherited behaviors:

- **Mobile-stable keyboard** — composer focus is never dismissed on keystroke (root-cause fix from Pass 22 carries through)
- **16px minimum font-size** on mobile inputs (prevents iOS Safari zoom-on-focus)
- **Auto-grow textarea** with an internal scroll once the cap is reached
- **Image paste** + **file paste** + desktop **drag-and-drop**
- **Draft memory per thread per viewer** — IndexedDB primary, localStorage fallback, both keyed by `threadId` so sessions resume from any device or refresh
- **Multi-attachment with per-file upload progress** — engine drives uploads in parallel through `adapter.attachAction` and gates send until uploads complete or the user removes failed entries
- **Cmd/Ctrl+Enter** to send on desktop
- **No double-submit** — Send button is gated by `state.sending`, falls into disabled state on empty body + no attachments
- **Full-screen toggle** — desktop and mobile expand affordance, with focus trapping inside the full-screen overlay
- **Send shake** on failure with an in-line error region + retry; failed send doesn't clear the textarea

Per-host adapters route the actual writes:

| Host | Send route | Upload route | Mark-read route |
|---|---|---|---|
| Account `/support/[threadId]` | `/api/support/reply` (JSON) | `/api/support/upload` | `/api/support/mark-read` |
| Studio `/support/[threadId]` | `/api/support/reply` (JSON) | `/api/support/upload` | `/api/support/mark-read` |
| Care `/support/inbox/reply` | `sendSupportReplyAction` server action | n/a (email + WhatsApp transport) | n/a |

---

## 3. Message rendering changes (Phase 2)

`packages/messaging-thread/src/markdown.tsx` + `thread.tsx` + `styles.css`

- **Markdown subset** rendered as React nodes (no `innerHTML`, no dep, no sanitizer needed): bold, italic, code spans, blockquote, ordered + unordered lists, mailto/https links. Hand-rolled and gated by a single safe-protocol allowlist. Opt-in via `renderMarkdown` prop (Account + Studio enable it).
- **Bubble layout** — viewer (right) / team (left) / system (centered, muted), with arrival fade-in (`220ms ease-out, 4px lift`, reduced-motion aware) and dimmed `opacity: 0.65` on optimistic-state bubbles.
- **Sender, role, timestamp** on each bubble; for system messages, just the timestamp + body.
- **Read receipt status line** on viewer-owned bubbles — `Sending… → Sent → Delivered → Read`. The "Read" state tints to `--ws-signal` so the moment lands. Adapters opt in by populating `deliveredAt` / `readAt` on `ThreadMessage`; engine-only consumers stay at "Sent".
- **Inline image previews** with `aria-label` so SR users can open the image in a new tab.
- **Rich file chips** — paperclip glyph + filename on top, "TYPE · SIZE" meta on bottom (eg. "PDF · 2.4 MB"); `formatBytes()` picks B/KB/MB/GB; `formatTypeLabel()` maps common Office MIME subtypes (docx/xlsx/pptx/pdf/…) to short uppercase labels. Rendered inside a real `<ul>` for SR list semantics.

Reactions are intentionally not shipped yet — the architecture is ready (`senderRole` decoupled from interaction, optimistic-state pipe is in place), but the data layer + audience model needs its own design pass and isn't blocking on PASS 24.

---

## 4. Real-time and reliability changes (Phase 2 + 3)

`packages/messaging-thread/src/thread.tsx`

- **Per-thread Supabase Realtime subscription** keyed by `adapter.channelName(threadId)` + `adapter.subscriptionFilter(threadId)`.
- **Optimistic send with rollback** — the engine inserts a placeholder bubble at `data-pending="true"` opacity, calls `adapter.sendAction`, and on success replaces the bubble with the persisted ID returned in `{ messageId, message }`. On failure, the placeholder is removed and the send-error region shows the reason; the composer's shake animation fires.
- **Reconnect-on-drop** — explicit teardown + capped exponential back-off (1.5s → 15s) on `CHANNEL_ERROR / TIMED_OUT / CLOSED`, plus a small `mt-live-banner` so the user sees "Reconnecting…" instead of silent ghost-thread state. Resets to "live" on the next clean `SUBSCRIBED`.
- **No duplicate messages on reconnect** — engine deduplicates by `id` when applying realtime INSERTs and the optimistic-replacement step, so a send that lands its INSERT broadcast before the HTTP response is reconciled cleanly.
- **Unread tracking** — `adapter.markReadAction` fires on mount and after each incoming message (fire-and-forget, `keepalive: true`). Account stamps the user's `support_thread_user_read_at`; studio stamps the optional `last_seen_by_staff_at` column when present (graceful no-op when not, so a column rollout can ship independently of the engine work).

---

## 5. Download flow design and verified output

### Endpoint

| Host | Endpoint | Document type |
|---|---|---|
| Account | `/api/documents/support-thread/[id]` | `SupportThreadExportDocument` |
| Studio  | `/api/documents/support-thread/[id]` | `SupportThreadExportDocument` |

Both endpoints are auth-gated (account requires the authenticated user own the thread; studio requires `studio_owner` or `client_success` membership) and proxy through `streamPdfResponse` so the full PDF is never buffered in memory. Filename is built via `@henryco/branded-documents/filename`:

```
HenryCo-SupportThread-{shortid}-{YYYYMMDD}.pdf
```

The shared `SupportThreadExportDocument` template (in `packages/branded-documents`) renders:

- Branded header — HenryCo wordmark + serif display type
- Thread title, reference number, division, status
- Customer block (name + email if available)
- Conversation timeline — agent bubbles right-aligned, customer bubbles left-aligned, system messages with a copper left-rule
- Attachments listed as filename + MIME label at the message footer
- LegalFooter footer

This replaces the previously-broken download path (the legacy account flow had a stub that returned an unsigned blob).

### Trigger

Both account and studio use a thin client component (`DownloadDocumentButton` for account, `StudioDownloadButton` for studio) that:

- On a touch device with `navigator.canShare({ files: […] })` true, fetches the PDF blob and presents the OS share sheet so users can drop the file into WhatsApp / Mail / AirDrop / Drive in a single tap
- On desktop (or where Web Share is unavailable), appends `?download=1` to the endpoint, gets the `Content-Disposition: attachment` header, and triggers a direct browser download via an in-memory blob URL
- AbortError (user dismissed the share sheet) is silent; transport / 4xx errors surface a small `role="alert"` paragraph below the button

---

## 6. Micro-interaction inventory

- **Send button morph** — idle → sending spinner → success (200ms) → idle; failure shakes the composer textarea once
- **Message arrival fade-in** — 220ms ease-out, 4px lift on each new bubble, `prefers-reduced-motion` gated to nothing
- **Optimistic-state dim** — pending bubbles render at 0.65 opacity until the persisted ID lands
- **Typing indicator** — calm three-dot animation (subtle, no infinite bounce). Currently scaffolded behind the engine's draft-broadcast pipeline; default off until the typing presence channel ships in a follow-up
- **Attachment upload progress** — per-file bar driven by the composer's AttachmentUploader; each chip shows percent + size + cancel
- **Failed-send toast** — small inline error region below the composer with retry, plus the shake. No floating toast (the engine deliberately keeps notification noise out of the thread surface)
- **"Open" status dot pulse** — 2.2s breath on the status pill, paused under `prefers-reduced-motion`
- **Overflow menu** — slide-in 140ms ease-out, `prefers-reduced-motion` gated to instant
- **Realtime banner** — `mt-live-banner` slides down when the channel re-connects, fades on next clean `SUBSCRIBED`

---

## 7. Accessibility verification

- **Keyboard navigation** — bubble list is focusable per-message via Tab; overflow menu trigger is reachable via Tab from the download button; menu items navigable via ArrowDown / ArrowUp (browser-native role="menu" semantics)
- **Screen-reader announcements** — dedicated hidden announcer node (`aria-live="polite"`, `aria-atomic="true"`) holds only the latest INCOMING message string (`"Adaeze said: thanks for the update"`). Skips own sends + system messages. 140-char preview cap; falls back to `"sent N attachments"` for attachment-only messages
- **Focus restore** — overflow menu returns focus to its trigger on ESC / outside-click close
- **Reduced motion** — all engine motion (bubble fade-in, status-dot pulse, menu slide, banner slide) is gated by `prefers-reduced-motion: reduce`
- **Status communication** — the status pill includes its label inside the `aria-label` ("Status: Awaiting reply") so SR users don't get just the dot+pulse
- **Markdown safety** — protocol allowlist on inline links so a malicious customer message can't inject a `javascript:` URL into the agent's chat

---

## 8. Theme parity verification

The engine emits CSS classes against the `--ws-*` token vocabulary (workspace-shell). Each host bridges those tokens onto its own brand palette inside a scoped wrapper:

- **Account light** — `.acct-support-room` block maps `--ws-bg / --ws-ink / --ws-accent / --ws-good / --ws-warn / --ws-danger / …` onto the cream + premium-gold palette. Code spans, links, and the live banner get explicit overrides so they read well on the warm light surface
- **Account dark** — same bridge, since `--acct-*` tokens flip in `.dark` and the bridge re-resolves
- **Studio dark** — `:root` block in `apps/studio/app/globals.css` maps `--ws-*` → `--studio-*` (mint + copper on a deep navy). Bubbles, composer, banner, status line all pick up studio colours automatically; the new thread header / room CSS uses studio tokens directly

Both themes pass WCAG AA on bubble text vs surface (4.5:1) and on the status-pill text vs tint (3:1+). No hardcoded hexes were introduced — the new chrome reads from tokens end-to-end.

---

## 9. Build, deploy, live verification

### Build (all green)

```
pnpm --filter @henryco/messaging-thread typecheck   ✓
pnpm --filter @henryco/chat-composer typecheck      ✓ (no source changes in Phase 4)
pnpm --filter @henryco/account typecheck            ✓
pnpm --filter @henryco/account lint                 ✓ (only pre-existing SmartHomeHeader warning carries through)
pnpm --filter @henryco/account build                ✓
pnpm --filter @henryco/studio typecheck             ✓
pnpm --filter @henryco/studio lint                  ✓
pnpm --filter @henryco/studio build                 ✓
```

### Deploy
The branch ships to Vercel previews automatically; the closure rolls forward via `feat/pass-24-msg-composer-unify` → main when the host owner squash-merges the PR. Live verification has to happen on the preview URL because the Supabase realtime + Cloudinary signed upload flows can't be exercised against `localhost` in this environment.

The route flags below are what to verify against the preview:

| Surface | Route | Sanity check |
|---|---|---|
| Account customer | `https://<preview-account>/support/[threadId]` | Bubble list renders; composer expand works; draft survives refresh; download produces a branded PDF |
| Studio staff | `https://<preview-studio>/support/[threadId]` | Pills correct (division/category/priority/status); reply round-trips back to the customer; attachment upload returns a Cloudinary URL |
| Care staff | `https://<preview-care>/support/inbox/reply?thread=…` | ChatComposer expand+draft work on iOS Safari + Android Chrome |

---

## 10. Limitations and rationale

1. **Care inbox not migrated to the thread-room layout.** Care's support transport is email + WhatsApp, not real-time DB-backed chat; treating those threads as Supabase Realtime channels would require backfilling every inbound email + WhatsApp message into `support_messages` and breaking the existing operator workflow (per-thread reply page with delivery state + status transition). Care benefits from Phase 1's unified ChatComposer instead. Migrating care is a follow-up that needs its own data-model design pass.
2. **Care reply has no attachments.** The current `sendSupportReplyAction` doesn't accept attachments — adding them would require extending the email + WhatsApp delivery pipeline to embed images / PDFs in the outbound message. Out of scope for this pass; tracked as a follow-up.
3. **Reactions deferred.** Engine architecture is ready (`senderRole` decoupled from interaction); the data layer + audience-permission model needs a separate design pass. Hidden behind no feature flag — simply not wired into the bubble shell yet.

(The Phase 5 work below closes the previously-deferred mark-read column, the overflow-menu placeholders, and the customization / participants gaps from the spec.)

---

## 11. Phase 5 — workspace-grade gap closure (PASS 24 follow-on)

Three spec gaps that the original four phases marked deferred were closed in Phase 5:

### Typing presence
- New per-thread Supabase Realtime broadcast channel piggy-backs the existing INSERT subscription. Composer emits a `{ type: "broadcast", event: "typing", payload: { userId, name } }` ping at most once every 2s while a participant is composing; engine de-duplicates by userId and decays entries after 4s of silence so a participant who walks away fades naturally.
- Indicator renders as a calm three-dot bubble (220ms ease-out bounce, reduced-motion → static).
- New `enableTypingPresence` prop (default true) lets a host disable for a stricter privacy posture.

### Customization popover
- New `ThreadCustomizationMenu` + `ThreadAppearanceProvider` exported from `@henryco/messaging-thread`. Header trigger (gear icon) opens a popover with three segmented controls: font size (S / M / L), density (Comfortable / Compact), surface tone (Default / Soft / Warm / Cool).
- Preferences persist to `localStorage` under `henryco:thread-appearance` so they survive refresh + device handoff (per browser).
- Engine applies the resulting tokens via `data-font` / `data-density` / `data-surface` attrs on `.mt-thread` — no class explosion, full CSS-only re-paint.

### Participants strip
- New `ThreadParticipantsStrip` primitive in the engine package — compact horizontal row of avatar pills with name + role + optional presence indicator.
- Hosts derive the participant list from messages (per-host helper). Overflow collapses into a `+N more` caption so very long threads keep the strip one row.

### Active overflow menu actions
- **Account** — Mute / Unmute notifications (toggles `customer_muted_at`) + Report thread (intelligence event with `supportEscalated` semantics). Copy link / Copy ID retained. Download remains a header-level affordance (the menu line is a hint).
- **Studio** — Mark resolved / Re-open (state transitions with system-message timeline entry) + Transfer to another division (`studio_owner`-only, with a sub-panel listing destinations) + Mute / Unmute (toggles `staff_muted_at`) + Flag for review (priority bump + audit log entry).

### New API surface

| Route | Audience | Purpose |
|---|---|---|
| `POST /api/support/mute` (account) | Customer | Toggle `customer_muted_at` |
| `POST /api/support/report` (account) | Customer | Emit `supportEscalated` intel event |
| `POST /api/support/mute` (studio) | studio_owner, client_success, owner, support | Toggle `staff_muted_at` |
| `POST /api/support/transitions` (studio) | studio_owner, client_success, owner, support | `{ action: "resolve" \| "reopen" }` |
| `POST /api/support/transfer` (studio) | studio_owner only | Move thread to another division |
| `POST /api/support/report` (studio) | studio_owner, client_success, owner, support | Flag for review + priority bump + audit log entry |

### Schema migration

```
apps/hub/supabase/migrations/20260513200000_support_thread_state_pass24_phase5.sql
  + last_seen_by_staff_at   TIMESTAMPTZ NULL   (was: deferred from PASS 24 closure)
  + customer_muted_at       TIMESTAMPTZ NULL
  + staff_muted_at          TIMESTAMPTZ NULL
  + partial indexes on each, gated on NOT NULL
```

Idempotent (`ADD COLUMN IF NOT EXISTS`) so safe to re-run; the studio `mapSupportThread` row mapper now hydrates `staffMutedAt` / `customerMutedAt` onto `StudioSupportThread`, falling back to `null` on environments that haven't applied the migration.

---

## Verification log (signed off)

| Phase | Build | Type | Lint | Notes |
|---|---|---|---|---|
| 1 — composer unify | ✓ | ✓ | ✓ | Studio /client/projects/[id]/messages regression-clean |
| 2 — rich rendering | ✓ | ✓ | ✓ | Markdown subset + read-receipt status line + polite SR announcer |
| 3 — account migration | ✓ | ✓ | ✓ | Account /support/[threadId] migrated to engine + workspace-grade header |
| 4 — studio migration | ✓ | ✓ | ✓ | Studio /support/[threadId] migrated to engine + workspace-grade header + branded PDF endpoint |
| 5 — gap closure | ✓ | ✓ | ✓ | Typing presence + customization popover + participants strip + active overflow actions + schema migration |
