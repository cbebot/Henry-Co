# WS-4 — The Onyx Line for Marketplace (contact-safe buyer↔seller messaging)

**Program:** The Onyx Line (`docs/superpowers/plans/2026-06-26-the-onyx-line.md`, spec §8)
**Branch:** `v3/typography-reading-foundation` (kept-as-is, not pushed)
**Status:** Owner-approved build (2026-06-26). Team proposal: `docs/v3/proposals/2026-06-26-onyx-line-marketplace-buyer-seller-messaging.md`
**Posture:** Net-new. Dark behind `MARKETPLACE_MESSAGING_ENABLED === "1"`. Migration committed-NOT-applied. Money untouched.

---

## North Star

On-platform, contact-safe, identity-minimized buyer↔seller messaging anchored to a **listing** or an **order**. Every message screened **before persist** in **both directions** (block high/critical, mask medium). The **seller never sees the buyer's contact details** (display name only; fulfilment PII stays on the order). Support + disputes are preserved as the escalation path. This *enforces* the anti-disintermediation standard — it does not break it.

## Grounded facts (verified against live source — do NOT re-trust the map; implementers read the cited files)

- **Identity:** `getMarketplaceViewer()` (`apps/marketplace/lib/marketplace/auth.ts:38`); gates `requireMarketplaceUser`/`requireMarketplaceRoles`. Buyer = `auth.uid()`. Vendor a user acts as = `viewer.memberships.find(m => m.role === "vendor")?.scopeId`.
- **Vendor RLS subquery (verbatim, live in `marketplace_refunds.sql:70-82`):**
  ```sql
  vendor_id in (
    select m.scope_id from public.marketplace_role_memberships m
    where m.user_id = (select auth.uid())
      and m.role = 'vendor' and m.is_active = true and m.scope_type = 'vendor'
  )
  ```
- **Anchors:** `marketplace_products(id, vendor_id, slug)`; `marketplace_orders(id, order_no, user_id /*buyer*/, buyer_name/email/phone, shipping_*)`; vendor on an order = `marketplace_order_groups(order_id, vendor_id)`.
- **House SQL style** (`marketplace_refunds.sql`, `_init.sql`): `gen_random_uuid()`, `timezone('utc', now())`, `create table if not exists`, drop/add constraint pairs, `marketplace_set_updated_at()` trigger, inline `enable row level security`. **NO `force row level security`, NO `grant`/`revoke`.** SELECT-only client policies; **no authenticated INSERT** → service-role writes only.
- **Service-role writes:** `createAdminSupabase()` (`apps/marketplace/lib/supabase.ts:26`). Intent router `app/api/marketplace/route.ts` POST (line 288), `switch(intent)`, all persistence via `admin`. Mirror `support_thread_create` (line 1323).
- **Realtime:** none in marketplace today. Mirror the estate's guarded block (`apps/studio/.../20260514133000_studio_realtime_publication.sql`). The `@henryco/messaging-thread` engine subscribes via `channelName`, `subscriptionFilter` (→ `conversation_id=eq.${id}`), `table`, `schema`.
- **Flag idiom:** bare env check (`apps/marketplace/lib/cloudinary.ts:59` → `=== "1"`). Use `MARKETPLACE_MESSAGING_ENABLED`.
- **i18n:** `getMarketplacePublicLocale()` + Pattern A copy. ig/yo/ha/hi EN-fallback by omission (never machine-translated).
- **Tests:** shared-package logic via `tsx --test`; marketplace app uses Playwright e2e only.
- **Deps to add to `apps/marketplace/package.json`:** `@henryco/contact-safety`, `@henryco/messaging`, `@henryco/messaging-thread`, `@henryco/chat-composer` (`@henryco/trust` already present).

---

## Data model (new migration, committed-NOT-applied)

`apps/marketplace/supabase/migrations/<UTC>_marketplace_conversations.sql`

