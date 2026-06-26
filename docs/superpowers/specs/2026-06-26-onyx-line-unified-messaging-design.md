# The Onyx Line — Unified Ecosystem Messaging

**Design spec** · 2026-06-26 · status: **proposed** (awaiting owner review → writing-plans)
**Codename:** The Onyx Line · **Surface label:** "Messages" (the brand rule is *measurable, not adjectival* — no invented product name on the surface)
**Author:** design pass grounded in a full read of the communication estate, brand, mission, division roster, and the six encoded values.

> The monogram is a gold **H** inside a gold ring on onyx — *H is Henry, the ring is the O of Onyx* — and the crossbar is described in `docs/brand/README.md` as **"the single line that joins the two posts: one operating standard."** A communication system *is* that line. This is the build of that line.

---

## 0. One-paragraph summary

The Onyx Line is the single, trustworthy channel through which the whole Henry Onyx economy talks to itself — buyer↔seller, client↔studio, candidate↔employer, household↔rider, learner↔mentor, customer↔support — in any of twelve languages, on a real (often cheap, often weakly-connected) phone, and **never leaving anyone alone at the moment that matters.** It unifies eight divisions' scattered, uneven messaging onto one editorial surface and one trust pipeline, **without migrating any money-adjacent store and without touching any payment table.** It keeps relationships on-platform (protecting people from scammers), it speaks the company's one calm voice to all types of people, and it is judged complete only against a 7-invariant Acceptance Bar, every line of which is verifiable against shipped code in this repository.

---

## 1. North Star

**One operating standard, applied to every conversation.**

Today, "messaging" at Henry Onyx is eight different things of eight different qualities: studio has a mature realtime chat (with a contact-leak hole), jobs has threads with no realtime, support is a thread with no contact filtering, marketplace has *no* buyer↔seller chat at all, and care/property/learn funnel through a shared support table. A unified inbox already exists at `apps/account/(account)/messages` (backed by `packages/data/inbox-aggregate.ts`) but only lists subjects — it is a seam, not yet a system.

The North Star is to make all of it **one line**: one editorial surface, one safety pipeline, one voice, one set of invariants — so that a message about a Lagos garment pickup and a message about a London studio milestone feel like the same dependable company, and so that the worst failure in the estate — **silence at the anxious moment** (paid-but-nothing, a no-show viewing, a ghosted application) — becomes structurally impossible.

This serves the company's own stated mission (`packages/config/company.ts`): *"A premium group of service businesses built on clarity, trust, and operational excellence,"* and the world-reveal goal of V3-96: *"the platform on its best day — on a real phone, in a real currency, in a real locale… real receipts, real joy."*

---

## 2. Current estate (ground truth, read-only discovery)

