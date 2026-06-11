# Public Voice & Security — Permanent Standard

**Pass of origin:** V3-PUBLIC-HARDENING-01
**Status:** Not negotiable. Read by every pass that writes or edits a public-facing
or legal-facing surface (marketing, landing, about, feature, pricing, services,
trust, privacy, terms, policies) on any Henry Onyx site.
**Scope:** All 9 division sites + the hub. Companion to
`docs/v3/public-pages-interaction-principles.md` (interaction doctrine) and
`docs/design-tokens.md` (tokens). This document governs **what public copy says
about our infrastructure** and **the voice it says everything in**.

If a future pass and this document disagree, this document wins.

---

## Part A — Security: do not hand out a map

A public website is reconnaissance surface. Naming the stack on a marketing page
is a gift to an attacker and an amateur tell to a serious partner. Two rules.

### A1 — Zero stack disclosure on marketing surfaces

On any **marketing / about / feature / visual / landing / pricing / services /
trust** page: **no vendor, provider, or infrastructure name appears. Ever.**

This includes (non-exhaustive): Supabase, Vercel, Postgres, Cloudinary, Stripe,
Paystack, Flutterwave, Resend, Postmark, Brevo, Sentry, OneSignal, Daily.co,
SignWell, FingerprintJS, DeepL, Twilio, Mapbox, Typesense, Freshdesk, Netlify,
AWS, Cloudflare — and any architecture detail (data-centre zones, "serverless",
"edge", "CDN", "realtime", "row-level security inside <vendor>", "PCI DSS Level
1", RPO/RTO, "self-hosted").

Replace the named thing with **confident, vague-but-true** language:

| Instead of | Write |
| --- | --- |
| "Bank transfer or card via Paystack / Flutterwave" | "Bank transfer or card" |
| "Stored in Supabase (Postgres) … in Cloudinary" | "Held in an encrypted, access-controlled managed database … restricted-access encrypted storage" |
| "Hosted on Vercel's edge" | "Enterprise-grade, globally distributed hosting" |
| "We use Stripe (PCI DSS Level 1)" | "Bank-grade, PCI-compliant payment processing" |

Keep every **security assurance** (encryption in transit and at rest, access
control, row-level isolation, signed/short-lived URLs, encrypted backups,
recovery objectives). Drop only the **named product and the topology**. The
assurance is the trust signal; the vendor name is the leak.

### A2 — Minimal compliant disclosure, in one place only

Data-protection law (NDPA 2023; GDPR Art. 13/14) requires telling data subjects
who receives their personal data. We satisfy this by **naming sub-processors in
exactly one place: the dedicated "Sub-processors" section of the Privacy
Policy** — never anywhere else.

That section discloses, per processor, the **minimum**:

- **Name**
- **Functional purpose** (e.g. "Database, authentication, and file storage";
  "Card and bank payment processing") — no infra verbs.
- **Country/continent-level region** (e.g. "European Union and United States")
  for cross-border-transfer transparency — **never** zones (`us-east`,
  `Frankfurt`), topology (`serverless`, `edge`, `CDN`, `self-hosted`), or
  posture brags (`PCI DSS Level 1`, "EU data residency option enabled").

Canonical source of truth: `packages/config/legal.ts` → `SUB_PROCESSORS`
(rendered into hub `/privacy` §5 via `apps/hub/app/lib/company-pages.ts`).
Per-division privacy/policy copy (e.g. `apps/studio/lib/studio/policies.ts` §5)
follows the same shape. **Architecture prose elsewhere in a policy (`how we
store it`, `security`, `backups`) stays generic** — vendor names live in the
sub-processor section and nowhere else.

> **Hard nuance — do not over-correct.** A1 removes a reconnaissance map. It does
> **not** authorise deleting a legally-required disclosure. When you are unsure
> whether a specific disclosure is legally required, **keep it** and flag it for
> legal review. Trading a security risk for a compliance risk is a worse trade.
> Removing too much is worse than flagging.

---

## Part B — Voice: command, do not beg

Henry Onyx is a world-class company. Public copy **states**; it does not ask
permission. The voice is commanding, declarative, professional — confident
restraint, where the few remaining words carry weight.

### North star

> Begging: *"We'd love for you to sign up and hope you find value."*
> Commanding: *"Build your store. Start selling today."*

### Principles

1. **Lead with value or action.** The first words are the offer or the
   imperative, not a wind-up.
2. **Cut the pleading vocabulary.** Delete "please", "we hope", "we'd love",
   "we try", "we strive", "feel free", "if you'd like", "don't hesitate",
   "kindly", "hopefully". Delete apology and hedging outside genuine error
   recovery.
3. **Confident imperatives.** "Start selling." "Track every shipment." "Hire in
   days, not weeks." Verbs first.
4. **Assume a sophisticated reader.** State the capability; do not over-explain
   it. One sharp sentence beats three reassuring ones.
5. **Every line earns its place.** If a sentence only softens or reassures, cut
   it. Confident restraint means fewer words — and the survivors command.

### Not begging (leave these alone)

Functional microcopy is not pleading. "Please enter a valid email", form
validation, "Resend link", and genuine error-recovery apologies stay. The target
is **marketing/hero/value-prop/CTA** tone, not utility text.

### Routing

All public copy flows through `@henryco/i18n` — **never** hardcode a public
string and never bypass the i18n layer. Legal/CMS copy that is localised at
read-time (hub company pages, division policy configs) re-translates through the
cached DeepL pipeline automatically; typed per-locale copy modules
(`surface-copy`, `*-copy.ts`) carry the wording into every locale.

### Worked examples (V3-PUBLIC-HARDENING-01)

**Voice — remove the hedge, keep the promise:**

> Before: "Silence is not a strategy—we aim to respond clearly."
> After: "Silence is not a strategy—you always get a clear, written response."

The platform corpus audited in this pass was already commanding throughout (heroes like
"Verified hiring. No noise.", "Calm last-mile, visible end to end.", "You see the price
before you book."). The lesson is maintenance, not rewrite: a single "we aim" undercut an
otherwise firm promise. Audit found it, replaced the hedge with a guarantee.

**Security — drop the vendor, keep the assurance:**

> Before: "Personal data is stored in Supabase (Postgres) … in Cloudinary under restricted access."
> After: "Personal data is held in an encrypted, access-controlled managed database … restricted-access encrypted storage."

> Before (marketing): "We process payments through Stripe and route payouts to verified bank accounts."
> After: "We process payments through a PCI-compliant payment processor and route payouts to verified bank accounts."

> Before (studio /pick tech-stack chips): `["Next.js", "Supabase (RLS)", "Paystack split", "Resend"]`
> After: `["Next.js", "Secure database", "Split payments", "Transactional email"]` — neutral framework labels (Next.js) stay; provider/infra names become capabilities.

The sub-processor section of the privacy policy is the **only** place a vendor is named —
and even there, the region reads "European Union and United States", never
"EU (Frankfurt) and US (us-east)".

---

## Part B2 — Calm, not loud: the enforced tone floor (TONE-01)

Commanding is not the same as loud. The voice states with authority — it never
borrows startup energy, manufactured urgency, or marketing superlatives.
Henry Onyx is strong enough that it does not need to shout. *Henry Onyx Limited
is a space to think.*

| Instead of | Prefer |
|---|---|
| "Start your journey" | "Get started" |
| "Unlock powerful features" | "Access additional capabilities" |
| "Take control now" | "Manage your workspace" |
| "Revolutionize your workflow" | "Improve your workflow" |
| "Smart X" (feature labels) | "X" — let the behaviour prove the adjective |
| "instantly" (speed hype) | the precise moment: "on booking", "in one step" |

### The lock

This floor is **machine-enforced**, not aspirational:

- **Rule store (single source):** `packages/newsletter/src/voice.ts`
  (`DEFAULT_BANNED_PHRASES`). Add or change tone rules there — never a second
  list anywhere else.
- **CI gate:** `pnpm tone:check` (`scripts/v3/tone-gate.mjs`) parses the rule
  store and scans every copy-bearing source (typed i18n modules, email, shared
  UI, all apps) in the required CI job. **Any match fails the build.**
- Context-only rules (newsletter subject caps, unsubscribe footer) and the
  commerce exception ("Buy now" as a literal product action) are excluded from
  the code gate and documented in the gate script.

### Standing instruction to every agent and pass

**All written output — copy, microcopy, headings, CTAs, notifications, emails,
documents — uses the company voice.** Calm authority; plain, specific language;
no exclamation outside functional feedback; no urgency that the product's
reality does not create. If a phrase needs the gate's permission, it is already
the wrong phrase. Functional mechanics stay precise ("Lessons unlock in
sequence" is a fact, not hype). When in doubt, the table above and Part B's
principles decide.
