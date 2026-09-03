# Onyx Type — Foundation & Guards Implementation Plan (Phase 0 + Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the owned type-system foundation — the family/role/scale/premium tokens, self-hosted interim + companion fonts, the flip flag, and both CI guards (`font:check`, `font:coverage`) — plus fix the studio undefined-token bug, all behind a flag with zero production visual change, piloted on `hub`.

**Architecture:** Extend the existing `packages/ui` CSS seam with the three family tokens, role/scale/premium tokens, and a `[data-onyx-type="live"]` repoint; load self-hosted interim faces via `next/font/local` from a shared `@henryco/ui/fonts` config; compose non-Latin companions via `@font-face` `unicode-range`. Two Node CLI guards (report/warn now, harden at reveal) enforce "no system/Google fonts outside the token layer" and "no codepoint falls back". Everything is gated by `NEXT_PUBLIC_ONYX_TYPE_LIVE`; `hub` is the pilot, with an unlinked `/_type-sample` route forcing the faces live for proof.

**Tech Stack:** Node 24, pnpm 9.15.5, Next.js 16.1.6 (`next/font/local`), React 19.2, TypeScript 5.9, `tsx` test runner (`node:test`), `fontkit` (glyph coverage), self-hosted woff2.

## Global Constraints

- **Runtime:** Node `24.x`, pnpm `9.15.5`, Next `16.1.6`, React `19.2`, tsx `^4.20.6`. (verbatim from root `package.json`.)
- **Tests:** `import { test } from "node:test"` + `import assert from "node:assert/strict"`, run with `pnpm exec tsx --test <file>`. No new test framework.
- **Worktree:** all work in `C:\Users\HP VICTUS\HenryCo-onyx-type` on branch `onyx/owned-type-system` (off `origin/main`). Commit there.
- **Zero system fonts in the token stacks.** No `next/font/google`, no Google Fonts `@import`. Self-hosted woff2 only.
- **Stable family names** the bespoke files drop into on reveal: `"HenryOnyxSerif"`, `"HenryOnyxSans"`, `"HenryOnyxMono"`; companions `"HenryOnyxSerifArabic"`, `"HenryOnyxSansArabic"`, `"HenryOnyxSerifCJK"`, `"HenryOnyxSansCJK"`, `"HenryOnyxMonoCJK"`.
- **Flip flag:** `NEXT_PUBLIC_ONYX_TYPE_LIVE` (`"1"` = live). Interim faces render only where `[data-onyx-type="live"]` is set. Prod default (flag unset) is visually unchanged.
- **Guards land warn-mode** (report, exit 0). They harden to error-mode (`--strict`) in Phase 5 at reveal — the repo still uses Google fonts until then, so strict-now would fail its own repo.
- **Do not touch** money surfaces or `packages/search-ui`. Run `pnpm run i18n:check:strict` + `pnpm run tone:check` after touching any app.
- **Reference by symbol, never line number** — line numbers differ per branch.

---

### Task 1: Family-token integrity — define `--hc-font-serif`/`--hc-font-sans`, fix studio, guard recurrence

**Files:**
- Modify: `packages/ui/src/styles/globals.css` (add two tokens in the "Shared font seam" `:root` block, right after `--hc-font-reading`)
- Modify: `apps/studio/app/globals.css` (correct the false "resolves to Source Serif 4" comment)
- Create: `scripts/font/token-integrity.mjs`
- Test: `scripts/font/__tests__/token-integrity.test.ts`

**Interfaces:**
- Produces CSS custom properties `--hc-font-serif`, `--hc-font-sans` in the seam, aliased to `--hc-font-display` / `--hc-font-body` (so studio resolves immediately, ungated; the bespoke repoint is layered in Task 5).
- Produces `analyzeFontTokens({ seamCss, appFiles }) → { defined: Set<string>, undefinedRefs: Array<{ file, token }> }`, plus `collectDefined(css) → Set<string>` and `collectRefs(css) → string[]`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/font/__tests__/token-integrity.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFontTokens, collectDefined, collectRefs } from "../token-integrity.mjs";

test("an undefined --hc-font reference is flagged", () => {
  const seamCss = ":root { --hc-font-display: serif; --hc-font-body: sans-serif; }";
  const appFiles = [{ file: "studio.css", css: ":root { --x: var(--hc-font-serif); }" }];
  const { undefinedRefs } = analyzeFontTokens({ seamCss, appFiles });
  assert.equal(undefinedRefs.length, 1);
  assert.equal(undefinedRefs[0].token, "--hc-font-serif");
});

test("a defined --hc-font reference passes", () => {
  const seamCss = ":root { --hc-font-serif: var(--hc-font-display); --hc-font-display: serif; }";
  const appFiles = [{ file: "studio.css", css: "a { font-family: var(--hc-font-serif); }" }];
  assert.equal(analyzeFontTokens({ seamCss, appFiles }).undefinedRefs.length, 0);
});