| Division | Messaging today | Store | Realtime | Contact-leak risk | Money-adjacent |
|---|---|---|---|---|---|
| **Studio** | Full chat: reactions, read-receipts, typing, **offline queue**, context panel — most mature | `studio_project_messages` (+ `_reactions`, `_read_receipts`, `_typing_indicators`) | ✅ full | **HIGH** — zero send-time filtering | **Yes** (`studio_invoices`/`studio_payments` share its RLS/realtime) |
| **Jobs** | Candidate↔employer threads + interview scheduling/rooms (Daily.co, UI dormant) | `jobs_conversations`/`jobs_messages` | ❌ `router.refresh()` | Partial — client + server `shouldAutoFlag` gate exists; `sanitizeForDisplay` not wired | Adjacent |
| **Account / Support** | Customer↔staff support thread | `support_threads`/`support_messages` (shared) | ✅ channel | **None today** — unfiltered | Adjacent |
| **Marketplace** | Support tickets only — **NO buyer↔seller chat** (by design, mediated by support) | `marketplace_support_*` | ❌ | N/A (chat doesn't exist) | Adjacent |
| **Care / Property / Learn / Logistics** | Funnel through shared `support_threads` (`division` tag) | `support_threads` | mixed | unfiltered | Care/Property fee-adjacent |
| **Hub (internal)** | Staff/owner team chat — clean, complete, masked, owner-only | `hq_internal_comm_*` | ✅ full | low (email masked) | topical only |
| **Shared libs** | `@henryco/messaging-thread` + `@henryco/chat-composer` + `@henryco/rooms` | — | host-supplied | — | none |
| **Unified inbox (seam)** | Lists subjects across 4 stores | `packages/data/inbox-aggregate.ts` | 20s poll | n/a | none |

**Two corrections the discovery forced (both make the build safer):**

1. **`@henryco/moderation` does not exist** — it is an unbuilt V3-25 spec. The real, shipping anti-scam engine is **`@henryco/trust`** (`detect.ts` + `moderation.ts`), already wired into marketplace/care/jobs submit paths. We compose it; we do not reinvent it.
2. **Unification is already half-built.** `getInboxAggregate` already merges `support_threads` + `marketplace_support_threads` + `jobs_conversations` + `studio_project_messages`. This is an **elevate-and-complete** job, not greenfield.

---

## 3. Goals / Non-goals

### Goals
- One editorial messaging surface (inbox + thread + composer) serving every party and every division, role-aware, light-default warm-paper Register-L with a polished dark parity.
- One **shared send→safety→persist→realtime→notify pipeline** (`@henryco/messaging`) that every division's adapter runs through.
- One **contact-safety layer** (`@henryco/contact-safety`) composing `@henryco/trust`, enforced server-side, closing the studio leak and the `sanitizeForDisplay` gaps.
- **Context-anchoring** on every thread (tied to an order/booking/job/project/listing with a live deep link and lifecycle awareness).
- **Net-new marketplace buyer↔seller** messaging (the one party-pair with no home), built on a new canonical store that doubles as the migration template.
- Cross-locale messaging on the 12-locale spine, ig/yo/ha **human-or-EN, never machine**.
- The complete system designed now; shipped in **flagged, sequenced workstreams** (no risky big-bang), money-safe throughout.

### Non-goals (explicit)
- **No payment/money-table changes.** Zero. The money spine is untouched.
- **No migration of live money-adjacent stores** (studio/jobs/support keep their tables; they gain the pipeline + UI, not a data move).
- **No collapsing of the internal team-chat rail** (`hq_internal_comm_*`) or the owner inbound-email concept into the customer spine — they stay separate rails; only presentation + unread/notification plumbing converge.
- **No claiming unbuilt infrastructure as live** (KYC envelope vault, double-entry ledger, gaming stakes, `@henryco/media` private resolver, web push) — see §11 Deferrals.

---

## 4. Architecture

### 4.1 The hybrid spine (the central decision)

**Decision: a shared contract + pipeline over existing per-division stores, plus ONE net-new canonical store for conversation types that have no home today.**

Migrating studio's money-adjacent realtime tables into a single mega-table is the single riskiest thing we could do, for near-zero user benefit — and it violates the company's own *"money invariants are absolute / finish the base"* doctrine. So:

- **`@henryco/messaging`** (new shared package) defines ONE canonical `Conversation` / `Message` / `Participant` **contract** (types), a **`MessagingAdapter`** interface, and the shared **pipeline** (`sendMessage()` = validate → contact-safety → persist-via-adapter → realtime → notify). Each division implements the adapter over **its own existing table**. No data migration of live stores.
- **One net-new canonical store** — `conversations` + `conversation_messages` + `conversation_participants` with a **polymorphic context anchor** — is created only for net-new conversation types, **starting with marketplace buyer↔seller**. Authored in the unified shape, it is also the template existing stores can migrate *into* later, at leisure, if ever.
- **The unified read model** = the existing `getInboxAggregate`, extended to read the new store and to compute unread + deep-links correctly (reconciling the two divergent unread computations found in discovery).

### 4.2 `@henryco/messaging` — the core contract + pipeline

```
packages/messaging/
  src/
    types.ts            // Conversation, Message, Participant, ContextAnchor, DeliveryState
    adapter.ts          // MessagingAdapter interface (per-division impl)
    pipeline.ts         // sendMessage(): validate → safety → persist → realtime → notify
    anchor.ts           // ContextAnchor normalization (order|listing|booking|job|studio_project|...)
    resilience/
      offline-queue.ts  // PROMOTED shared primitive (see 4.8) — was studio-only
    index.ts            // barrel; package.json exports map "." and "./server"
```

The pipeline is the one place contact-safety, notification publishing, and realtime fan-out are wired — so every division gets all three for free and none can skip the safety step.

### 4.3 `@henryco/contact-safety` — composing `@henryco/trust`

A thin package that wraps `detectOffPlatformContact` + `detectSuspiciousContent` + `sanitizeForDisplay` from `@henryco/trust` and exposes:

```ts
contactSafety(text, opts?) → {
  action: 'allow' | 'mask' | 'block',
  maskedText: string,
  patterns: string[],
  severity: 'low' | 'medium' | 'high' | 'critical',
}
```

- **Enforced server-side** in the pipeline's persist step, *before* insert/broadcast: `high`/`critical` → **block, never persisted**, returns a kind rewrite prompt; `medium` → **mask** (`sanitizeForDisplay`) + hold/flag; `low` → allow.
- **Closes the real gaps** the trust detector has (per the charter): arbitrary/shortener URLs (`wa.me`, `t.me`, `bit.ly`, generic `https?://`), "call me on …" phrasing, light obfuscation ("zero eight zero", "name at gmail dot com", spaced digits), and **masking of handles / messaging-app names / meeting links** (today only phone+email are masked).
- **Client pre-warning** in the composer for instant UX (non-authoritative; the server is the source of truth).
- **Display masking** wired into the thread row-mapper for defense-in-depth on already-stored content.
- **Audit** via the existing `trust_flags` convention (`flag_type:"off_platform_contact"`, `source:"system"`, `entity_type:"message"`). The block is **unconditional regardless of flag-write success** (flag writes are best-effort).
- **Adds the detector tests `@henryco/trust` is missing** (the package currently has none).
- Staff/system senders configurably exempt (an internal staff reply may legitimately contain a meeting link).

### 4.4 The canonical surface (editorial "Messages")

Warm-paper, light-default Register-L, Fraunces display + Manrope body, gold/onyx accents, AA-safe (`--hc-text-on-accent #1A1814`, never white-on-gold), respecting the global light/dark toggle.

- **Inbox** (`/messages`): serif "Start with context" masthead + context-anchored conversation list + brass/teal pill-card entry points for starting a new contextual thread. Replaces the current plain aggregator list.
- **Thread**: calm editorial chat — a **context header** (this thread *is about* order #/booking/job/project, with a live deep link + lifecycle status), bubbles, receipts, day dividers, brass Send composer. Built on `@henryco/messaging-thread` + `@henryco/chat-composer` (reuse, not rebuild) with re-toned tokens.
- **Role-aware chrome**: one surface serves customer / staff / seller / buyer / client / learner; the context header, participant labels, and available actions adapt by role.
- **Two mount points, one component set (no context-losing redirect):** the thread + composer ship as reusable components in `@henryco/messaging` so a division *keeps its in-context messaging in place* (studio mounts them in its client portal, jobs in its candidate workspace — no bounce to another app). `apps/account` additionally hosts the **cross-division aggregate inbox** (the elevated `getInboxAggregate`) as the one place a person sees every conversation. Deep links resolve to the specific thread (`/messages/{conversationId}` in account, or the division's in-app thread route), fixing the discovery finding that jobs/studio threads currently deep-link to generic landings.

```
┌─────────────────────────────────────────────┐
│  Messages                          ☀ / ☾     │   ← serif masthead, theme-aware
│  ─ Start with context ─                       │
├───────────────┬─────────────────────────────┤
│ ● Order #4821 │  About · Order #4821  ↗      │   ← context header w/ live deep link
│   Seller · 2m │  ─────────────────────────   │
│ ● Booking …   │   ▸ team bubble (paper)       │
│ ● Studio …    │              your bubble ▸    │   ← AA: dark-ink on brass, never white-on-gold
│ ● Application │   ✓✓ Read · 2:46              │
│   …           │  ┌─────────────────────────┐ │
│  [+ new]      │  │ Reply…        [ Send ▸ ] │ │   ← brass Send, queued/sending/failed states
│   pill cards  │  └─────────────────────────┘ │
└───────────────┴─────────────────────────────┘
   offline banner appears here when network drops; messages queue + auto-replay
```

### 4.5 Context-anchoring (the "lifecycle-alive" elevation)

Every conversation carries a typed `ContextAnchor` (`support | order | listing | booking | job | studio_project | property_inquiry | learn_cohort | direct`). The data already holds the anchors (jobs `application_id`, studio `project_id`, support `reference_type/reference_id`); the adapter normalizes them. Beyond *showing* what a thread is about, the thread is **wired to the division's state machine** so it renders the honest next step and **never shows a dead thread** — directly answering "silence at the anxious moment."

### 4.6 Cross-locale + copy consolidation

Consolidate the scattered message strings (`account-copy.messages`, `chat-composer` labels, `surface-copy.floatingSupport`, jobs inline literals) into one **`messaging-copy`** Pattern A module: EN baseline + native `DeepPartial` overrides for fr/es/pt/ar/de/it/zh; **ig/yo/ha/hi omitted → EN fallback by construction, never machine-translated.** Arabic RTL via `isRtlLocale()`/`dir="rtl"`. Optional inline message-body translation (display-only) so a Hausa buyer and an EN seller can converse — original text always retained.

### 4.7 Notification preservation (hard constraint)

All unified-messaging notifications route through the existing **`publishNotification()`** shim (`packages/notifications`) — never a hand-rolled `INSERT`. The recipient is **always a stable FK** (e.g. `care_bookings.user_id`, `support_threads.user_id`), **never** a live email/phone match (the exact wrong-owner bug from the V3-NOTIF-RLS-01 incident). The `customer_notifications` UPDATE RLS `WITH CHECK (auth.uid()=user_id)` backstop and the realtime `user_id=eq` channel filter are preserved. Reuse the `sent→delivered→seen→failed` delivery state machine and its redelivery/email-fallback crons.

### 4.8 Realtime + the shared resilience primitive (PROMOTED to required)

- Add the non-realtime stores (`jobs_conversations`/`jobs_messages`) to the `supabase_realtime` publication; standardize the subscription through `messaging-thread`'s host-supplied factory; reconcile the two divergent unread-count computations so the badge can exceed the 50-item window.
- **`@henryco/messaging/resilience/offline-queue` is a required deliverable, promoted from studio-only.** The studio offline queue (`apps/studio/components/messaging/use-offline-queue.ts` — localStorage persistence + auto-replay on reconnect, backpressure-aware on 5xx) is extracted into the shared core so **every** division's composer survives a dead network from day one. This is non-negotiable because the North Star's named users — riders and traders in the field — live on weak signal. The realtime transport self-heals via the existing dashboard-shell provider (10s watchdog + capped backoff + 30s polling that pauses when the tab is hidden + JWT rotation on refresh).

---

## 5. The six elevations (the soul)

These are *why* the build is world-class, not merely functional. They are woven into the acceptance criteria (§6–§7), not decorative.

1. **Lifecycle-alive, not a chat box.** The thread knows the order/booking/application/milestone state and always renders the honest next step. Antidote to "silence at the anxious moment." (*Kindness is a system, not a tone.*)
2. **Contact-safety as a kept promise, not a nanny filter.** Anti-disintermediation protects the human; the inline copy is calm and kind ("Keep it on Henry Onyx — you're protected here"), never a scold, and **localized** (including ig/yo/ha human copy).
3. **One voice, every party, every locale — respect encoded.** Same engine, London client to Onitsha trader; ig/yo/ha human-or-EN never machine; Arabic RTL; AA always.
4. **Built for the real phone.** Offline queue + auto-replay, self-healing socket, lean payloads, honest connectivity state. The field rider is a first-class user.
5. **Money-truth & owner-correctness as invariants.** Zero payment-table change; stable-FK recipients; no approximate currency shown as payable.
6. **The honesty bar — no dark patterns.** No fake typing theater, no manipulative read-receipt pressure, honest empty states, real progress, `prefers-reduced-motion`, focus rings, SR announcements, send motion < 600ms.

---

## 6. Values Charter (binding acceptance criteria)

*Every requirement is verifiable against a cited file in this repository. The Onyx Line is not "done" until each pillar's requirements pass and the Acceptance Bar (§7) holds.*

### 6.1 Trust & Anti-Scam
**Principle.** Off-platform contact and payout-diversion are caught deterministically at send time, blocked before persistence, and escalated on repeat — never moderated after the fact.
**Proof:** `apps/marketplace/lib/marketplace/governance.ts:297-322` (off-platform steering hard-blocks submission); `packages/trust/moderation.ts:130-170` (`shouldAutoFlag` escalates to critical when both detectors fire high).
**Requirements (testable):**
- Send path runs `shouldAutoFlag()` server-side **before** insert; `high`/`critical` → rewrite prompt, **never persisted**; `medium` → held/masked.
- Imports the **canonical** detectors from `packages/trust/detect.ts` — must NOT re-implement a local list.
- Every rendered body passes `sanitizeForDisplay`; contact-safety extends masking to handles / messaging-app names / meeting links (today phone+email only).
- Severity ∈ `Low/Medium/High/Critical` (`packages/trust/moderation.ts:60-65`); repeat offenders escalate (`escalateSeverityForRepeatOffender`).
- Each block/flag persists a `trust_flags` row (`flag_type:'off_platform_contact'`); the **block is unconditional even if the flag write fails**.
- Attachments/images screened for embedded contact details and QR references.
- Provider/vendor identity never surfaced; the promise renders verbatim — *"We never share contact details with vendors; they reach you through the platform"* (`apps/marketplace/app/account/support/page.tsx:258-260`).
**Gap to own:** detectors are English/regex, no deep obfuscation handling; `PHONE_RE` false-positives on SKUs/order numbers → treat as high-recall, not complete. Close the masking gap or accept it explicitly.

### 6.2 Privacy & Data-Minimization
**Principle.** Ownership is a stable FK enforced in RLS on both read and write; sensitive content carries references, never raw identifiers, behind short-lived signed URLs in private buckets.
**Proof:** `apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql:343-348` (owner-correctness in both `USING` and `WITH CHECK`); `apps/hub/app/api/owner/internal-comms/attachments/signed/route.ts:18-53` (120s access-gated signed URL).
**Requirements (testable):**
- Recipients resolved by `user_id`/`recipient_user_id` FK in both RLS clauses — **never** an email/phone match.
- Inbound writes service-role-only (publisher shim); clients `SELECT`/`UPDATE` own rows; SELECT-side RLS applies unchanged to the realtime stream.
- Attachments in an RLS-private bucket via ~120s signed URLs, per-thread/per-owner gated, path-traversal-guarded; referenced as `media://private/{bucket}/{key}`, never a permanent public CDN URL.
- Bodies/`detail_payload` carry references/tokens only — never raw NIN/BVN/PAN.
- Every new field maps to a named NDPA §25 basis in `DATA_CATEGORIES` (`packages/config/legal.ts`) with a policy-version bump; the banned phrase *"may collect"* never appears.
- Pipeline logging never logs message/attachment bytes or signed URLs — IDs/keys/correlation only.
- Retention honors `deleted_at`/`archived_at` + legal hold.
**Gap to own:** `@henryco/media`'s private resolver is not in-tree; the general customer-facing private-media path for message attachments must be built (the only shipped private-signed path today is internal-comms). Cloudinary remediation is in-flight.

### 6.3 Integrity & Fairness
**Principle.** Money is integer kobo that never lies about payability; every money RPC is default-deny SECURITY DEFINER; status copy reflects provider-confirmed truth.
**Proof:** `packages/pricing/src/currency-model.ts:289-298` (`assertNoAmbiguousCurrency` throws); `apps/hub/supabase/migrations/20260509120000_v2_closure_d8_rls_hot_patch.sql:46-52` (FORCE RLS + revoke from anon/authenticated).
**Requirements (testable):**
- Any non-NGN amount in a message carries the `isApproximateDisplay` truth label ("Charged in NGN") and never implies settlement in the displayed currency.
- All money is kobo-exact integer minor units via `@henryco/pricing`/`@henryco/i18n` — never float, never `×100`, always with ISO-4217 code.
- `paid`/`refunded`/`settled` copy appears only after ledger/provider confirmation.
- Any price-bearing message renders an explicit VAT line (amount + rate + localized label).
- Every DB function backing messaging notifications is SECURITY DEFINER + pinned `search_path` + `REVOKE ALL FROM public, anon, authenticated` + scoped `GRANT EXECUTE`; unauthorized writes raise `42501`.
- No PII in telemetry/audit/message-event payloads (hashed ids only).
**Gap to own:** the double-entry ledger and gaming arena are spec-only/unbuilt; depend only on the shipped pricing + security-hardening layer; emit "paid" copy only once the ledger actually confirms.

### 6.4 Inclusion & Language-Respect
**Principle.** Twelve locales, including Igbo/Yoruba/Hausa, served by human typed-copy with a guaranteed English fallback — Nigerian languages are never machine-translated.
**Proof:** `packages/i18n/src/deepl.ts:19-29` (*"ig, yo, ha, hi: not supported by DeepL — callers should skip or use EN fallback"*); `docs/audit/i18n-completion-audit.md:751-756` (*"Do not remove the EN fallback…"*).
**Requirements (testable):**
- Supports every locale in `ALL_LOCALES`; ig/yo/ha render human typed-copy or the EN baseline, **never** machine-translated/broken/empty.
- Every string resolves through Pattern A (EN baseline + `DeepPartial` overrides via `deepMergeMessages`); EN fallback never removed/made strict.
- Arabic (and any `RTL_LOCALES`) renders RTL across in-app copy, notifications, emails.
- Brand/division names never translated; brand-bearing fields pass through `toBrandName`; retired "Henry & Co." never emitted.
- Amounts/dates/counts use the Intl maps (ig/yo/ha → `en-NG`, ar → `ar-EG`).
**Gap to own:** ig/yo/ha are `scaffold` tier — users still hit English; the guarantee is "never machine-mangled," not "fully localized." New brand tokens go into `INTENTIONAL_ECHOS`.

### 6.5 Accessibility
**Principle.** Contrast, focus, motion, and SR announcement are enforced by token and CI gate — never white-on-gold, never color-alone, never an unannounced state change.
**Proof:** `packages/ui/src/styles/globals.css:247-251` (*"white text on [gold] falls below AA-LG … --hc-ink-on-accent: #1A1814"*); `scripts/a11y/gate.mjs:34-46` (CI fails on critical/serious axe violations).
**Requirements (testable):**
- Accent fills (bubbles, send button, unread badges, chips) use `--hc-text-on-accent` (`#1A1814`) on `--hc-accent` — never white-on-gold.
- Gold-as-text uses `--hc-accent-text` (`#8A6F00` light / `#E5C870` dark), never raw `#C9A227`.
- Every fg/bg pair ≥ AA (4.5:1 body / 3:1 large) in both themes via `--hc-*` tokens, zero hardcoded hex.
- Delivery/read/error/typing status never color-alone — each pairs with icon or text.
- All animations collapse under `@media (prefers-reduced-motion: reduce)`; JS motion consults `useReducedMotion()`.
- Incoming messages + presence changes announce via a visually-hidden `aria-live="polite"` `aria-atomic` region (PresencePane pattern).
- Connection state exposes `role="status"` + `aria-live` + `aria-label`, indicator `aria-hidden`.
- Every control shows the 2px focus-visible ring (`focus.ts`, `--hc-focus-ring`).
- The surface's routes are added to the audit set and pass `a11y:contrast` / `a11y:gate` / `a11y:headers`.
**Gap to own:** the contrast matrix audits only brand accents, and the axe gate runs nightly — so The Onyx Line must add its routes to the audit set and author its own reduced-motion coverage rather than assume coverage.

### 6.6 Resilience / Low-Bandwidth (the real phone)
**Principle.** An unreliable, low-bandwidth phone is the default operating condition: messages queue locally and auto-replay, the socket self-heals, and delivery is an observable state machine with a channel of last resort.
**Proof:** `apps/studio/components/messaging/use-offline-queue.ts:17-25` (*"Buffer outgoing messages while the network is unreachable, replay automatically… Persists to localStorage…"*); `packages/dashboard-shell/src/shell/supabase-realtime-provider.tsx:628-647` (10s watchdog + reconnect).
**Requirements (testable):**
- **The offline queue is promoted to a shared `@henryco/messaging` primitive** (was studio-only). Every outbound message persists to localStorage keyed per conversation, shows `queued`, and auto-replays on reconnect — never silently dropped.
- Replay is backpressure-aware: on 5xx/rate-limit, flush stops (no retry-storm) and surfaces a retry affordance.
- Realtime self-heals: 10s watchdog + exponential backoff capped at 30s; 30s polling fallback that pauses when the tab is hidden; channel JWT rotates in place on token refresh.
- Delivery is `sent→delivered→seen→failed` with time-bounded transitions (1h re-attempt, 24h hard-fail) and idempotent, state-guarded mutations safe under overlapping cron runs.
- An undelivered in-app notification falls back to email with provider redundancy (Resend→Brevo) + per-user caps (5 / rolling 24h, excess digested).
- Every attempt/degradation logs to a single delivery-log with typed events + HTTP 207 "degraded" contract.
- Public, non-personalized reads are cached (`unstable_cache` + `revalidate`) and raced with timeouts — never `force-dynamic` on a hot path.
- Connectivity shown honestly (offline banner, per-message queued/sending/failed).
**Gap to own:** the `seen`-writing half of the lifecycle was not located and must be implemented + proven; no payload-size reduction/coalescing yet; push is dormant (email is the only last-resort channel today).

---

## 7. The Acceptance Bar — 7 non-negotiable invariants

If **any one** fails, The Onyx Line is **NOT done**:

1. **Money-safety.** No message presents an FX-approximate amount as payable; all money is integer kobo with ISO-4217; `paid`/`refunded` only after ledger/provider confirmation.
2. **Notification owner-correctness.** Every row scoped by a stable FK in both RLS `USING` and `WITH CHECK`; recipients never resolved by email/phone; client writes forbidden; RLS holds on the realtime stream; no IDOR (`42501`).
3. **No contact leak / no disintermediation.** `shouldAutoFlag` runs server-side before insert; high/critical off-platform/payout-diversion content blocked and **never persisted**; displayed bodies masked; provider identity never surfaced; the public promise holds verbatim.
4. **No machine-translated Nigerian languages.** ig/yo/ha render human typed-copy or EN baseline only — never DeepL, never broken/empty; EN fallback never removed.
5. **AA contrast + a11y gate.** Zero white-on-gold; every pair ≥ 4.5:1 body / 3:1 large in both themes; status never color-alone; reduced-motion honored; SR announcements present; routes pass `a11y:contrast` / `a11y:gate` / `a11y:headers`.
6. **Works on a weak connection.** Outbound messages survive a dead network (durable queue + auto-replay); the socket self-heals; delivery is an idempotent `sent→delivered→seen→failed` machine with an email channel of last resort.
7. **No dark patterns.** Connectivity/delivery/queued/failed states shown honestly; tax always an explicit line; degraded paths announce themselves (typed event + HTTP 207); per-user caps respected; users never misled about whether a message was sent.

---

## 8. Data model (net-new canonical store — marketplace buyer↔seller)

The only net-new conversation type; the template for future migration. **No payment table touched.**

```sql
-- conversations: one row per anchored conversation
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  anchor_type     text not null,         -- 'order' | 'listing' | 'support' | 'booking' | 'job' | 'studio_project' | 'direct' | ...
  anchor_id       uuid,                  -- FK-by-convention to the anchored record (nullable for 'direct')
  division        text not null,         -- 'marketplace' | ...
  subject         text,
  status          text not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- conversation_participants: multi-party membership + per-party read state
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null,         -- STABLE FK — the owner-correctness anchor
  role            text not null,         -- 'buyer' | 'seller' | 'staff' | 'system' | ...
  last_read_at    timestamptz,
  muted_at        timestamptz,
  primary key (conversation_id, user_id)
);

-- conversation_messages
create table conversation_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  sender_id        uuid not null,
  sender_role      text not null,
  body             text not null,        -- already contact-safety-checked before insert
  attachments      jsonb default '[]',   -- media://private/... refs only, never public URLs
  safety_severity  text,                 -- audit: the verdict at send time
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
```

**RLS:** default-deny; participants `SELECT` rows where they are in `conversation_participants` (the SELECT policy must apply unchanged to the realtime stream); **all inserts are service-role-only via the pipeline** (clients never insert directly); `UPDATE` (read state) `WITH CHECK (auth.uid() = user_id)`. In the realtime publication with a `conversation_id`-scoped channel. Buyer↔seller contact info is **never** exposed between parties; seller sees the buyer only as an on-platform participant.

---

## 9. Error handling & edge cases

- **Contact-safety block:** pipeline returns `{ok:false, reason:'contact_blocked', rewritePrompt}`; the composer shows the kind localized inline message and preserves the user's draft (never destroys their text).
- **Offline send:** message enters the durable queue (`queued`), UI shows queued state; auto-replay on reconnect; 5xx → stop flush, show retry; the draft is never lost across a tab close.
- **Realtime drop:** watchdog + backoff reconnect; 30s polling fallback re-hydrates; UI shows honest connection state.
- **Wrong-owner protection:** recipient resolution is FK-only; an email/phone match is a code smell that must fail review.
- **Money in a message:** if an FX lookup is stale, show the original confirmed amount + the stale truth label, never a fabricated figure.
- **Attachment:** private bucket + signed URL only; a failed signed-URL fetch shows a retry, never a broken public link.
- **Unknown/odd anchor:** falls back to a `direct`-style thread with a generic context header (never a crash, never a dead thread).

---

## 10. Testing strategy

- **Contact-safety unit tests** (the tests `@henryco/trust` lacks): every detector pattern, the new URL/obfuscation/"call me on" cases, the mask-extension to handles/links, and the block-is-unconditional-on-flag-write-failure invariant.
- **Pipeline tests:** validate→safety→persist→notify ordering; high/critical never persists; medium masks; notification uses stable FK.
- **RLS proofs (PGlite or throwaway):** a participant can read only their conversations; a non-participant cannot; no client insert; read-state update only for self; realtime stream respects SELECT RLS.
- **i18n render proof:** ig/yo/ha resolve to EN baseline byte-identical (no machine translation leak); ar resolves RTL native; de/fr/es/pt/it/zh native.
- **a11y:** add the new routes to the audit set; assert zero critical/serious axe, every pair ≥ AA, reduced-motion coverage, focus rings, SR announcement regions.
- **Resilience:** offline-queue persists across simulated tab close + replays on reconnect; backoff caps; polling pauses when hidden.
- **Money-safety grep gates:** no payment-table writes in the diff; no float money formatting; no `×100`; every amount carries a currency.
- **Gates (run order, per house standard):** `lint:all` → `typecheck:all` → `i18n:check:strict` → `test:workspace` → `build:all` (Windows: `--workspace-concurrency=1`).

---

## 11. Honest deferrals (claimed only when their code ships)

- **KYC envelope-encryption vault** (`minimizeVerdictJson`, AES-256-GCM, crypto-shred) — documented intent, not in-tree.
- **Double-entry ledger** (`record_ledger_entry`, net-to-zero) — spec-only; messaging emits "paid" only once a real ledger confirms.
- **Gaming arena stakes messaging** — gated on owner decision D2; build only if authorized.
- **`@henryco/media` private resolver** for customer-facing message attachments — must be built (only internal-comms has a shipped private path today); until then, attachment privacy rides on the internal-comms pattern, not an assumed shared resolver.
- **Web push** — dormant pending VAPID; email is the last-resort channel for now.
- **Full unread reconciliation beyond the 50-item window** — design accounts for it; ship in the realtime workstream.

---

## 12. Rollout — sequenced, flagged, money-safe workstreams

The complete system is designed now; it ships in safe increments behind feature flags (no big-bang). Lowest-risk-first:

1. **WS-1 — Core + Safety (pure, no UI).** `@henryco/messaging` (contract + pipeline + shared offline-queue primitive) and `@henryco/contact-safety` (composing `@henryco/trust`, closing the URL/obfuscation/mask gaps) + the missing detector tests. Ships dark.
2. **WS-2 — Elevated surface.** The editorial thread + composer as reusable `@henryco/messaging` components (on `messaging-thread`/`chat-composer`), plus the cross-division aggregate inbox in `apps/account` reading the elevated `getInboxAggregate`. The "remarkable" surface the world sees — mountable in any division so no one loses in-context messaging.
3. **WS-3 — Studio safety hardening.** Wire contact-safety into studio's send path (closes the HIGH leak) + display masking; no studio data move.
4. **WS-4 — Marketplace buyer↔seller (net-new).** The canonical store + RLS + realtime + the on-platform-only participant model — the party-pair with no home today.
5. **WS-5 — Jobs realtime + convergence.** Add jobs to the realtime publication; deep-link + unread convergence; retire the bespoke interview-room duplication toward `@henryco/rooms` (optional).
6. **WS-6 — Cross-division polish.** care/property/learn/logistics onto the surface; `messaging-copy` consolidation; notification-wiring audit (stable-FK everywhere); a11y route-set + final gate.

Each workstream: behind a flag, money-safe (no payment-table change), no-regression on live realtime chat (existing transports/adapters reused), verified against the Acceptance Bar before it's called done.

---

## 13. Open decisions for the owner

- **D-A:** Inline message-body translation (display-only, original retained) — ship in v1 or defer? (Recommendation: design for it, ship the toggle in WS-6.)
- **D-B:** Should staff↔customer support threads adopt the new canonical store eventually, or stay on `support_threads` indefinitely? (Recommendation: stay; adopt only if a concrete need appears — *finish the base*.)
- **D-C:** Marketplace buyer↔seller — gated behind seller-accepts-conversation, or open on any listing inquiry? (Recommendation: seller-accept gate, to limit spam surface.)

---

*This spec is the complete design of The Onyx Line. The architecture is hybrid and money-safe; the soul is the six elevations; the law is the Values Charter and its 7-invariant Acceptance Bar, every line cited to shipped code. Nothing here is built yet — this is the blueprint to be approved, then turned into a sequenced implementation plan via writing-plans.*