**`marketplace_conversations`** — one thread per (buyer, vendor, anchor):
- `id uuid pk default gen_random_uuid()`
- `conversation_no text not null unique` (human ref, house style)
- `anchor_type text not null` check in (`'listing'`,`'order'`)
- `anchor_id uuid not null`
- `buyer_user_id uuid references auth.users(id) on delete set null`
- `vendor_id uuid not null references public.marketplace_vendors(id) on delete cascade`
- `subject text`
- `status text not null default 'open'` check in (`'open'`,`'closed'`,`'archived'`)
- `last_message_at timestamptz`
- `last_message_preview text` (screened; short)
- `created_at`, `updated_at` (utc default; updated_at trigger)
- `create unique index ... on (buyer_user_id, vendor_id, anchor_type, anchor_id)` — dedupe threads.

**`marketplace_conversation_messages`:**
- `id uuid pk`, `conversation_id uuid not null references ... on delete cascade`
- `sender_kind text not null` check in (`'buyer'`,`'vendor'`,`'system'`)
- `sender_user_id uuid references auth.users(id) on delete set null` (null for system)
- `body text not null` (screened before insert)
- `message_type text not null default 'text'`
- `created_at timestamptz not null default timezone('utc', now())`
- `create index ... on (conversation_id, created_at)`

