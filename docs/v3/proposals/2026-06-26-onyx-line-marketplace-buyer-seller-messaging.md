# Proposal — The Onyx Line for Marketplace: Governed, Contact-Safe Buyer↔Seller Messaging

**Status:** Proposed (for team review)
**Author:** Engineering (Henry Onyx)
**Date:** 2026-06-26
**Division:** Marketplace
**Decision sought:** Approval to ship on-platform buyer↔seller messaging with built-in contact-detail blocking, as an *extension of* — not a departure from — our anti-disintermediation standard.

---

## 1. TL;DR

We currently have **no sanctioned channel for a buyer to ask a seller a question.** Pre-purchase questions ("does this ship to Enugu?", "is this the 2024 model?", "can you hold it until Friday?") have nowhere to go on-platform. Today that silence does the **opposite** of what we want: it pushes determined buyers and sellers to find each other on Instagram, WhatsApp, or in a listing's comments — **off-platform, with zero contact-safety, zero buyer protection, and zero oversight.** That is exactly the scam vector our standards exist to close.

**This proposal closes it.** We add a private, on-platform conversation between a buyer and a seller, **anchored to a specific listing or order**, where:

- **Every message is screened by our contact-safety pipeline before it is ever stored or delivered.** Phone numbers, emails, and off-platform links are *blocked at the source* (high/critical) or *masked* (medium) — in **both directions**.
- **The seller never sees the buyer's contact details.** No email, no phone, no address inside the chat. They see a display name only. Fulfilment data (delivery address, courier phone) continues to flow through the **order**, never through the conversation — exactly as it does today.
- **Everything stays on Henry Onyx.** The conversation is the *governed alternative* to people drifting off-platform.
- **Support and disputes are untouched and remain the escalation path.** This channel sits *alongside* them, it does not replace them.

In one line: **we already promise buyers that vendors "reach you through the platform." This proposal builds the platform channel that promise refers to — and makes it the safest one in the world.**

---

## 2. Why this is an *improvement to* our standard, not a break from it

Our team's standard has been stated plainly: **buyers and sellers should not exchange contact details or take business off-platform.** That standard is correct and this proposal *enforces it more strongly than the status quo.*

The crucial distinction:

| Our actual standard | A common misreading |
|---|---|
| No **contact-detail exchange**, no **off-platform steering**, no **disintermediation**. | "Buyers and sellers must never communicate at all." |

The foundation already reflects the real standard, not the misreading:

- **Marketplace support page** (`apps/marketplace/app/account/support/page.tsx`): *"We never share contact details with vendors; they reach you **through the platform**."* — This explicitly assumes an on-platform channel as the way vendors reach buyers.
- **Help centre FAQ** (`apps/marketplace/lib/marketplace/help-faqs.ts`): the "A seller messaged me asking to pay outside the platform" entry instructs buyers to *"Report the message **from the chat thread**."* — Our own help content already names a buyer↔seller chat thread as a thing that exists.
- **Anti-disintermediation is enforced everywhere already** — seller applications, listings, reviews, and image uploads all screen for `off_platform_contact` and block off-platform steering. The machinery to keep a conversation safe is **already live and battle-tested** in our codebase (`@henryco/trust`).

What is genuinely *against* our standard is an **ungoverned** channel — one where two people swap WhatsApp numbers and disappear. **This proposal makes that impossible by construction:** the contact-safety pipeline blocks the number *before the other person ever sees it.* The channel is not a hole in the wall; **the channel is the wall.**

---

## 3. The problem today, stated plainly

1. **No pre-purchase channel.** A buyer with a simple question cannot ask it. The result is an abandoned cart, or an off-platform search for the seller.
2. **Off-platform leakage is the real risk, and we currently *cause* it.** When there is no safe on-platform way to talk, motivated parties go where we cannot protect them. We lose the conversation, the buyer loses protection, and the brand carries the scam risk anyway.
3. **We look incomplete next to every serious marketplace.** This is the line that changed our minds, and it is true:

