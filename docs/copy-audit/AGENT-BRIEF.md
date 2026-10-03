# COPY-RESET — domain cut brief (shared by every domain agent)

Owner, 2026-10-03, verbatim: "It should remove all the explanations — it makes it extremely text heavy
and also vulnerable because it even explains code patterns, how it works, which makes it easy to guess
how the backend works for easy penetration. Correct this writing bug Codex made. Over-explaining doesn't help."

You are cutting the public website copy of ONE domain. Work like a senior editor with a security eye.

## Workspace (shared — read carefully)

- Repo worktree: `C:\Users\HP VICTUS\HenryCo\.claude\worktrees\copy-reset-prep` (use it as cwd).
- Other editors are cutting OTHER domains in this same worktree right now. Edit ONLY the paths in your
  allowlist. Never run state-changing git (no stash, checkout, reset, commit, add). Read-only git is fine
  (`git diff`, `git show`, `git log`).
- Never run `next build`, `next dev`, `next start` or any server — the conductor measures.
- Never touch: `packages/search-ui` (owner-reserved), `packages/ui`, `packages/config`, shared i18n modules
  not in your allowlist (surface-copy, auth-copy, state-copy, services-copy, …), emails/notifications,
  signed-in dashboards, staff/owner tools.

## Read first

1. `docs/copy-audit/CUT-DOCTRINE.md` — the rules. Follow it exactly.
2. `docs/copy-audit/README.md` — budgets per route type.
3. The reference cut already done for care: `git diff -- apps/care` (pattern: delete explanation blocks,
   keep h1/CTAs/data/forms, headings become plain labels, no mechanism wording).
4. Your domain's measured copy: `node scripts/copy-audit/transcript.mjs docs/copy-audit/before/<domain>.json`
   Each line: words, `^` = in the first viewport, element, text. Header lines show the route's budget.

## Method

- For every route over budget, cut until it is clearly under budget (aim ~15% under, so later edits
  have room). For every route under budget, still remove mechanism descriptions and filler.
- Data-dependent routes (`no sample`) cannot render now (database paused). Review their page + component
  copy statically and apply the same doctrine — product/listing/course/job templates are decision points:
  keep price, fee, delivery, refund, protection lines accurate and visible.
- Locate each block's source with grep (exact text) in your allowlist.
- Every page must end with exactly ONE visible `h1` and a meta description of at most 160 characters.
  A page with no h1: promote its main heading element to `h1` (element change only, keep classes).
  A page with two: demote the second to `h2`/`p` with the same classes.
- Copy system:
  - Typed modules (`packages/i18n/src/*-copy.ts`, app `*public-copy.ts`): EN object is the source.
    Shorten EN values in place. To delete a key entirely, delete it from the type and the EN object, then
    run the strip tool (below) — it removes stale overrides from every locale object.
  - English-as-key labels (`t("…")`, `translateSurfaceLabel(locale, "…")`): edit the English literal in
    place; do not edit label dictionaries.
  - Never add a new hardcoded user-facing literal; route new text through the file's existing i18n helper.
- Keep anchors that navigation targets: before removing an element with an `id`, grep for `#<id>`.
- No behaviour, route, data, styling or layout changes beyond removing the markup that held cut copy.
  Remove imports/variables that become unused so lint stays clean.

## Before you finish (all must pass)

```
node scripts/copy-audit/i18n-strip.mjs --write --only <your comma-separated path prefixes>
pnpm --filter <your package> typecheck
pnpm --filter <your package> lint        # no NEW errors/warnings in files you touched
pnpm tone:check
```

## Report (your final message)

1. Per route: what you cut (quote the removed text briefly), what you rewrote (old → new), what you kept
   on purpose and why (legal line, claim at a decision point, accessible name, navigation).
2. Claims you kept at decision points (fees, VAT, delivery, refunds, protection): quote + the code/config
   file:line that makes each true. Any claim you could not trace: say so and what you did (removed, or kept
   and flagged).
3. Mechanism disclosures you removed (quote) — the security cuts.
4. Copy that production may override from the database/CMS (fallback text in code) — list it.
5. Files changed. Commands run with results.