**`marketplace_conversation_participants`** — read-state only:
- `id uuid pk`, `conversation_id uuid not null references ... on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `party_kind text not null` check in (`'buyer'`,`'vendor'`)
- `vendor_id uuid references public.marketplace_vendors(id) on delete set null` (set for vendor party)
- `last_read_at timestamptz`
- `created_at`, `updated_at` (updated_at trigger)
- `unique(conversation_id, user_id)`

### RLS (SELECT-only for clients; writes via service role; **message access keyed on the immutable conversation, never on participants**)

- **conversations:** buyer read `buyer_user_id = (select auth.uid())`; vendor read via the membership subquery on `vendor_id`; staff read via staff-role membership exists. No insert/update/delete policy.
- **messages:** buyer read `exists (select 1 from marketplace_conversations c where c.id = conversation_id and c.buyer_user_id = (select auth.uid()))`; vendor read `exists (... and c.vendor_id in (membership subquery))`; staff read. No insert policy.
- **participants:** self read `user_id = (select auth.uid())`; vendor read via membership on `vendor_id` (team read-state). Self read-state update: `for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))`. No insert policy (service-role creates rows).
- **Realtime:** guarded `do $$ ... alter publication supabase_realtime add table public.marketplace_conversation_messages` (+ `marketplace_conversations` for inbox live updates). Realtime re-applies the SELECT policy → stream is automatically participant-scoped.

---

## Application layer

`apps/marketplace/lib/messaging/`:
- **`screen-message.ts`** — `screenMessageBody(text): { action, body }` composing `@henryco/contact-safety` `contactSafety` (mirror studio's wrapper exactly).
- **`adapter.ts`** — marketplace `MessagingAdapter` (`@henryco/messaging`): `persistMessage` (insert via `createAdminSupabase()`), `getParticipants` (buyer + vendor resolved from the conversation). This is the showcase of the unified spine: the send path routes through `@henryco/messaging/server` `sendMessage(input, { adapter, notify })`, getting block-before-persist + notify-by-stable-userId for free.
- **`conversations.ts`** — reads (buyer inbox, vendor inbox, single thread), each applying `maskContactsForDisplay` (`@henryco/trust/detect`) at render as defense-in-depth for any legacy/unscreened body.

Intent handlers in `app/api/marketplace/route.ts` (all flag-gated; all via `admin`; mirror `support_thread_create`):
- **`mkt_conversation_start`** (`anchor_type`, `anchor_id`, `body`): resolve viewer + counterpart from anchor (listing→`products.vendor_id`; order→`orders.user_id` + `order_groups.vendor_id`); authorize viewer is the buyer or a member of the vendor; route `body` through `sendMessage` (block → `{ ok:false, reason:"contact_blocked" }`); on first message create the conversation (idempotent on the unique index) + buyer/vendor participant rows; notify counterpart by stable user id.
- **`mkt_conversation_reply`** (`conversation_id`, `body`): authorize viewer ∈ {buyer, vendor-member}; `sendMessage`; bump `last_message_at`/`last_message_preview`; notify counterpart.
- **`mkt_conversation_mark_read`** (`conversation_id`): upsert participant `last_read_at = now()` for viewer.

**Money-safety gate (every task):** `git diff` must show ZERO changes to any file matching `payment|payout|invoice|ledger|wallet|reconcile|vat|escrow`. The intent router is shared with money intents — touch ONLY the three new `mkt_conversation_*` cases; do not alter neighbouring cases.

---

## UI

- **Buyer:** `app/account/messages/page.tsx` (inbox) + `app/account/messages/[conversationId]/page.tsx` (thread via `@henryco/messaging-thread` `MessageThread`; adapter `channelName: mkt-conv-${id}`, `subscriptionFilter: conversation_id=eq.${id}`, `table: marketplace_conversation_messages`; composer with `ContactSafetyHint`). "Message seller" CTA on `app/(public)/product/[slug]/page.tsx` (anchor=listing) and `app/account/orders/[orderNo]/page.tsx` (anchor=order). Add `/account/messages` to `accountNav` — flag-gated.
- **Vendor:** `app/vendor/messages/page.tsx` + `[conversationId]/page.tsx`. **Identity-minimized:** buyer shown as display name / order context only — NEVER `buyer_email`/`buyer_phone`/address in-thread. Any fulfilment data the vendor is entitled to is read from the **order**, scoped by `order_groups.vendor_id == viewer scopeId`. Add `/vendor/messages` to `vendorNav` — flag-gated.
- All pages RSC + `WorkspaceShell`; all new copy via Pattern A (`getMarketplacePublicLocale` + a new `marketplace-messaging-copy.ts`); AA contrast (warm-paper tokens; never white-on-gold).

---

## Tasks (subagent-driven: fresh implementer + Opus reviewer each; final whole-branch review)

- **T1 — Migration + PGlite RLS proof.** The 3 tables, RLS, triggers, realtime, `conversation_no`. Throwaway PGlite proof: participant reads only own conversations; non-participant denied; vendor sees only own-vendor threads via membership; no client insert; read-state self-update only; messages scoped via conversation. *Reviewer lens: default-deny correctness, the participants-tamper non-escalation, money-untouched.*
- **T2 — Pipeline + intents + deps + package tests.** Deps added; `screen-message`/`adapter`/`conversations`; the three `mkt_conversation_*` intents routing through `@henryco/messaging/server` `sendMessage`; `tsx --test` for screen + adapter (block both directions, mask medium, notify-by-userId). *Reviewer lens: contact-leak (both directions, block-before-persist), authz (buyer/vendor membership), money-safe (only 3 new cases touched).*
- **T3 — Buyer UI.** Inbox + thread + "Message seller" CTAs (product + order) + nav, flag-gated. *Reviewer lens: a11y/AA, i18n (no raw strings), CTA only renders when flag on.*
- **T4 — Vendor UI.** Inbox + thread + nav, flag-gated, identity-minimized. *Reviewer lens: seller NEVER sees buyer email/phone/address in-thread or in props serialized to client.*
- **T5 — i18n copy + hint + realtime + display-mask.** `marketplace-messaging-copy.ts` (ig/yo/ha/hi EN-fallback) incl. `contact_blocked`; `ContactSafetyHint` wired; realtime live; `maskContactsForDisplay` at render. *Reviewer lens: ig/yo/ha/hi never machine-translated; brand names never translated.*
- **T6 — Final whole-branch review + acceptance bar.** Verify the 7 invariants end-to-end vs real source; update memory + ledger.

## Acceptance bar (7 invariants — every one cited to shipped code in T6)

1. **No contact leak** — high/critical blocked before persist; medium masked; verified both directions; render-mask defense-in-depth.
2. **Money-safe** — zero diff to payment/payout/invoice/ledger/wallet/vat/escrow.
3. **Notify-owner-correct** — recipients notified by stable user id, never email/phone.
4. **Identity-minimized** — seller never sees buyer email/phone/address (in-thread or serialized props).
5. **Default-deny** — RLS participant-scoped reads; no client insert; PGlite-proven.
6. **Localised** — all copy Pattern A; ig/yo/ha/hi EN-fallback (never machine-translated); brand names never translated.
7. **Weak-connection + no dark patterns** — offline-tolerant send; AA contrast; honest UX.

## Rollout
Dark by default (`MARKETPLACE_MESSAGING_ENABLED` unset). Migration committed-NOT-applied (owner applies via Supabase MCP after review + PGlite proof). Reversible: flag off + migration unapplied = fully dark.
