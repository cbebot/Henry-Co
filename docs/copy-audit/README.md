# COPY-RESET — public copy audit

The owner's brief arrived truncated (it starts at "Truth at decision points").
Everything below the cut was followed as written; the missing top was
reconstructed and is marked **(assumption)**.

## Scope

- **Domains (assumption):** hub, account (auth pages), care, marketplace,
  property, logistics, studio, jobs, learn — every visitor-facing route,
  139 in total, listed in `scripts/copy-audit/config.mjs`.
- Out of scope: signed-in dashboards, staff/owner tools, email and
  notification templates, `packages/search-ui` (owner-reserved).

## Budgets (assumption — the original numbers were in the lost part)

Visible page words a visitor sees, the larger of desktop and mobile:

| type | words | | type | words |
|---|---:|---|---|---:|
| home / landing | 250 | | help | 250 |
| info | 280 | | transactional | 150 |
| pricing | 300 | | auth | 80 |
| index | 180 | | utility | 100 |
| detail | 220 | | legal | measured only |

Derived from the brief's rule: understood in five seconds, scanned in twenty.
A skim of 20 s covers roughly 200–250 words of well-structured copy; the h1
plus the first viewport carry the five seconds (warning above 60 words).
Header + footer chrome: 160 words per domain. Every page: exactly one visible
h1 and a meta description of at most 160 characters.

## Files

| file | what |
|---|---|
| `before/<domain>.json` | visible words, blocks, h1s, meta per route — before |
| `after/<domain>.json` | the same after the cut |
| `summary-before.md`, `summary.md` | per-route tables (before; before → after) |
| `aria/<stage>/<domain>/*.yaml` | accessibility-tree snapshots (names) per route |
| `CUT-DOCTRINE.md` | what was cut and what is protected |
| `legal-lines.md`, `claims-ledger.md` | protected lines; claims traced to code |
| `translation-manifest.json` | locale keys stripped for re-translation |
| `out-of-scope.md` | heavy email/notification templates, search-ui copy |

Screenshots (not committed): `.codex-temp/copy-reset/screens/<stage>/` in the
main checkout.

## Run it

```bash
node scripts/copy-audit/serve-measure.mjs --stage after --build [--domains care]
node scripts/copy-audit/gate.mjs --stage after
node scripts/copy-audit/summary.mjs --stage before --compare after
node scripts/copy-audit/i18n-strip.mjs --write      # after editing English copy
```

CI: `.github/workflows/copy-budget.yml` builds, serves, measures and gates each
domain on every PR that touches copy.

Measurements use the CI placeholder database, so pages render their own copy
without listings or user content. Data-driven detail pages (product, store,
listing, course, job) render no sample until the database is reachable; their
templates are reviewed statically and reported as `no-sample`.