test("collectDefined/collectRefs are pure across calls", () => {
  assert.deepEqual([...collectDefined("--hc-font-x: a; --hc-font-y: b;")], ["--hc-font-x", "--hc-font-y"]);
  assert.deepEqual(collectRefs("var(--hc-font-x) var(--hc-font-x)"), ["--hc-font-x", "--hc-font-x"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test scripts/font/__tests__/token-integrity.test.ts`
Expected: FAIL — `Cannot find module '../token-integrity.mjs'`.

- [ ] **Step 3: Write the implementation**

```js
// scripts/font/token-integrity.mjs
import { readFileSync, globSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function collectDefined(css) {
  const defined = new Set();
  const re = /(--hc-font-[a-z0-9-]+)\s*:/g;
  let m;
  while ((m = re.exec(css))) defined.add(m[1]);
  return defined;
}

export function collectRefs(css) {
  const refs = [];
  const re = /var\(\s*(--hc-font-[a-z0-9-]+)/g;
  let m;
  while ((m = re.exec(css))) refs.push(m[1]);
  return refs;
}

export function analyzeFontTokens({ seamCss, appFiles }) {
  const defined = collectDefined(seamCss);
  const undefinedRefs = [];
  for (const { file, css } of appFiles) {
    for (const token of collectRefs(css)) {
      if (!defined.has(token)) undefinedRefs.push({ file, token });
    }
  }
  return { defined, undefinedRefs };
}

function main() {
  const seamCss = readFileSync("packages/ui/src/styles/globals.css", "utf8");
  const appFiles = globSync("apps/*/app/**/*.css").map((file) => ({
    file,
    css: readFileSync(file, "utf8"),
  }));
  const { undefinedRefs } = analyzeFontTokens({ seamCss, appFiles });
  if (undefinedRefs.length) {
    for (const r of undefinedRefs) {
      console.error(`✗ undefined --hc-font token ${r.token} referenced in ${r.file}`);
    }
    process.exit(1);
  }
  console.log("token-integrity: OK — every --hc-font-* reference is defined in the seam");
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test scripts/font/__tests__/token-integrity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the CLI to confirm it CATCHES the current studio bug**

Run: `node scripts/font/token-integrity.mjs`
Expected: FAIL, printing `✗ undefined --hc-font token --hc-font-serif referenced in apps/studio/app/globals.css` (and `--hc-font-sans`).

- [ ] **Step 6: Add the two family tokens to the seam**

In `packages/ui/src/styles/globals.css`, immediately after the `--hc-font-reading:` line in the "Shared font seam" `:root` block, add:

```css
  /* Family tokens — the three faces the OWNED type system repoints on reveal
     (see [data-onyx-type="live"] below). Until then they alias the existing
     seam so every surface — including studio — resolves to a premium stack,
     never nothing. Once the brand faces load, the fallback chain carries NO
     system font; the font:coverage gate proves that. */
  --hc-font-serif: var(--hc-font-display);
  --hc-font-sans: var(--hc-font-body);
```

- [ ] **Step 7: Correct the false studio comment**

In `apps/studio/app/globals.css`, replace the comment block above `--font-studio-sans`/`--font-studio-display` (the one claiming the display variable "now resolves to Source Serif 4") with:

```css
  /* Studio maps its display/sans onto the shared owned seam
   * (--hc-font-serif / --hc-font-sans, defined in @henryco/ui globals).
   * Before the owned type reveal these alias the display serif / body sans;
   * after reveal they resolve to the bespoke superfamily. */
```

- [ ] **Step 8: Re-run the CLI — now clean**

Run: `node scripts/font/token-integrity.mjs`
Expected: PASS — `token-integrity: OK — every --hc-font-* reference is defined in the seam`.

- [ ] **Step 9: Commit**

```bash
git add scripts/font/token-integrity.mjs scripts/font/__tests__/token-integrity.test.ts packages/ui/src/styles/globals.css apps/studio/app/globals.css
git commit -m "fix(type): define --hc-font-serif/--hc-font-sans, close studio undefined-token bug + integrity guard"
```

---

### Task 2: `font:check` guard — no system/Google fonts outside the token layer (warn-mode)

**Files:**
- Create: `scripts/font/font-check.mjs`
- Test: `scripts/font/__tests__/font-check.test.ts`
- Modify: `package.json` (root — add `font:check` script)
- Modify: `.github/workflows/ci.yml` (add a step after the tone gate)

**Interfaces:**
- Produces `scanSource(text, filename) → Array<{ rule, match, filename }>` detecting: `next/font/google` imports, Google-Fonts `@import`, system-font family stacks, and Tailwind `font-sans`/`font-serif` utilities. `filename` is used only to skip allowlisted paths at the CLI layer.
- Produces `isAllowlisted(path) → boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/font/__tests__/font-check.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanSource, isAllowlisted } from "../font-check.mjs";

test("flags next/font/google", () => {
  const v = scanSource('import { Inter } from "next/font/google";', "apps/x/app/layout.tsx");
  assert.ok(v.some((x) => x.rule === "next-font-google"));
});

test("flags a Google Fonts @import", () => {
  const v = scanSource('@import url("https://fonts.googleapis.com/css2?family=Roboto");', "apps/x/app/globals.css");
  assert.ok(v.some((x) => x.rule === "google-import"));
});

test("flags a system-font stack", () => {
  const v = scanSource("body { font-family: Arial, Helvetica, sans-serif; }", "apps/x/app/globals.css");
  assert.ok(v.some((x) => x.rule === "system-stack"));
});

test("clean owned CSS produces no violations", () => {
  assert.equal(scanSource("a { font-family: var(--hc-font-sans); }", "apps/x/app/globals.css").length, 0);
});

test("the seam and font packages are allowlisted", () => {
  assert.equal(isAllowlisted("packages/ui/src/styles/globals.css"), true);
  assert.equal(isAllowlisted("packages/rn-type/index.ts"), true);
  assert.equal(isAllowlisted("packages/email/layout.ts"), true);
  assert.equal(isAllowlisted("apps/hub/app/layout.tsx"), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test scripts/font/__tests__/font-check.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```js
// scripts/font/font-check.mjs
import { readFileSync, globSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Paths that may legitimately name fonts / load webfonts (the owned type layer +
// the off-cascade surfaces that embed buffers themselves).
const ALLOWLIST = [
  "packages/ui/fonts/",
  "packages/ui/src/fonts/",
  "packages/ui/src/styles/globals.css",
  "packages/ui/src/styles/fonts.css",
  "packages/rn-type/",
  "packages/branded-documents/",
  "packages/email/",
  "packages/seo/src/og/",
];

export function isAllowlisted(path) {
  const p = path.replace(/\\/g, "/");
  return ALLOWLIST.some((a) => p.includes(a));
}

const SYSTEM_FONTS = [
  "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI",
  "Roboto", "Helvetica Neue", "Helvetica", "Arial", "Times New Roman",
  "Georgia", "Cantarell", "Noto Sans\"", "Liberation",
];

const RULES = [
  { rule: "next-font-google", re: /from\s+["']next\/font\/google["']/g },
  { rule: "google-import", re: /@import[^;]*fonts\.(googleapis|gstatic)\.com/g },
  {
    rule: "system-stack",
    re: new RegExp(
      `font-family\\s*:[^;}]*(${SYSTEM_FONTS.map((f) => f.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})`,
      "gi",
    ),
  },
  { rule: "tailwind-font-util", re: /className=["'][^"']*\bfont-(sans|serif)\b/g },
];

export function scanSource(text, filename) {
  const out = [];
  for (const { rule, re } of RULES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) out.push({ rule, match: m[0].slice(0, 80), filename });
  }
  return out;
}

function main() {
  const strict = process.argv.includes("--strict");
  const files = globSync("{apps,packages}/**/*.{css,ts,tsx}", {
    exclude: (p) => p.includes("node_modules") || p.includes("/.next/"),
  });
  const violations = [];
  for (const file of files) {
    if (isAllowlisted(file)) continue;
    violations.push(...scanSource(readFileSync(file, "utf8"), file));
  }
  if (violations.length) {
    for (const v of violations) console.log(`${strict ? "✗" : "⚠"} [${v.rule}] ${v.filename}: ${v.match}`);
    console.log(`\nfont:check — ${violations.length} finding(s) (${strict ? "error-mode" : "warn-mode"})`);
    if (strict) process.exit(1);
  } else {
    console.log("font:check: OK — no system/Google fonts outside the owned type layer");
  }
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec tsx --test scripts/font/__tests__/font-check.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the npm script**

In root `package.json` `scripts`, after the `tone:check` line, add:

```json
    "font:check": "node scripts/font/font-check.mjs",
```

- [ ] **Step 6: Run it (warn-mode) against the repo**

Run: `pnpm run font:check`
Expected: exit 0; prints `⚠` findings for the 5 apps still on `next/font/google` (marketplace/jobs/studio/logistics/hub) — this is the expected grandfathered state until reveal.

- [ ] **Step 7: Wire the CI step (warn-mode)**

In `.github/workflows/ci.yml`, in the `lint-typecheck-test-build` job, immediately after the "Company-voice tone gate" step, add:

```yaml
      - name: Owned-type font guard (warn-mode until reveal)
        run: pnpm run font:check
```

- [ ] **Step 8: Commit**

```bash
git add scripts/font/font-check.mjs scripts/font/__tests__/font-check.test.ts package.json .github/workflows/ci.yml
git commit -m "feat(type): font:check guard (warn-mode) — no system/Google fonts outside the owned layer"
```

---

### Task 3: Vendor self-hosted interim + companion fonts into `packages/ui/fonts`

**Files:**
- Modify: root `package.json` (add `@fontsource*` dev deps + a `font:vendor` script)
- Create: `scripts/font/vendor-fonts.mjs` (resolve-and-copy — robust to `@fontsource` filenames)
- Create (generated): `packages/ui/fonts/*.woff2` (committed binaries)
- Create: `packages/ui/src/styles/fonts.css` (`@font-face` for companions via `unicode-range`)
- Modify: `packages/ui/src/styles/globals.css` (import `fonts.css` at the top of the file)

**Interfaces:**
- Produces the interim woff2 at stable paths: `packages/ui/fonts/henryonyx-{serif,sans,mono}-interim.woff2` and companions `henryonyx-{arabic,cjk}-interim.woff2`.
- Produces `@font-face` families `"HenryOnyxSerifArabic"`, `"HenryOnyxSansArabic"`, `"HenryOnyxSerifCJK"`, `"HenryOnyxSansCJK"` scoped by `unicode-range` (consumed by Task 5's token stacks).

- [ ] **Step 1: Add font source packages (interim Latin + companions)**

```bash
pnpm add -w -D @fontsource-variable/fraunces @fontsource-variable/manrope @fontsource-variable/jetbrains-mono @fontsource/noto-sans-arabic @fontsource/noto-sans-sc
```

Expected: 5 packages added under root `devDependencies`.

- [ ] **Step 2: Write the vendor script**

```js
// scripts/font/vendor-fonts.mjs
import { mkdirSync, copyFileSync, globSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const OUT = "packages/ui/fonts";

// [npm package, glob within its dir to pick ONE representative woff2, stable output name]
const MAP = [
  ["@fontsource-variable/fraunces", "**/fraunces-latin-*normal.woff2", "henryonyx-serif-interim.woff2"],
  ["@fontsource-variable/manrope", "**/manrope-latin-*normal.woff2", "henryonyx-sans-interim.woff2"],
  ["@fontsource-variable/jetbrains-mono", "**/jetbrains-mono-latin-*normal.woff2", "henryonyx-mono-interim.woff2"],
  ["@fontsource/noto-sans-arabic", "**/noto-sans-arabic-arabic-400-normal.woff2", "henryonyx-arabic-interim.woff2"],
  ["@fontsource/noto-sans-sc", "**/noto-sans-sc-chinese-simplified-400-normal.woff2", "henryonyx-cjk-interim.woff2"],
];

mkdirSync(OUT, { recursive: true });
for (const [pkg, pattern, outName] of MAP) {
  const pkgDir = require.resolve(`${pkg}/package.json`).replace(/package\.json$/, "");
  const [src] = globSync(pattern.replace("**/", ""), { cwd: pkgDir }).map((f) => `${pkgDir}${f}`);
  const found = src ?? globSync(`**/*.woff2`, { cwd: pkgDir }).map((f) => `${pkgDir}${f}`).find((f) => f.includes(pattern.split("-")[1] ?? "latin"));
  if (!found) throw new Error(`No woff2 found for ${pkg} (pattern ${pattern})`);
  copyFileSync(found, `${OUT}/${outName}`);
  console.log(`vendored ${pkg} -> ${OUT}/${outName}`);
}
```

- [ ] **Step 3: Add the vendor script + run it**

In root `package.json` `scripts` add `"font:vendor": "node scripts/font/vendor-fonts.mjs",`, then:

Run: `pnpm run font:vendor`
Expected: 5 lines `vendored … -> packages/ui/fonts/henryonyx-*-interim.woff2`, and 5 committed woff2 files exist.
(If a glob misses because `@fontsource` changed a filename, adjust the pattern to the actual file printed by `ls node_modules/<pkg>/files`.)

- [ ] **Step 4: Write the companion `@font-face` (unicode-range)**

```css
/* packages/ui/src/styles/fonts.css
   Owned NON-LATIN companions. Latin faces load via next/font (see
   @henryco/ui/fonts). These companions render Arabic + CJK from OWNED,
   self-hosted files behind the same --hc-font-* tokens, so no glyph ever
   reaches a system font. Interim files are Noto-class placeholders; the
   bespoke/owned cuts drop into the same paths on reveal. */
@font-face {
  font-family: "HenryOnyxSansArabic";
  src: url("../../fonts/henryonyx-arabic-interim.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
}
@font-face {
  font-family: "HenryOnyxSerifArabic";
  src: url("../../fonts/henryonyx-arabic-interim.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF;
}
@font-face {
  font-family: "HenryOnyxSansCJK";
  src: url("../../fonts/henryonyx-cjk-interim.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+4E00-9FFF, U+3400-4DBF, U+3000-303F, U+FF00-FFEF;
}
@font-face {
  font-family: "HenryOnyxSerifCJK";
  src: url("../../fonts/henryonyx-cjk-interim.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
  unicode-range: U+4E00-9FFF, U+3400-4DBF, U+3000-303F, U+FF00-FFEF;
}
```

- [ ] **Step 5: Import `fonts.css` from the seam**

At the very top of `packages/ui/src/styles/globals.css` (before the first `:root`, after any existing leading comment), add:

```css
@import "./fonts.css";
```

- [ ] **Step 6: Confirm the guard still allows these**

Run: `pnpm run font:check`
Expected: still exit 0; NO new findings for `packages/ui/src/styles/fonts.css` or `packages/ui/fonts/*` (both allowlisted).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/font/vendor-fonts.mjs packages/ui/fonts packages/ui/src/styles/fonts.css packages/ui/src/styles/globals.css
git commit -m "feat(type): vendor self-hosted interim + companion fonts, compose companions via unicode-range"
```

---

### Task 4: `font:coverage` gate — prove no codepoint falls back (Tier-2 block coverage, warn-mode)

**Files:**
- Modify: root `package.json` (add `fontkit` dev dep + `font:coverage` script)
- Create: `scripts/font/coverage-config.mjs` (required Unicode blocks per face; copy-globs placeholder for Tier-1)
- Create: `scripts/font/font-coverage.mjs`
- Test: `scripts/font/__tests__/font-coverage.test.ts`

**Interfaces:**
- Produces `blockCodePoints({ start, end }) → number[]`, `missingCodePoints(font, codePoints) → number[]` (uses `fontkit` `font.hasGlyphForCodePoint`), and `coverageReport({ faces }) → Array<{ face, block, missing: number }>`.
- `coverage-config.mjs` exports `FACES` (each `{ file, label, blocks: [{name,start,end}] }`) and `COPY_GLOBS` (empty array now → Tier-1 deferred to Phase 5).

- [ ] **Step 1: Add fontkit**

```bash
pnpm add -w -D fontkit
```

- [ ] **Step 2: Write the failing test**

```ts
// scripts/font/__tests__/font-coverage.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import fontkit from "fontkit";
import { blockCodePoints, missingCodePoints } from "../font-coverage.mjs";

test("blockCodePoints enumerates an inclusive range", () => {
  assert.deepEqual(blockCodePoints({ start: 0x41, end: 0x43 }), [0x41, 0x42, 0x43]);
});

test("the interim Latin serif covers Basic Latin and lacks Arabic", () => {
  const serif = fontkit.openSync("packages/ui/fonts/henryonyx-serif-interim.woff2");
  assert.equal(missingCodePoints(serif, blockCodePoints({ start: 0x41, end: 0x5a })).length, 0); // A-Z
  assert.ok(missingCodePoints(serif, blockCodePoints({ start: 0x0600, end: 0x0610 })).length > 0); // Arabic
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec tsx --test scripts/font/__tests__/font-coverage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the config**

```js
// scripts/font/coverage-config.mjs
// Latin faces must cover Latin (incl. the African-Latin extensions used by
// yo/ig/ha). Companions must cover their script blocks. Tier-1 (exact copy
// codepoints) is wired in Phase 5 when the copy corpus is enumerated.
const LATIN = [
  { name: "Basic Latin", start: 0x0020, end: 0x007e },
  { name: "Latin-1 Supplement", start: 0x00a0, end: 0x00ff },
  { name: "Latin Extended-A", start: 0x0100, end: 0x017f },
  { name: "Latin Extended-B", start: 0x0180, end: 0x024f },
  { name: "Latin Extended Additional", start: 0x1e00, end: 0x1eff }, // ẹ ọ ṣ ṅ …
];
const ARABIC = [{ name: "Arabic", start: 0x0600, end: 0x06ff }];
const CJK = [{ name: "CJK Unified (sample)", start: 0x4e00, end: 0x4eff }];

export const FACES = [
  { file: "packages/ui/fonts/henryonyx-serif-interim.woff2", label: "serif", blocks: LATIN },
  { file: "packages/ui/fonts/henryonyx-sans-interim.woff2", label: "sans", blocks: LATIN },
  { file: "packages/ui/fonts/henryonyx-mono-interim.woff2", label: "mono", blocks: [LATIN[0], LATIN[1]] },
  { file: "packages/ui/fonts/henryonyx-arabic-interim.woff2", label: "arabic-companion", blocks: ARABIC },
  { file: "packages/ui/fonts/henryonyx-cjk-interim.woff2", label: "cjk-companion", blocks: CJK },
];

export const COPY_GLOBS = []; // Tier-1: populated in Phase 5
```

- [ ] **Step 5: Write the implementation**

```js
// scripts/font/font-coverage.mjs
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import fontkit from "fontkit";
import { FACES } from "./coverage-config.mjs";

export function blockCodePoints({ start, end }) {
  const out = [];
  for (let cp = start; cp <= end; cp++) out.push(cp);
  return out;
}

export function missingCodePoints(font, codePoints) {
  return codePoints.filter((cp) => !font.hasGlyphForCodePoint(cp));
}

export function coverageReport({ faces }) {
  const report = [];
  for (const face of faces) {
    const font = fontkit.openSync(face.file);
    for (const block of face.blocks) {
      const missing = missingCodePoints(font, blockCodePoints(block)).length;
      report.push({ face: face.label, block: block.name, missing });
    }
  }
  return report;
}

function main() {
  const strict = process.argv.includes("--strict");
  const report = coverageReport({ faces: FACES });
  const gaps = report.filter((r) => r.missing > 0);
  for (const r of report) {
    const mark = r.missing === 0 ? "✓" : strict ? "✗" : "⚠";
    console.log(`${mark} ${r.face} · ${r.block} · ${r.missing} missing`);
  }
  if (gaps.length) {
    console.log(`\nfont:coverage — ${gaps.length} block(s) with gaps (${strict ? "error-mode" : "warn-mode"})`);
    if (strict) process.exit(1);
  } else {
    console.log("\nfont:coverage: OK — every required block is fully covered");
  }
}

const invokedDirectly = (() => {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (invokedDirectly) main();
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec tsx --test scripts/font/__tests__/font-coverage.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Add the script + run it (warn-mode)**

In root `package.json` add `"font:coverage": "node scripts/font/font-coverage.mjs",`, then:

Run: `pnpm run font:coverage`
Expected: exit 0; Latin blocks `✓`, companion blocks `✓` (interim Noto covers them). Any interim gap prints `⚠`, not a failure.

- [ ] **Step 8: Wire the CI step (warn-mode)**

In `.github/workflows/ci.yml`, immediately after the font:check step from Task 2, add:

```yaml
      - name: Owned-type coverage gate (warn-mode until reveal)
        run: pnpm run font:coverage
```

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/font/coverage-config.mjs scripts/font/font-coverage.mjs scripts/font/__tests__/font-coverage.test.ts .github/workflows/ci.yml
git commit -m "feat(type): font:coverage gate (fontkit block coverage, warn-mode) — the zero-fallback proof"
```

---

### Task 5: The type token system — role/scale/premium tokens, `next/font` config, flip repoint

**Files:**
- Create: `packages/ui/src/fonts/brand-type.ts` (`next/font/local` config + `brandFontVariables`)
- Create: `packages/ui/src/fonts/flag.ts` (`onyxTypeAttr()`)
- Create: `packages/ui/src/fonts/index.ts` (re-export)
- Modify: `packages/ui/package.json` (add `"./fonts"` export)
- Modify: `packages/ui/src/styles/globals.css` (role/scale/premium tokens + `[data-onyx-type="live"]` repoint + premium defaults)

**Interfaces:**
- Consumes: family tokens from Task 1; `@font-face` companions from Task 3.
- Produces: `brandSans`, `brandSerif`, `brandMono` (next/font objects), `brandFontVariables: string` (the three `.variable` class names, space-joined), `onyxTypeAttr(): "live" | undefined`. Consumed by Task 6.

- [ ] **Step 1: Write the next/font config**

```ts
// packages/ui/src/fonts/brand-type.ts
import localFont from "next/font/local";

// Interim self-hosted Latin faces. The bespoke woff2 drop into these same paths
// on reveal (Track A). Fallbacks are metric placeholders for the load window
// only; the CSS token stacks (globals.css) are owned-only.
export const brandSerif = localFont({
  src: [{ path: "../../fonts/henryonyx-serif-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-serif",
  display: "swap",
  preload: true,
  fallback: ["Georgia", "serif"],
});

export const brandSans = localFont({
  src: [{ path: "../../fonts/henryonyx-sans-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-sans",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

export const brandMono = localFont({
  src: [{ path: "../../fonts/henryonyx-mono-interim.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-brand-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const brandFontVariables = `${brandSerif.variable} ${brandSans.variable} ${brandMono.variable}`;
```

- [ ] **Step 2: Write the flag resolver**

```ts
// packages/ui/src/fonts/flag.ts
// One switch flips web + RN together (RN reads the same env in packages/rn-type).
export function onyxTypeAttr(): "live" | undefined {
  return process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE === "1" ? "live" : undefined;
}
```

- [ ] **Step 3: Barrel + export**

```ts
// packages/ui/src/fonts/index.ts
export { brandSerif, brandSans, brandMono, brandFontVariables } from "./brand-type";
export { onyxTypeAttr } from "./flag";
```

In `packages/ui/package.json` `exports`, add:

```json
    "./fonts": "./src/fonts/index.ts",
```

- [ ] **Step 4: Add role/scale/premium tokens + the flip repoint to the seam**

In `packages/ui/src/styles/globals.css`, after the family tokens from Task 1, add the scale + premium tokens:

```css
  /* Owned type — modular scale (minor third ≈1.2). reading = serif; the rest = sans. */
  --hc-text-caption: 0.8125rem; --hc-line-caption: 1.4;
  --hc-text-ui: 0.875rem;       --hc-line-ui: 1.45;
  --hc-text-body: 1rem;         --hc-line-body: 1.55;
  --hc-text-h4: 1.125rem; --hc-text-h3: 1.375rem; --hc-text-h2: 1.75rem; --hc-text-h1: 2.25rem;
  --hc-text-display: clamp(2.5rem, 5vw, 4rem);
  /* Premium craft */
  --hc-track-display: -0.02em;
  --hc-track-caps: 0.06em;
  --hc-feature-numeric: "tnum" 1, "lnum" 1;   /* tabular + lining — money/tables */
  --hc-feature-text: "liga" 1, "calt" 1;      /* real ligatures + contextual alternates */
```

Then, at the END of the seam block's file region (after `:root { … }` closes, top-level), add the flip repoint + premium utility:

```css
/* THE FLIP — one attribute repoints the family tokens from the current fonts to
   the owned superfamily. Set on <html> by the flag (prod), or on any subtree for
   staging/preview. Stacks are OWNED-ONLY (Latin next/font var → owned companions
   → generic that the coverage gate proves unreachable). */
[data-onyx-type="live"] {
  --hc-font-serif: var(--font-brand-serif), "HenryOnyxSerifArabic", "HenryOnyxSerifCJK", serif;
  --hc-font-sans: var(--font-brand-sans), "HenryOnyxSansArabic", "HenryOnyxSansCJK", sans-serif;
  --hc-font-mono: var(--font-brand-mono), "HenryOnyxMonoCJK", monospace;
}

/* Tabular, lining figures for money & data — the single biggest premium tell. */
.hc-numeric { font-feature-settings: var(--hc-feature-numeric); font-variant-numeric: tabular-nums lining-nums; }
```

- [ ] **Step 5: Verify token integrity + guards still pass**

Run: `node scripts/font/token-integrity.mjs && pnpm run font:check && pnpm run font:coverage`
Expected: token-integrity OK; font:check exit 0 (fonts.css/brand-type allowlisted); font:coverage OK.

- [ ] **Step 6: Typecheck the package consumer path**

Run: `pnpm --filter @henryco/ui exec tsc --noEmit` (or `pnpm run typecheck:all` if faster to reason about later)
Expected: no type errors from the new `src/fonts/*` files.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/fonts packages/ui/package.json packages/ui/src/styles/globals.css
git commit -m "feat(type): role/scale/premium tokens + next/font config + data-onyx-type flip repoint"
```

---

### Task 6: Pilot-wire `hub` + an unlinked `/_type-sample` proof route (both themes)

**Files:**
- Modify: `apps/hub/app/layout.tsx` (apply `brandFontVariables` + `onyxTypeAttr()` to `<html>`)
- Modify: `apps/hub/next.config.*` (ensure `@henryco/ui` is transpiled — the `next/font` spike)
- Create: `apps/hub/app/_type-sample/page.tsx` (forced-live proof surface)

**Interfaces:**
- Consumes: `brandFontVariables`, `onyxTypeAttr` from `@henryco/ui/fonts`; the tokens/utilities from Task 5.

- [ ] **Step 1: The `next/font`-from-package spike — apply brand fonts to hub `<html>`**

In `apps/hub/app/layout.tsx`, add the import and update the `<html>` element:

```tsx
import { brandFontVariables, onyxTypeAttr } from "@henryco/ui/fonts";
```

Change `<html lang={lang} dir={dir} suppressHydrationWarning>` to:

```tsx
    <html
      lang={lang}
      dir={dir}
      data-onyx-type={onyxTypeAttr()}
      className={brandFontVariables}
      suppressHydrationWarning
    >
```

- [ ] **Step 2: Ensure `@henryco/ui` is transpiled (so `next/font` in the package works)**

Open `apps/hub/next.config.ts` (or `.mjs`). If `transpilePackages` does not already include `"@henryco/ui"`, add it. If the array does not exist, add:

```ts
  transpilePackages: ["@henryco/ui"],
```

- [ ] **Step 3: Run hub dev and confirm the spike works (fonts load, no build error)**

Run: `pnpm --filter @henryco/hub dev`
Expected: dev server boots with no `next/font` error. If Next reports "next/font requires the font loader be called in the app," fall back to the documented alternative: re-export the config object from `@henryco/ui/fonts` and call `localFont(config)` inside `apps/hub/app/fonts.ts` instead, keeping `brandFontVariables` identical. Record which path worked in the plan's notes.

- [ ] **Step 4: Build the proof route**

```tsx
// apps/hub/app/_type-sample/page.tsx
// UNLINKED dev proof surface — forces the owned faces live regardless of the
// global flag, so the whole pipeline (next/font + tokens + companions + premium
// features) is provable before any app flips. Not in nav; not a prod surface.
export const dynamic = "force-static";

export default function TypeSample() {
  return (
    <div data-onyx-type="live" style={{ padding: "3rem", maxWidth: "72ch", margin: "0 auto" }}>
      <p style={{ fontFamily: "var(--hc-font-sans)", letterSpacing: "var(--hc-track-caps)", textTransform: "uppercase", fontSize: "var(--hc-text-caption)" }}>
        Henry Onyx — owned type
      </p>
      <h1 style={{ fontFamily: "var(--hc-font-serif)", fontSize: "var(--hc-text-display)", letterSpacing: "var(--hc-track-display)", lineHeight: 1.05 }}>
        The type that reads as ours
      </h1>
      <div className="hc-prose" data-onyx-type="live">
        <p>Reading prose renders the editorial serif at a calm measure — this is the long-form reading face.</p>
        <p style={{ fontFamily: "var(--hc-font-sans)" }}>Structure and UI render the brand sans: nav, labels, buttons, cards.</p>
      </div>
      <table style={{ fontFamily: "var(--hc-font-sans)" }}>
        <tbody>
          <tr><td>Invoice 1001</td><td className="hc-numeric" style={{ textAlign: "right" }}>₦1,240.00</td></tr>
          <tr><td>Invoice 1002</td><td className="hc-numeric" style={{ textAlign: "right" }}>₦19.99</td></tr>
          <tr><td>Invoice 1003</td><td className="hc-numeric" style={{ textAlign: "right" }}>₦105,000.00</td></tr>
        </tbody>
      </table>
      <p style={{ fontFamily: "var(--hc-font-serif)", fontSize: "var(--hc-text-h3)" }} lang="ar" dir="rtl">
        النص العربي يظهر بالخط المملوك — لا يعود إلى خط النظام
      </p>
      <p style={{ fontFamily: "var(--hc-font-serif)", fontSize: "var(--hc-text-h3)" }} lang="zh">
        中文文本以自有字体呈现，绝不回退到系统字体
      </p>
      <p style={{ fontFamily: "var(--hc-font-mono)" }} className="hc-numeric">
        const total = 105_000.00; // 0123456789
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Eyeball the proof in BOTH themes**

Run: `pnpm --filter @henryco/hub dev`, open `http://localhost:3000/_type-sample`.
Verify against the **Premium acceptance** checklist (spec §13):
- the three ₦ figures align in a column (tabular figures working);
- display heading is tight, not loose;
- reading paragraph is the serif; the sans line is visibly a different, sans face;
- the Arabic and Chinese lines render (companions loaded), not tofu/system;
- toggle dark mode (the app's theme switch) — all of the above holds.
Capture a screenshot of each theme into the PR description.

- [ ] **Step 6: Verify no prod surface changed + gates green**

Run: `pnpm --filter @henryco/hub run typecheck && pnpm run i18n:check:strict && pnpm run tone:check && pnpm run font:check && pnpm run font:coverage`
Expected: all pass. (The global flag is unset, so hub's real pages are visually unchanged — only `/_type-sample` forces the faces via its local `data-onyx-type`.)

- [ ] **Step 7: Commit**

```bash
git add apps/hub/app/layout.tsx apps/hub/next.config.ts apps/hub/app/_type-sample/page.tsx
git commit -m "feat(type): pilot-wire hub + unlinked /_type-sample proof (both themes, forced-live)"
```

---

## Follow-on plans (derived from the same spec, not in this plan)

- **Phase 2 — Wire the web seam** across the other 9 apps (repeat Task 6's `<html>` bridge; per-app `--font-reading` where a distinct reading serif is wanted). Gated; no prod change.
- **Phase 3 — Off-cascade:** OG buffers + Satori `inline-block` fix (`packages/seo`), email `@font-face` (`packages/email`), PDF family-name alignment (`packages/branded-documents`), `<AiProse>` for markdown/`IntelligenceLauncher`.
- **Phase 4 — React Native:** `packages/rn-type` + expo-font in `company-hub` & `super-app` + RN text tokens reading the same flag.
- **Phase 5 — Enforcement & docs:** harden `font:check`/`font:coverage` to `--strict`; wire Tier-1 copy-codepoint coverage (`COPY_GLOBS`); typography reference + text-touchpoints docs + a CLAUDE.md rule.
- **Reveal:** drop the bespoke woff2/ttf into `packages/ui/fonts` + `packages/rn-type/fonts`; run coverage against the real faces; flip `NEXT_PUBLIC_ONYX_TYPE_LIVE=1`.

## Self-Review

- **Spec coverage:** Phase 0 (studio fix T1, `font:check` T2 warn, `font:coverage` T4 warn scaffold) ✓; Phase 1 (fonts T3, tokens+config+flip T5, pilot+sample T6) ✓. Zero-fallback proof = T4 (Tier-2 now; Tier-1 deferred to Phase 5, matching spec §4.3). Premium craft = T5 tokens + T6 acceptance ✓. Off-cascade/RN/other apps = explicitly follow-on ✓.
- **Placeholder scan:** none — every code step carries real code; `COPY_GLOBS = []` is an intentional, documented Phase-5 seam, not a TODO.
- **Type/name consistency:** `brandFontVariables`, `onyxTypeAttr`, `--font-brand-{serif,sans,mono}`, `HenryOnyx*` family names, and the `packages/ui/fonts/henryonyx-*-interim.woff2` paths are identical across T3/T5/T6 ✓.
