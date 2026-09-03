# Task 2 Report: `font:check` CI guard (warn-mode)

**Status:** DONE  
**Commit:** `e645b772` feat(type): font:check guard (warn-mode) — no system/Google fonts outside the owned layer  
**Date:** 2026-07-05

---

## TDD Evidence

### Step 2 — RED (before implementation)

```
Error: Cannot find module '../font-check.mjs'
Require stack:
- scripts/font/__tests__/font-check.test.ts
```

Test runner exited with error — confirmed correct RED state.

### Step 4 — GREEN (after implementation)

```
✔ flags next/font/google (0.8928ms)
✔ flags a Google Fonts @import (0.2272ms)
✔ flags a system-font stack (0.1053ms)
✔ clean owned CSS produces no violations (0.1082ms)
✔ the seam and font packages are allowlisted (0.1345ms)
ℹ tests 5
ℹ pass 5
ℹ fail 0
ℹ duration_ms 365.6874
```

5/5 GREEN.

### Step 6 — Warn-mode output (real repo)

```
⚠ [google-import] apps\work\app\globals.css: @import url("https://fonts.googleapis.com
⚠ [system-stack] apps\logistics\components\portal\styles.css: font-family: var(--hc-font-display, var(--font-source-serif), "Source Serif 4", ...
⚠ [next-font-google] apps\studio\components\studio\studio-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\property\components\property\property-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\marketplace\components\marketplace\marketplace-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\logistics\lib\logistics-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\learn\components\learn\learn-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\jobs\components\jobs-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\care\lib\care-public-theme.ts: from "next/font/google"
⚠ [next-font-google] apps\hub\app\workspace\layout.tsx: from "next/font/google"
... (49 total findings)

font:check — 49 finding(s) (warn-mode)
Exit code: 0
```

Exit 0 confirmed. Detection works on the live repo. All 9 `next/font/google` apps (care/jobs/learn/logistics/marketplace/property/studio + hub layouts) are flagged as expected grandfathered state.

---

## Files Changed

| File | Action |
|------|--------|
| `scripts/font/font-check.mjs` | Created — scanner + CLI runner |
| `scripts/font/__tests__/font-check.test.ts` | Created — 5 TDD tests |
| `package.json` | Modified — added `font:check` script after `tone:check` |
| `.github/workflows/ci.yml` | Modified — added warn-mode CI step after tone gate |

Only these 4 files were staged and committed. `.superpowers/` scratch remains untracked.

---

## Validation Checks

- `package.json` parses as valid JSON (confirmed via `node -e JSON.parse`)
- `ci.yml` YAML indentation matches surrounding steps (6-space `- name:` / 8-space `run:`)
- `--strict` flag wired (exits 1) but NOT activated — warn-mode is the default
- Allowlist covers the owned type layer: `packages/ui/src/styles/`, `packages/rn-type/`, `packages/email/`, `packages/seo/src/og/`, `packages/branded-documents/`

---

## Concerns

None. The 49 findings are the expected grandfathered state. Phase 5 (type reveal) flips `--strict` to turn this into an error-mode gate.

---

## Fix: broaden tailwind-font-util

**Command run:** `pnpm exec tsx --test scripts/font/__tests__/font-check.test.ts`

**Test output (6/6):**

```
✔ flags next/font/google (1.4073ms)
✔ flags a Google Fonts @import (0.3415ms)
✔ flags a system-font stack (0.1795ms)
✔ clean owned CSS produces no violations (0.1795ms)
✔ flags a Tailwind font utility inside cn()/clsx()/template classNames (0.1677ms)
✔ the seam and font packages are allowlisted (0.1968ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

**No regression:** `var(--hc-font-sans)` (unquoted CSS variable) still produces 0 violations — the quoted-string anchor prevents false positives.

**`font:check` exit confirmation:**

```
font:check — 95 finding(s) (warn-mode)
exit: 0
```

Exit 0 confirmed (warn-mode). Finding count increased from 49 → 95 because the broadened regex now correctly catches `font-sans`/`font-serif` tokens inside string literals throughout CSS variable declarations and theme files — these were all silently missed before.
