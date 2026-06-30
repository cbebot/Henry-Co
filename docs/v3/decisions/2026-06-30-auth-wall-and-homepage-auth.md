# Decision note — Should Henry Onyx lock the whole platform behind an account?

**Prepared for:** Henry Onyx leadership · **Date:** 2026-06-30 · **Prepared by:** engineering
(at the company's request) · **Decision class:** Strategy / growth / brand — high impact.

**The question put to me:** lock the entire company behind authentication — require an account
before accessing *anything*, the way X and Facebook do — and move signup/login onto the
homepage.

## My recommendation, up front

**Move signup/login onto the homepage and make it a first-class, prominent moment — yes.
Hard-lock the entire platform behind an account — no.** A full auth-wall would, in my honest
assessment, cost Henry Onyx far more than it gains, and it copies the wrong role model. There
is a smarter version that delivers everything the company actually wants — more accounts, more
data, more trust, more engagement — without the damage. I lay out both below so you can decide
with the full picture.

## Why the X / Facebook comparison is the wrong model

X and Facebook are **social networks**: the product *is* the network of other people, so an
account is the price of entry to the thing itself. Henry Onyx is a **marketplace + services
platform** — the product is providers, products, jobs, properties, and courses. The right peers
are **Amazon, Airbnb, Indeed, Zillow, Upwork, Booking.com**. Not one of them locks browsing
behind a login. They all let the world browse everything freely and ask for an account **only
at the moment of action** — buy, book, apply, message, pay. That is a deliberate, well-tested
choice, not an oversight.

## What a full auth-wall would cost us (the honest risks)

1. **SEO collapse — the biggest one.** An auth-wall blocks Google/Bing from crawling our
   listings, providers, jobs, properties, and courses. For a marketplace, organic search
   ("cleaning service near me", "2-bedroom flat Lekki", "React job Lagos") is a *primary*
   acquisition channel — often the largest. Locking the site makes all of it invisible
   overnight. X/Facebook can absorb this because people type their name directly; a marketplace
   lives on discovery. This alone is usually decisive.
2. **Top-of-funnel collapse.** Forcing signup before any value is shown is the single most
   reliable way to crush conversion. Every paid ad click and every shared link would hit a wall
   and bounce — we'd pay for traffic that sees nothing.
3. **It contradicts our own published doctrine.** Our interaction principles (the law the V3
   showcase is built on) mandate **micro-commitments before macro-commitments** — let people
   experience value, *then* ask for identity at the moment of intent. The showcase journey
   itself browses and saves anonymously before identifying. A wall is the opposite of the
   experience we've committed to.
4. **Press, investors, partners, regulators** need public marketing, pricing, the Earning Map,
   legal pages, and the showcase. Those must stay open regardless.

## What we'd gain from a wall — and how to get it without one

The real goals behind "lock it" are sound: **more registered users, more first-party data,
more trust/less abuse, more re-engagement reach.** Every one of those is achievable with
*intent-gating* instead of a wall:

- **More accounts:** ask for the account at the exact moment the user wants something (save a
  provider, book, pay, apply, message, contact) — this converts far better than a cold wall,
  and the account you get is a *motivated* one.
- **More data:** the anonymous-session pattern already lets us personalize logged-out visitors
  and carry their state into the account they create.
- **Less abuse / scraping:** rate-limit + bot-protect the public browse surfaces and gate the
  high-value actions — you stop abuse without blinding Google.
- **More reach:** a great homepage auth moment + intent-gating grows the registered base
  steadily, which feeds push/email.

## What I recommend we actually do

1. **Keep public:** discovery surfaces (catalog, providers, jobs, properties, courses), all
   marketing, pricing, the Earning Map, legal, press, and the showcase. (SEO + funnel + trust.)
2. **Make auth a first-class homepage moment — do this part fully.** A prominent "Create your
   free account" primary action above the fold, persistent sign-in/up in the header, a
   beautiful, fast auth flow, and social proof around it. This is the good half of the request,
   and it's worth doing to a high polish.
3. **Gate at the moment of value (the micro-commitment ladder):** save → email → account,
   asked precisely when the user reaches for the action. Require an account to **save, book,
   pay, apply, message a provider, or see contact details** — not to browse.
4. **Keep the genuinely personal/transactional surfaces locked** (already true today):
   dashboards, wallet, checkout completion, messaging, account, KYC, provider PII.
5. **If leadership still wants a firmer nudge:** a *soft* "preview-then-prompt" after real
   engagement (e.g. after viewing several listings) — never on the first page, never on SEO
   landing pages, never blocking crawlers. This is the most I'd advise, and only with care.

## The one case where a hard wall is correct

If Henry Onyx is *intentionally* a closed, invite-only or members-only community — i.e., the
strategy is exclusivity rather than discovery/scale — then a wall is consistent and my
recommendation flips. My recommendation above assumes the goal is **growth of a public
marketplace**. If that assumption is wrong, tell me and I'll re-reason it from the exclusivity
premise.

## Bottom line for the room

> **Homepage auth: yes, prominently. Whole-platform wall: no.** Grow the registered base by
> asking at the moment of intent and by making the homepage account moment excellent — not by
> blinding our own discovery engine. We get the accounts, the data, and the trust without
> paying for it in SEO and funnel. If exclusivity (not growth) is the actual goal, that's a
> different decision and I'll redo this from that premise.

*Engineering can implement either direction cleanly. This note is a recommendation, not a
constraint — the call is leadership's, and I'll build whatever is decided to the same bar.*
