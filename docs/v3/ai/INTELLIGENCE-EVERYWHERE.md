# Henry Onyx Intelligence — everywhere, governed, and earning

**The strategy: one governed brain, mounted into every division, that makes the company
measurably smarter while paying for itself.** This is the blueprint that turns the V3-AI-01
gateway from "an AI feature in marketplace" into the intelligence spine of the whole company.

Not hype. A plan grounded in what is already built and proven.

---

## 1. The principle — one brain, not fifty features

Most companies bolt a chatbot onto each product. That fragments the model choice, leaks the
provider, scatters the cost, and makes governance impossible. Henry Onyx does the opposite:

> **Every AI action in the company — in any division — goes through exactly one governed
> gateway (`@henryco/ai-gateway`). A division never imports a model SDK. It mounts a
> *surface*; the gateway does the thinking, the metering, the billing, and the audit.**

This is why it scales to the whole company without becoming a liability:

- **The provider and the real model are invisible** — server-only, redacted from every
  client payload, log, and receipt. A competitor cannot learn how we think. (Proven: the
  built client bundle greps to zero provider/model tokens.)
- **The company governs the brain as data, not code** — which model backs each tier, the
  margin %, the per-surface FREE/METERED flag, the caps — all live in the rate card and the
  routing config. The owner re-tunes the entire company's intelligence without a deploy.
- **Every call is money-grade** — prepaid (wallet-zero ⇒ never called), auth-gated (no
  anonymous AI), hard-capped at the quote, settled atomically through the real double-entry
  ledger, and audited (V19). The same guarantees that protect a payment protect a thought.

## 2. The economics — intelligence that earns, not costs

The decisive difference from every competitor: **our AI is a revenue line, not a cost
centre.** Each metered call bills `provider cost + company margin % + VAT`, debited from the
user's wallet, posted as `platform_revenue`. The model literally pays for itself and profits
on every question — by construction, transparently, with the price shown before it runs.

- **Company-critical tasks are FREE** (support-message help, account-check) — they reduce
  support load and increase trust, so we subsidise them on purpose.
- **Personal/business tasks are METERED** — drafting a listing, a business message, a
  studio brief, a chat reply, a verification — the user pays a fair, capped amount for real
  value, and higher-capability models bill higher (the per-tier rate card).
- **The margin is governed and invisible** — never shown to the user, retunable live.

A platform whose intelligence funds itself can offer *more* intelligence than one burning
cash on a flat subscription. That is a durable advantage at global scale.

## 3. The moat — "Henry Onyx Verified" everywhere

Drafting copy is table stakes; everyone has it. The thing no one else has is **a metered,
deep-model trust review that makes Henry Onyx content provably honest.** This is the
flagship differentiator (designed in `PASS-2-LISTING-VERIFY.md`, generalised here):

Before anything goes live — a marketplace listing, a job post, a course, a property, a
studio deliverable, a profile — the poster can opt into a **Henry Onyx Intelligence Review**
(deep tier, metered). The AI reads the media + the copy and verifies it is **honest, not
AI-generated, matches our standards, and is safe**, then earns a **Henry Onyx Verified**
badge. The poster pays a little, for their own credibility; buyers trust verified content
more. This compounds: the more verified content, the more trusted the marketplace, the more
sellers want the badge, the more revenue — a flywheel a flat chatbot can never spin.

Crucially, the verdict is **advisory + triage layered on top of human moderation** — it
augments the existing gate, never silently auto-publishes. Trust earned, not faked.

## 4. The map — a surface per division

The gateway's surface registry is the company's intelligence catalogue. Each row is a
governed entry point with a policy (billable?, tier, caps). Built today, and the forward map:

| Division | FREE (company-critical) | METERED (personal/business) | Trust review (deep) |
|---|---|---|---|
| **Account** | `account.check.assist` ✅ | — | — |
| **Support (all)** | `support.message.assist` ✅ | — | — |
| **Intelligence** | — | `intelligence.chat` ✅ (governed chat) | — |
| **Marketplace** | — | `marketplace.listing.draft` ✅ | `marketplace.listing.verify` (designed) |
| **Business suite** | — | `business.message.assist` ✅ | — |
| **Studio** | `studio.brief.staff` ✅ | `studio.brief.client` ✅ | `studio.deliverable.verify` (planned) |
| **Jobs** | `jobs.application.assist` (planned, FREE for candidates) | `jobs.posting.draft` (planned) | `jobs.posting.verify` (planned) |
| **Learn** | `learn.question.assist` (planned, FREE) | `learn.course.draft` (planned) | `learn.course.verify` (planned) |
| **Property** | — | `property.listing.draft` (planned) | `property.listing.verify` (planned) |
| **Care** | `care.message.assist` (planned, FREE) | — | — |
| **Hub (owner)** | `hub.analytics.assist` (planned, internal) | — | — |

Adding a division to this map is **data + a thin mount**, not a new AI system. That is the
whole point.

## 5. The leverage — mounting is uniform and tiny

To make this real "across the whole company" without per-app sprawl, the mount is uniform.
A division wires a surface by giving the gateway three already-standard things — *who is
authenticated*, *the metered-billing port*, and *the audit client* — and the gateway does
everything else. The auth gate, the prepaid reservation, the metering, the price cap, the
balanced ledger post, the redacted receipt, the audit row, and the opacity are written
**once**, in the gateway, and reused by every division verbatim.

Concretely, a new division surface is: (1) a registry entry (policy), (2) a prompt builder
(its system prompt + topic guard), (3) a thin server action that resolves the viewer and
calls `runAiTask`, (4) a Register-L panel. No new money code, no new provider code, no new
opacity surface. The shared "intelligence surface kit" (planned) collapses (3)+(4) to a few
lines so any division mounts in an afternoon, safely.

## 6. Governance — the owner holds the brain

Pass 3 builds the governance console (Register-D, owner/staff): set the margin % and
FREE/METERED per surface, edit the rate card, and **set which model backs each tier** — for
the entire company, without code, every change audited (`pricing_override_events` +
`audit-log`). Plus the usage/margin/VAT analytics: cost vs margin vs VAT by surface and
period, provider-cost drift, cap-hit and refusal rates, VAT remittance. The owner sees and
steers the whole company's intelligence from one place.

## 7. The non-negotiables (carried into every surface, forever)

1. Provider + real model name **never** reach a client, a log, or a receipt.
2. Money posts through the **real** double-entry ledger — balanced, idempotent, guarded,
   never a side channel. The wallet can never go negative; the user is never charged above
   the quote.
3. **No anonymous AI** (auth-gated at the router) and **wallet-zero ⇒ never called**.
4. Every call is **audited**.
5. AI verdicts **augment** human moderation; they never silently auto-publish.
6. Calm-authority voice; "Henry Onyx" brand only; i18n Pattern A; both themes.
7. Flag-dark launch, monitored ramp, kill switch; reconcile rates to live provider prices
   before enabling.

This is how a real company becomes genuinely, durably smarter than anyone else: not a
louder chatbot, but **one governed, self-funding, trust-building intelligence spine that
every part of the business plugs into — and that only ever works for Henry Onyx.**