> **Every serious marketplace — eBay, Etsy, Airbnb, Fiverr, Amazon, Jumia, Alibaba — has on-platform buyer↔seller messaging with contact-detail blocking.**

They do not allow it *despite* safety concerns; they built it *as* the safety mechanism. On-platform, screened messaging is the **industry-standard anti-scam tool**, precisely because it keeps the conversation where the platform can see and govern it. Not having one is the anomaly — and for a marketplace going worldwide, it reads as unfinished.

---

## 4. What we propose to build — "The Onyx Line for Marketplace"

A private conversation between **one buyer** and **one vendor**, anchored to a **listing** or an **order**, delivered through our existing Onyx Line messaging spine (already shipped and powering account support + studio). Concretely:

### Entry points
- **From a listing:** a "Message seller" action opens (or resumes) a conversation anchored to that listing.
- **From an order:** "Message seller about this order" opens a conversation anchored to that order.
- **Buyer inbox:** all of a buyer's conversations in one place (`/account/messages`).
- **Vendor inbox:** all of a vendor's conversations in their store workspace.

### The safety model (this is the heart of it)
1. **Screen-before-persist, both directions.** Every outbound message runs through `@henryco/contact-safety` (which composes `@henryco/trust`). High/critical contact attempts (phone, email, off-platform payment/handle steering) are **blocked before the message is stored or delivered**; medium (loose handles/links) are **masked**. The recipient never receives the raw contact detail.
2. **Identity minimisation.** Inside the conversation, the seller sees the buyer's **display name only** — never email, phone, or address. (Fulfilment data for a *paid* order continues to reach the seller through the **order record**, exactly as today — never through the chat.)
3. **On-platform-only by design.** There is no mechanism to move the conversation elsewhere; the screening guarantees that no off-platform handle survives a message.
4. **Anchored & accountable.** Every conversation is tied to a listing or order, so context, reporting, and dispute escalation are one tap away. A "Report" action on any message routes to trust review — the same trust pipeline already in production.
5. **Support & disputes preserved.** If a conversation goes wrong, the existing dispute and support paths take over — including the existing guarantee that *"if a seller goes silent on a dispute, support steps in within 48 hours."*

### What it explicitly does **NOT** do (non-goals)
- ❌ It does **not** let buyers and sellers exchange phone numbers, emails, or off-platform links. (Blocked at the source.)
- ❌ It does **not** expose buyer contact details to sellers. (Identity-minimised.)
- ❌ It does **not** become an unmoderated free-for-all. (Every message screened; report + trust review on every message.)
- ❌ It does **not** touch money, payouts, payment proofs, or the ledger. (Zero money surface.)
- ❌ It does **not** replace support or disputes. (Complements them.)

---

## 5. Trust & safety guarantees (the acceptance bar)

This work ships under the same seven invariants that govern the whole Onyx Line program; every one is enforced in code, not promised in prose:

1. **No contact leak.** High/critical blocked before persist; medium masked; verified in both directions.
2. **Money-safe.** No table, route, or type touching payments/payouts/ledger is modified.
3. **Correct notifications.** Recipients are notified by **stable user/vendor identifiers**, never by email or phone.
4. **Identity-minimised.** Seller never sees buyer email/phone/address in-thread.
5. **Default-deny data access.** Row-Level Security so a user can only ever read conversations they are a participant in; messages are written **server-side only** (client INSERT forbidden) so screening can never be bypassed.
6. **Localised & inclusive.** All new copy in our 12-locale system; ig/yo/ha/hi are never machine-translated (human translation or English fallback only).
7. **Works on a weak connection, no dark patterns.** Offline-tolerant send, accessible (AA contrast), honest UX.

---

## 6. Rollout — safe, staged, reversible

