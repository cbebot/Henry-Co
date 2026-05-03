# V3 Prompt Fusion Template

**Pass:** V5-5 V3 Discovery Framework
**Compiled:** 2026-05-03
**Author:** Claude · Opus 4.7 (1M context) · xhigh
**Audience:** the next Claude turn that fuses the owner's saved V3 prompts with the V5-5 discovery scaffold

---

## Purpose

When the owner returns with their saved V3 prompts (a Claude Pro turn the owner has prepared in advance), the next Claude run must:

1. Read the owner's prompts as the **spine** — the owner's intent is canonical
2. Read the V5-5 discovery scaffold (`V3-DISCOVERY-INVENTORY.md`, `V3-RECOMMENDED-ROADMAP.md`, `V3-BACKLOG-FROM-V2.md`) as the **context**
3. Fuse them into a final V3 master roadmap **formatted for the owner's notes** (the owner explicitly asked for this format)

This template specifies the structure of that fused output.

---

## Structure of the fused V3 master roadmap

The final document the owner receives must follow this structure exactly. Every section is mandatory unless the owner's prompt explicitly drops it.

### Section 0 — Owner intent (verbatim)

The owner's saved V3 prompts go here, **verbatim**, in their original phrasing. Do not summarize. Do not reword. The owner's voice leads.

If the owner provides multiple prompts, list them as 0.1, 0.2, 0.3 in the order the owner provides them.

### Section 1 — Claude's reading of intent

After the verbatim prompts, Claude restates each owner directive in a single sentence:

```
Owner directive 0.1 → Claude reads as: <one sentence>
Owner directive 0.2 → Claude reads as: <one sentence>
...
```

If Claude's reading differs from what the owner appears to have said, flag it explicitly:

```
Owner directive 0.3 says X. Claude reads this as Y because Z. If the owner intended X', this fusion needs revision.
```

### Section 2 — Per-directive expansion with discovery citations

For every owner directive in §0, Claude writes:

- **What V2 already shipped** that touches this directive (cite by V2 pass + report path + capability number from `V3-DISCOVERY-INVENTORY.md` §W3)
- **What V3 backlog already names** for this directive (cite by V3 backlog ID — A1, B5, etc.)
- **What's missing from inventory** that this directive surfaces (Claude's identified gap)
- **Effort estimate** in weeks
- **Risk class** (low / medium / high)
- **Dependencies** (other directives, infra, owner gates)

Example shape:

```
### Owner directive 0.2 — "We must dominate marketplace search."

What V2 shipped:
- V2-SEARCH-01 (capability §W3.3 in V3-DISCOVERY-INVENTORY) — cross-division command palette,
  search-core + search-ui packages, 15 Typesense collections, outbox cron, hub + account wired.
- V5-2 hand-off §1 — discovery + intelligent ranking architecture sketched as 5 sub-PRs (V3-MARKET-A through E).

What V3 backlog already names:
- H1 — wire palette host into 6 remaining division shells.
- H3 — backfill Typesense from production.
- B11 — marketplace landing hero re-cap (already addresses owner concern about visual sparseness above the fold).

What's missing:
- Typesense env vars not provisioned (operational gate, owner action).
- No conversion telemetry on search results yet (V5-2 §F suggests this for V3).

Effort estimate: 5 weeks (spans T3.A from V3-RECOMMENDED-ROADMAP).
Risk: Medium. Re-ranking can break vendor trust if low-trust sellers surface inadvertently — diversity guard required.
Dependencies: Owner provisions Typesense env (operational gate D6 from V3-RECOMMENDED-ROADMAP).
```

### Section 3 — Claude's recommendations to extend or modify

Where Claude recommends additions or modifications to the owner's directive, this section frames them as:

```
Owner asked: <verbatim from §0>
Claude recommends: <owner's ask> + <addition>
Because: <reason citing inventory or backlog>
```

For example:

```
Owner asked: "Build the property rules engine."
Claude recommends: build the property rules engine + ship the inspection-eligibility surface
  alongside, because docs/property-inspection-eligibility-rules.md was authored as a paired deliverable
  and shipping rules without inspection-surface creates a contradicting public claim.
```

Recommendations must be specific. Generic advice does not belong here.

### Section 4 — Critical gaps the owner did not mention

The discovery inventory may surface items the owner's prompts did not address. List them with severity:

```
**Gap (CRITICAL):** Staff app deploy lag (V3 backlog C1) — staff is at 8508f75, every other app at e5e277a.
Without remediation, staff workspace will diverge further weekly. Owner did not mention this in V3 prompts;
inventory surfaces it as critical entry condition.

**Gap (SERIOUS):** Live verification infrastructure not provisioned (V3 backlog A1–A8). Owner mentioned
"premium quality" repeatedly but premium quality cannot be certified without live test infra. Recommend
T2 from V3-RECOMMENDED-ROADMAP runs in parallel with whatever V3 features the owner picks.

**Gap (MODERATE):** ...
```

If the owner's prompts have already addressed every critical gap, write "No critical gaps remain unmentioned."

### Section 5 — Sequencing

Convert the per-directive expansions into a single sequenced plan. Use the 3-track frame from `V3-RECOMMENDED-ROADMAP.md`:

