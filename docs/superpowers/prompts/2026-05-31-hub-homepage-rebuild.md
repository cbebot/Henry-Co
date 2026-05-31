# Launch Prompt — Henry & Co. Homepage Rebuild

**Paste this to kick off the build.** It briefs a fresh implementing agent with everything needed; the authoritative detail lives in the two companion artifacts.

- **Design spec (the why + the design):** `docs/superpowers/specs/2026-05-31-hub-homepage-rebuild-design.md`
- **Implementation plan (the staged how):** `docs/superpowers/plans/2026-05-31-hub-homepage-rebuild.md`

---

## Mission

Rebuild the Henry & Co. **company homepage** — `apps/hub`, the root route `/` (`app/(site)/page.tsx` → `HubHomeClient`) — from scratch. This is the company's front door and the owner's **highest-bar surface**: the first impression that decides how confident a visitor feels before anything else. The current page reads "like a textbook" — a grid of equal cards, adjectives where proof belongs, no spine. Replace it with a bespoke front door built on one thesis:

> **One standard, many engines.** Henry & Co. is not a catalog of unrelated businesses — it is one operating standard expressed through many divisions. Say that in the *structure*, not in adjectives.

**Spine (top → bottom):** bespoke chrome → **The Standard** (above-the-fold statement + honest live proof rail + one way in + ambient depth) → **The Index of Engines** (the centerpiece: a row-based editorial directory, NOT cards) → **The Operating Standard** (an editorial through-line on *why* every engine feels the same) → **Proof & Make** (honest signals + the in-house maker's mark) → **Questions** (calm FAQ) → premium footer.

## The bar (read this twice)

This must be **far more ambitious than the Studio `/request` rebuild** — studio is the floor for *rigor* (staged, `tsc`-gated, ships through CI), never the ceiling for *craft*. Concretely, go beyond studio with: **genuine WebGL ambient depth** (R3F — studio shipped none), a **signature anti-card Index-of-Engines interaction** (accent-hairline sweep + magnetic lift + ambient preview wash), **bespoke from-scratch chrome**, a **richer motion vocabulary**, and **scroll choreography**. Restraint is the luxury — depth, not spectacle. Aim for an honest 100/100: **proof over adjectives, no nonsense, no fabricated numbers.** Do NOT reuse studio components/motion as-is to save effort; this surface earns its own system.

## Hard prerequisite (do not start before this)

The Studio `/request` rebuild must be **merged to `main` and live on Vercel production** first. (As of writing: merged — `origin/main` `d6930b95`, PR #172 — and auto-deploying; the owner confirms live.) Confirm studio is live before Stage 0.

## Skills to invoke

- **superpowers:using-git-worktrees** — build in an isolated worktree off `origin/main` (the owner runs parallel sessions on a shared tree; re-check state before any destructive op; stage files by name).
- **superpowers:subagent-driven-development** (or **executing-plans**) — execute the staged plan. The plan's stages are mostly independent section components; dispatch implementers per stage, two-stage review each. **Every subagent dispatch uses `model="opus"` (max effort) — never downgrade.** Do tightly-coupled/serial work (the orchestrator wiring, the contract guard) yourself.
- **superpowers:requesting-code-review** + **superpowers:finishing-a-development-branch** — review gates + ship.
- If the owner wants to re-open the design direction, **superpowers:brainstorming** before touching the plan.

## Load-bearing invariants (verified firsthand — regressing any of these breaks the page; full detail in the plan's "Ground rules")

1. **The homepage owns its entire chrome.** `PublicSiteShell.tsx` renders `children` ALONE on `/` (no shared header/footer/`<main>`). Build header, slim nav, skip-link, `<main id="henryco-main">`, and footer yourself. Do NOT retrofit `PublicHeader`. (This is also the blast-radius guarantee: bespoke chrome here touches no other route.)
2. **The 14-prop server→client contract is frozen.** Copy `HubHomeClient`'s exact props interface verbatim *before* writing UI; do not change its shape or touch `page.tsx`'s fetch/JSON-LD/metadata. Thread all new copy through the `copy` prop (extend the copy model), never via new props.
3. **Honesty is structural.** `divisionStats[key].metric` is `string | null`; on RLS denial it's `null`. Show the designed phrase or the CTA verb — **never a fabricated or zero number**. `hasServerError` → render every engine with its verb (never blank).
4. **`coming_soon` divisions are excluded server-side** — invent no "coming soon" tiles.
5. **All authored copy through the copy model** (`packages/i18n/src/hub-home-copy.ts` — extend type + EN base + FR; locale maps deep-merge as partial). The `hardcoded-text-scan` gate fails on new literal UI strings. Division verbs/metrics come from `divisionStats`, not hardcoded.
6. **No money / pricing / auth / account logic** — marketing surface only.
7. **No giant hero text** — above-the-fold leads with capability evidence (statement + live proof rail), not a viewport-filling headline.
8. **Off-limits:** `packages/search-ui/` (quality reference only), shared `globals.css` tokens, the server contract.

## Stage map (detail + code sketches in the plan)

- **Stage 0** — Foundation: bespoke `home-motion.ts` vocabulary (reveal/stagger/countUp/**sweep/magnetic/ambientDrift**, JS reduced-motion gated) + extend the copy model.
- **Stage 1** — Bespoke chrome (`home-chrome` header + scroll-spy nav + mobile sheet; `home-footer`) + rebuild `HubHomeClient` as a thin orchestrator (pin the 14-prop contract first).
- **Stage 2** — **The Standard** above-the-fold + **`home-ambient`** genuine restrained R3F depth (hard reduced-motion/mobile bail; lazy `ssr:false`; `HubParticles` fallback).
- **Stage 3** — **The Index of Engines** (centerpiece): 3A directory structure (`home-index` + `home-index-row`), 3B the signature hover/focus interaction. Anti-card; each row → `getDivisionUrl(key)`; null-safe proof slot.
- **Stage 4** — **The Operating Standard** editorial through-line (replaces value cards — prose + quiet hairline structure, no cards).
- **Stage 5** — **Proof & Make** (honest live recap + "Built in-house by HenryCo Studio").
- **Stage 6** — **Questions** (accessible FAQ accordion from `initialFaqs`, `copy.faqFallback` if empty).
- **Stage 7** — Choreography, depth & accessibility (scroll reveals; one crafted beat; AA on dark canvas; full keyboard path; **must pass the PNH contrast/headers gate**).
- **Stage 8** — Ship (full local gate; squash PR → `main`; CI; production-verify — see caveat).

## Verification & gates

- `pnpm --filter @henryco/hub typecheck` + `lint` (no unit harness — `tsc` is the proof).
- `node scripts/v3/hardcoded-text-scan.mjs --check` (copy-model only).
- `pnpm run dead-link:check` (every header/footer/index link resolves).
- **PNH baseline + contrast matrix + headers** gate green — this surface is the reason that gate exists; fix contrast by using the AA-safe token, never by lowering the bar.
- Required CI context: **"Lint, typecheck, test, build"** (branch protection on `main`).
- **Preview caveat (state it honestly):** the hub **500s on Vercel preview** (Supabase env is production-only). Do NOT claim a green preview as proof. Verify structure/types via the local gates; confirm the live data path (real division counts, engine links, account chip, reduced-motion, mobile sheet) on **production after merge**.

## Confirm with the owner before the high-leverage stages (design-spec §10)

1. **Index-as-directory vs. an alternative** (e.g. full-bleed per-engine panels) — the single highest-leverage call; confirm before Stage 3.
2. **R3F ambient appetite** — proposal: restrained depth only (orbs/particles, optional subtle field), never a heavy hero scene; confirm before Stage 2.2.
3. **Which real numbers headline the proof rail** — proposal: divisions live + strongest real counts (products / listings / regions / programs / capabilities), all honest-null-safe.
4. **Bespoke chrome** (not retrofitted `PublicHeader`) — confirm at Stage 1.
5. **New copy wording** — drafted in calm/premium voice in the copy model; owner reviews at Stage 0.2 / 4.1.

## Voice & design language

Calm, concrete, premium. No hype, no fake enthusiasm, no invented product/persona names. Display serif (`--acct-font-display`) for the standard statement, engine names, and section leads; system sans for UI; mono (`--hc-font-mono`) for live numbers (instrument-readout feel). Dark `--site-*` canvas; brand gold (`--hc-accent`) as the single, sparse accent. Generous negative space. Every animated node renders its final state under reduced motion — no layout shift, ever.