- **Dark by default.** Ships behind a feature flag; **nothing is visible to users until the team flips it on.**
- **Database migration is committed but NOT applied.** The new tables + RLS land in the repo for review; they are applied to production only when the owner/team approves — no silent schema change.
- **Validated before apply.** The migration is exercised in a throwaway local database (PGlite) to prove the RLS policies (buyer-only, vendor-only, participant-only) behave exactly as designed before anyone applies it.
- **Built with adversarial review.** Each piece is implemented and then independently security-reviewed (the same discipline that has already caught real contact-leak bugs in account support and studio during this program), plus a final whole-branch review before it is considered done.
- **Staged exposure.** Recommended: enable for a small set of trusted vendors first, watch trust-flag rates, then widen.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| A new private channel becomes a scam surface. | Every message screened before persist + delivery, both directions; report-to-trust on every message; repeat-offender escalation already exists in `@henryco/trust`. |
| Sellers harvest buyer contact details. | Identity minimisation — seller sees display name only; fulfilment data stays on the order, never the chat. |
| Moderation load increases. | Deterministic-first screening (no human in the hot path for the common case); only escalations reach the trust queue, which already exists. |
| Buyers/sellers try to evade the filter (e.g. "zero-eight-zero…"). | Our trust detectors already normalise obfuscated contact (spelled-out digits, spacing, homoglyphs); coverage is regression-locked and extended for this surface. |
| Premature for a maturing marketplace. | Dark behind a flag + staged vendor rollout means we can ship the capability now and expose it on the team's timeline, at zero risk. |

---

## 8. Why now, and why it's worth it

- It **closes a real safety gap** (off-platform leakage) instead of leaving it open.
- It **completes the marketplace** to the standard buyers worldwide already expect.
- It **reuses infrastructure we already built and proved** this program (the Onyx Line spine + contact-safety pipeline, already live on account support and studio) — so the marginal cost is low and the safety bar is already met.
- It is **fully reversible and owner-gated** — flag off, migration unapplied — so approving it costs nothing and unlocks a flagship capability.

**The ask:** approve building this as a flagged, owner-gated improvement. We deliver it world-class, dark, and reversible; the team chooses when to turn it on.

---

## Appendix A — Technical architecture (engineering detail)

> This appendix is filled in precisely from the live marketplace conventions during implementation (vendor-membership identity model, listing/order anchor tables, migration/RLS/realtime house style). Shape:

- **New store (committed, not applied):** `marketplace_conversations` (anchor_type listing|order, anchor_id, buyer_user_id, vendor_id, status, timestamps) · `marketplace_conversation_messages` (conversation_id, sender_kind buyer|vendor, sender_id, screened body, created_at) · `marketplace_conversation_participants` (conversation_id, party identifiers) — default-deny RLS, participant-scoped reads, server-side-only writes.
- **Send pipeline:** reuse `@henryco/messaging` `sendMessage` — contact-safety screen → block-before-persist → persist via a marketplace `MessagingAdapter` → best-effort notify by stable identifier. No new screening logic; one shared classifier across the ecosystem so behaviour can't drift.
- **UI:** reuse `@henryco/messaging-thread` + `@henryco/chat-composer` (the same engine behind account + studio), with marketplace's warm-paper styling and `ContactSafetyHint` pre-warning so a buyer/seller is told *before* they hit send that a number won't go through.
- **Realtime:** mirror the estate's Supabase realtime channel pattern for live thread updates; degrade gracefully to fetch-on-load on weak connections.
- **i18n:** Pattern A typed copy module; ig/yo/ha/hi English-fallback by omission (never machine-translated).

## Appendix B — Provenance (foundation citations)

- `apps/marketplace/app/account/support/page.tsx` — "we never share contact details with vendors; they reach you through the platform."
- `apps/marketplace/lib/marketplace/help-faqs.ts` — "Report the message from the chat thread"; data-privacy entry (sellers see fulfilment data only, never payment details).
- `apps/marketplace/lib/marketplace/{governance,trust,policy}.ts`, `apps/marketplace/app/api/seller-applications/route.ts` — existing live anti-disintermediation enforcement (`off_platform_contact`).
- `apps/marketplace/app/account/disputes/page.tsx` — existing support-mediated dispute thread (escalation path, preserved).
- The Onyx Line program: `docs/superpowers/specs/2026-06-26-onyx-line-unified-messaging-design.md` (spine + contact-safety, shipped on account support + studio).
