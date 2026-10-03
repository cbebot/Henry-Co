# COPY-RESET — cut doctrine

Owner, 2026-10-03: the public copy over-explains. It is text-heavy, and it is a
security leak — it describes how the system works, which helps an attacker map
the backend. Remove the explanations.

## The test for every line

A line stays only if a visitor needs it to **decide, act, or trust a fact the
code makes true**. Everything else goes.

## Cut

- **Mechanism descriptions** — how verification, review, moderation, matching,
  scoring, holds, gates, routing, dispatch, records, pipelines, checkpoints,
  tracking internals or AI checks work. State the outcome, never the machinery.
- **Process narration** — "how it works" step bodies, "what the request
  captures", service-journey essays, timelines that describe internal stages.
- **Positioning filler** — audience lists, "one operating standard", "built for
  disciplined service", trust-signal paragraphs, "no guessing" reassurance.
- **Duplicates** — a lede that repeats the h1, a closing band that repeats the
  hero, a kicker that repeats its heading, a second CTA band with the same links.
- **Format leaks** — sample IDs/codes, internal field names, table or role names.

## Keep (never cut)

- One meaningful `h1` and a concise meta description (≤ 160 characters).
- Navigation and CTAs that are a path somewhere — never strand a visitor.
- Form labels, placeholders that name a field, errors, consent and
  terms-acceptance lines, and every `aria-label` / `alt` / accessible name.
- Legally required or sensitive lines (see `legal-lines.md`); legal pages are
  measured but not budgeted — any change there is listed.
- Decision-point truth: fees, VAT-inclusive pricing, delivery, refunds,
  protection — accurate and visible where money is committed. A claim survives
  only if code or config makes it true (see `claims-ledger.md`); an untraceable
  claim is removed, a mismatched one is corrected to what the code does.
- Real data (prices, listings, hours, contact email).
- Registration and tax numbers: never add one; never delete one from legal
  pages, receipts or invoices.

## How to cut

1. Delete before rewriting. Prefer removing a block to shortening it.
2. When a block must stay, keep its best existing sentence; rewrite only to
   remove jargon ("execution", "logistics", "manifest") or a mechanism.
3. Headings become plain labels ("Office cleaning packages", "Client reviews").
4. Remove a section's JSX together with its copy; remove now-unused copy keys
   from the type, EN and locales (`node scripts/copy-audit/i18n-strip.mjs
   --write --only <your files>` strips locale overrides of changed/removed EN).
5. Keep anchors that navigation targets (`id="pricing"` etc.).
6. No route, behaviour, data or styling changes. Copy and markup text only.
7. Voice: calm authority, plain words, no hype, no exclamation marks
   (`pnpm tone:check`). Brand: "Henry Onyx", divisions "Henry Onyx <Division>"
   (Fabric Care, not "Care"); never "Henry & Co.".

## Budgets

`scripts/copy-audit/config.mjs` is the single source. Page words (desktop or
mobile, whichever is larger) per route type; header/footer chrome separately.
