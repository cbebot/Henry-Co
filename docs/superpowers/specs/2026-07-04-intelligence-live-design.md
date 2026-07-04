# Henry Onyx Intelligence Live — design (approved 2026-07-04)

Owner directive: retire the floating "?" concierge; in its place, the company's own intelligence
on every page — real live support integrated with the AI, owner visibility over every
conversation, instant human escalation, account-aware help, and smart monetization. Global
standard: a real company-brand AI. The R-team's persona guidelines fold into the doctrine.

## The three layers

1. **The surface.** `packages/ui/src/support/SupportAssist.tsx` (the shared "?") becomes the
   Henry Onyx Intelligence launcher on every division page. The panel builds on
   `packages/chat-thread` (the shipped premium chat UI). Context-aware: signed-in user +
   division + current page travel with every turn. Replies render in the brand reading
   language (`.hc-prose` rhythm, structured formatting — never plain dumps); the full
   site-typography pass is a later program, per the owner.

2. **The brain.** The registered-but-dormant `support.message.assist` surface (FREE) carries
   general support, doctrine-governed (representation, language mirroring, calm authority,
   identify-as-AI). A structured **action envelope** (coach-envelope precedent) gives it hands:
   - `navigate` actions → branded buttons deep-linking across divisions.
   - Account-aware answers (signed-in): the server pre-fetches the user's OWN records
     (wallet balance, orders, payments — RLS-respecting) and grounds the prompt with real
     numbers. Never guesses.
   - **Human handoff (the trust anchor):** when the AI cannot help or the person asks, it
     creates a real thread on the existing Onyx Line `support_threads` spine, tagged
     `intelligence_escalation`, alerting staff support instantly — and says so honestly.
   - **Smart monetization (owner addendum):** general support is FREE forever; PERSONALIZED
     deep work charges the wallet directly through the existing metered rail
     (reserve → settle, prepaid, receipts) — e.g. deep marketing analysis of the user's own
     store/listings, tailored growth plans, portfolio reviews. A chargeable-capability
     registry (tier + price per capability, owner-tunable like the rate card) classifies the
     request; the price is shown BEFORE running ("This deep analysis is ₦X — proceed?");
     no charge without explicit confirmation; refusals/failures release the hold. The AI
     never pressures — it offers, in the calm expensive manner of the house.

3. **The owner's window.** Every conversation persists (`intelligence_conversations` +
   `intelligence_messages`; RLS: user reads own, owner role reads all, no client writes
   outside the server action). A hub console page lists every conversation across divisions,
   live, escalations first. Knowledge is owner-editable via a CMS collection (company facts,
   policies, founder: Onah Chukwuemeka Henry).

## R-team guideline deltas → one doctrine PR
Identify as AI (never pretend to be human); guided info-gathering (summarize progress, confirm
understanding, ask before assuming); conciseness/formatting discipline (short paragraphs,
lists, one idea at a time); division-adaptive vocabulary under the one persona. Kept from the
existing doctrine (stronger than the R-team draft): provider/model opacity, the RC 9594234
representation posture, language mirroring, never-hedge-on-the-company.

## Delivery stages (each merges clean)
- **L1** — doctrine deltas · launcher + panel · FREE support chat (all divisions) ·
  persistence · navigate actions · human handoff · the "?" retired.
- **L2** — hub owner console (all chats, escalation queue).
- **L3** — account-aware answers (balance etc., server-grounded).
- **L4** — the chargeable-capability registry + first paid capability (deep marketing
  analysis), price-before-run, metered-rail settled.

Decisions taken: free until L4 ships; escalations land in the staff support console; the
launcher shows for anonymous visitors (session-actor caps, coach precedent).