- **T1** — V5-3+P0 closure PR (always first, week 1)
- **T2** — Live verification infra (always parallel from week 1)
- **T3** — Owner-authorized features (sequenced per owner picks)

If the owner's directive overrides this sequencing, follow the owner's lead and document the deviation:

```
Owner directive 0.4 instructs T3.D (international) ships first. This contradicts Claude's
recommendation in V3-RECOMMENDED-ROADMAP §T3 priority order. Following owner instruction. Risk: T3.A
discovery + ranking work is delayed; marketplace scale-out window slips by N weeks.
```

### Section 6 — Anti-patterns this V3 must respect

Restate the V2 lessons that V3 must not repeat. Source: V2 pass reports + `feedback_no_giant_hero_text.md` + the owner's recurring quality language.

```
- Do NOT ship landing heroes that scale a single headline to fill the viewport (feedback_no_giant_hero_text.md)
- Do NOT add features without commit + PR + deploy verification (V5-3 → V5-4 lesson)
- Do NOT certify closure without live walk evidence (V5-4 lesson)
- Do NOT introduce destructive operations as shortcuts (harness + memory rule)
- Do NOT bypass V2-PNH-04 baseline headers (every V2 PR enforces this in CI)
- Do NOT ship AI agents in customer-facing surfaces without owner explicit authorization
  (DASH-PROMPT-HARDEN-01)
- Do NOT skip persisted reports (every V2 pass writes one to .codex-temp/<pass>/report.md)
- Do NOT mock the database in tests (existing user feedback memory)
```

Add any owner-stated anti-patterns from §0 to this list.

### Section 7 — Verification gates per V3 PR

Every V3 PR must pass:

- Lint, typecheck, test, build (existing CI)
- V2-PNH-04 baseline headers preserved
- A11y gate (V2-A11Y-01) — `pnpm a11y` against changed routes
- Lighthouse + axe on Vercel preview (after T2 ships)
- Live walk against changed surfaces with curl evidence
- Persisted report at `.codex-temp/v3-<pass>/report.md`

### Section 8 — Hand-off

Specify the next pass:

- If V3.A ships → V3.B starts
- If all V3 features land → V6 dashboard execution begins (DASH-1)
- If owner pivots mid-V3 → re-fuse with V5-5 scaffold + new owner prompts

---

## Operational rules for the fusion turn

When the next Claude turn runs the fusion, it must:

1. **Read these in order before writing:**
   - The owner's saved V3 prompts (provided by owner at fusion time)
   - `docs/v3/V3-DISCOVERY-INVENTORY.md` (this V5-5 pass output)
   - `docs/v3/V3-RECOMMENDED-ROADMAP.md` (this V5-5 pass output)
   - `docs/v3/V3-BACKLOG-FROM-V2.md` (V5-4 output)
   - `docs/v2/V2-CLOSURE-CERTIFICATE.md` (V5-4 output)
   - The V2 capability buckets in §W3 of the discovery inventory

2. **Cite every fact:** every claim about platform state, deployment, capability, or backlog must cite the inventory or report it came from. No unsourced assertions.

3. **Preserve owner voice:** §0 is verbatim. Claude's restatements live in §1, never in §0.

4. **Flag, don't decide:** when an owner directive needs a decision (timeline, scope, risk acceptance), flag it as a decision in §3 or §5 — never silently choose for the owner.

5. **Write the fused output to:**
   - `.codex-temp/v3-master/report.md` — the audit transcript
   - `docs/v3/V3-MASTER-ROADMAP.md` — the formal owner-facing artifact (formatted for the owner's notes per their explicit ask)

6. **Do not exceed scope:** if the owner's prompts ask for fewer items than the inventory recommends, do not invent additions in §3 — only the inventory-surfaced gaps in §4 are allowed beyond what the owner asked for.

7. **End with a self-verification checklist:** every section above present, every owner directive expanded, every critical gap surfaced, every recommendation framed with "owner asked X, Claude recommends X+Y because Z."

---

## Output format reminder — "formatted for owner notes"

The owner has explicitly asked V3 documents be formatted for their notes. That means:

- Headings shallow (H1, H2 mostly; H3 only when needed)
- Tables sparingly (only where they help comprehension)
- No code blocks unless quoting verbatim from inventory or backlog
- One idea per paragraph
- Bullet lists with concrete nouns, not adjectives
- Every link is a relative repo path (no external URLs unless quoting)
- Open every section with one sentence stating its purpose

The fusion turn must respect this format end-to-end.

---

## Self-verification of this template

- [x] Section 0 reserves verbatim space for owner prompts
- [x] Section 1 forces Claude to restate each directive
- [x] Section 2 forces inventory citation per directive
- [x] Section 3 frames recommendations as "owner asked X, Claude recommends X+Y because Z"
- [x] Section 4 forces critical-gap surfacing
- [x] Section 5 forces sequencing decision
- [x] Section 6 carries forward anti-patterns
- [x] Section 7 names verification gates
- [x] Section 8 names hand-off
- [x] Operational rules enumerated
- [x] Output format constraints stated ("formatted for owner notes")
