// ---------------------------------------------------------------------------
// Shared helpers for @henryco/eslint-i18n-rules.
//
// File-level and AST-walking allow-list. Both rules consult the same
// predicate so the allow-list never drifts.
// ---------------------------------------------------------------------------

/**
 * File-name allow-list. Patterns are matched against the lower-cased
 * absolute filename (forward-slash normalised) via String#includes /
 * regular expression.
 */
const FILE_ALLOWLIST = [
  // Pattern A copy modules and supporting fixtures.
  /-copy\.ts$/i,
  /surface-extra-labels[^/]*\.ts$/i,
  // Mock / seed data.
  /-seed\.ts$/i,
  /-data\.ts$/i,
  /-data\.tsx$/i,
  /-fixtures?\.tsx?$/i,
  // Verifier scripts and tooling.
  /verify-[^/]*\.tsx?$/i,
  /[/\\]scripts[/\\]/i,
  // Tests.
  /\.test\.tsx?$/i,
  /\.spec\.tsx?$/i,
  // Type definition files.
  /\.d\.ts$/i,
  // Co-located stories.
  /\.stories\.tsx?$/i,
];

/** Translator and copy-accessor function names recognised as i18n-safe. */
const TRANSLATOR_NAMES = new Set([
  "t",
  "translateSurfaceLabel",
  "autoTranslate",
  "autoTranslateMany",
  "useHenryCoSurfaceCopy",
]);

const COPY_GETTER_PATTERN = /^get[A-Z][A-Za-z0-9]*Copy$/;

export function isAllowlistedFile(filename) {
  if (!filename || typeof filename !== "string") return true;
  const norm = filename.replace(/\\/g, "/").toLowerCase();
  return FILE_ALLOWLIST.some((re) => re.test(norm));
}

/**
 * Walks up the AST from the literal node to see whether it appears
 * inside a translator invocation, a copy-accessor member chain, or a
 * direct property access on a copy bag.
 */
export function isInsideTranslator(node) {
  let cur = node && node.parent;
  // Allow 3 levels of TemplateLiteral / TSAsExpression / etc.
  for (let i = 0; cur && i < 12; i += 1, cur = cur.parent) {
    if (cur.type === "CallExpression") {
      const callee = cur.callee;
      if (!callee) {
        cur = cur.parent;
        continue;
      }
      // t("..."), translateSurfaceLabel("..."), autoTranslate("...")
      if (callee.type === "Identifier" && TRANSLATOR_NAMES.has(callee.name)) return true;
      // useHenryCoSurfaceCopy(...) — the literal might be a hook arg.
      if (callee.type === "Identifier" && callee.name === "useHenryCoSurfaceCopy") return true;
      // getXxxCopy(locale) — the literal might be a sibling argument; the call
      // itself is not an issue, but a literal *inside* such a call is allowed.
      if (callee.type === "Identifier" && COPY_GETTER_PATTERN.test(callee.name)) return true;
      // obj.t("...") or i18n.translate("...").
      if (callee.type === "MemberExpression") {
        const prop = callee.property;
        if (prop && prop.type === "Identifier") {
          if (TRANSLATOR_NAMES.has(prop.name)) return true;
          if (prop.name === "translate" || prop.name === "format") return true;
        }
      }
    }
    if (cur.type === "MemberExpression") {
      // copy.foo / surfaceCopy.something / getJobsCopy(loc).filters.remote
      const obj = cur.object;
      if (obj && obj.type === "Identifier") {
        const n = obj.name;
        if (n === "copy" || n === "surfaceCopy" || n === "authCopy" || n === "careCopy" || n === "jobsCopy" || n === "marketplaceCopy") {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Returns true when the JSX attribute name (lower-cased) is one of the
 * user-facing props we lint.
 */
const PROP_NAMES = new Set([
  "placeholder",
  "title",
  "aria-label",
  "aria-description",
  "alt",
  "label",
  "description",
  "helpertext",
]);

export function isMonitoredJsxProp(name) {
  if (!name) return false;
  return PROP_NAMES.has(String(name).toLowerCase());
}

/**
 * Heuristic: is this string likely user-visible English copy?
 *
 *   - longer than 1 character
 *   - contains at least one ASCII letter
 *   - is not all-uppercase (typically a constant, key, or acronym)
 *   - does not look like a CSS class list, URL, ICU placeholder, or
 *     pure identifier (all of which often appear as string literals).
 */
export function looksLikeUserCopy(raw) {
  if (typeof raw !== "string") return false;
  const value = raw.trim();
  if (value.length < 2) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  // class names / utility soup
  if (/[a-z]+-[a-z0-9]+(\s|$)/.test(value) && /\s/.test(value)) {
    // looks like a className value (e.g. "px-2 py-1 text-sm").
    if (!/[A-Z]/.test(value)) return false;
  }
  // URLs and routes
  if (/^https?:\/\//.test(value)) return false;
  if (/^\//.test(value) && /[a-z-_/]/.test(value) && !/\s/.test(value)) return false;
  // Identifiers / constants (no spaces, snake/camel/kebab)
  if (!/\s/.test(value) && /^[A-Za-z][A-Za-z0-9_-]*$/.test(value) && value === value.toLowerCase()) {
    return false;
  }
  // SCREAMING_SNAKE
  if (/^[A-Z0-9_]+$/.test(value)) return false;
  // CSS variables and helpers
  if (value.startsWith("var(--")) return false;
  return true;
}
