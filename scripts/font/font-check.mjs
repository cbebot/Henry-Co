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
  "packages/newsletter/",
  "packages/seo/src/og/",
];

export function isAllowlisted(path) {
  const p = path.replace(/\\/g, "/");
  return ALLOWLIST.some((a) => p.includes(a));
}

const SYSTEM_FONTS = [
  "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI",
  "Roboto", "Helvetica Neue", "Helvetica", "Arial", "Times New Roman",
  "Georgia", "Cantarell", "Liberation",
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SYSTEM_RE = new RegExp(
  `font-family\\s*:[^;}]*(${SYSTEM_FONTS.map(escapeRegex).join("|")})`,
  "gi",
);

const RULES = [
  { rule: "next-font-google", re: /from\s+["']next\/font\/google["']/g },
  { rule: "google-import", re: /@import[^;]*fonts\.(googleapis|gstatic)\.com/g },
  { rule: "system-stack", re: SYSTEM_RE },
  // Matches a font-sans/font-serif class token inside ANY quoted string, so it
  // catches className="…", cn("…"), clsx(`…`), and template-literal classNames —
  // not just literal className= attributes. The quoted-string requirement keeps
  // CSS `var(--…font-sans)` (unquoted) from false-positiving.
  { rule: "tailwind-font-util", re: /["'`][^"'`]*\bfont-(sans|serif)\b/g },
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

function collectFiles() {
  const patterns = [
    "apps/**/*.css", "apps/**/*.ts", "apps/**/*.tsx",
    "packages/**/*.css", "packages/**/*.ts", "packages/**/*.tsx",
  ];
  const seen = new Set();
  for (const pattern of patterns) {
    for (const file of globSync(pattern)) {
      const p = file.replace(/\\/g, "/");
      if (p.includes("node_modules") || p.includes("/.next/") || p.includes("/dist/")) continue;
      seen.add(file);
    }
  }
  return [...seen];
}

function main() {
  const strict = process.argv.includes("--strict");
  const violations = [];
  for (const file of collectFiles()) {
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
if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    console.warn(`[warn-mode] unexpected error, not failing CI: ${err?.message ?? err}`);
    if (process.argv.includes("--strict")) process.exit(1);
  }
}
