#!/usr/bin/env node
/**
 * V3-06 (S1 + S2 + S3 + S8 + S9 + S10) — Static dead-link scan.
 *
 * Enforces the owner anti-pattern "no dead links": every internal `href` in
 * shipped pages must resolve to a real route on a real app. This script is the
 * STATIC half of the sweep (the live HTTP walk lives in `live-walk.mjs`).
 *
 * Pipeline:
 *   S2  Build a route table per app by walking `apps/<app>/app/**\/page.tsx`,
 *       stripping Next.js route groups `(group)`, and converting dynamic
 *       segments (`[param]`, `[...slug]`) to match patterns. API routes
 *       (`route.ts`) are included because some hrefs link straight to them
 *       (downloads, pdf, unsubscribe). Output: scripts/v3/route-tables/<app>.json
 *   S1  Walk `apps/` + `packages/` for every URL-producing site:
 *         href="..."  | href={"..."} | <Link href="...">
 *         redirect("...") | router.push("...") | router.replace("...")
 *         NextResponse.redirect(... "...")
 *         action_url: "..."  (notification payloads)
 *       Resolve template-literal dynamic segments to patterns where possible.
 *       Output: scripts/v3/dead-link-catalog.json
 *   S3  Classify every catalog entry:
 *         OK            — resolves to a real route in the resolved app.
 *         DEAD          — internal, static, no matching route anywhere.
 *         LEGACY        — matches a known renamed pattern (see LEGACY_PATTERNS).
 *         DYNAMIC-MAYBE — has unresolved dynamic params; needs the live walk.
 *         EXTERNAL      — off-platform absolute URL (not our concern here).
 *         ANCHOR        — pure `#fragment` or `?query` only (same-page).
 *         HELPER        — produced by a domain/link helper we can't statically
 *                         resolve to a literal path (cross-division, builder).
 *         EXEMPT        — file/path explicitly excluded.
 *       Output: scripts/v3/dead-link-report.md (+ dead-link-classified.json)
 *   S8  Anchor audit: every `#anchor` (or `/path#anchor`) target is checked to
 *       exist as `id="anchor"` on the target page where statically resolvable.
 *   S9  Button-disguised-as-link audit (ADVISORY): flag `<button>` elements that
 *       carry neither an `onClick`/`onPress` handler, a `type="submit"`, nor a
 *       `formAction` — i.e. inert buttons that LOOK clickable but do nothing.
 *       This is advisory-only here; the per-card "does it open the exact next
 *       step?" question is owned end-to-end by V3-11. We surface candidates so
 *       V3-11 has a static starting list, but never fail CI on them.
 *

 * Usage:
 *   node scripts/v3/dead-link-scan.mjs            # write fresh catalog + report
 *   node scripts/v3/dead-link-scan.mjs --check    # exit 1 on NEW dead/legacy
 *   node scripts/v3/dead-link-scan.mjs --json     # also print summary JSON
 *
 * --check (S10 CI gate) compares the current DEAD+LEGACY fingerprint set to the
 * committed baseline (scripts/v3/dead-link-baseline.json) and FAILS only when a
 * NEW dead/legacy link appears. Pre-existing, owner-acknowledged entries do not
 * fail CI — they are a backlog, not a regression bar. Regenerate the baseline
 * with `--write-baseline` after intentionally accepting new entries.
 *
 * ANTI-CLONE: the route-table catalog is internal-only. It lives under
 * scripts/v3/ (not shipped to any app bundle) and must not be published.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { resolve, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const APPS_DIR = join(REPO_ROOT, "apps");
const ROUTE_TABLE_DIR = join(__dirname, "route-tables");
const CATALOG_PATH = join(__dirname, "dead-link-catalog.json");
const CLASSIFIED_PATH = join(__dirname, "dead-link-classified.json");
const REPORT_PATH = join(__dirname, "dead-link-report.md");
const BASELINE_PATH = join(__dirname, "dead-link-baseline.json");

// ─── CLI ─────────────────────────────────────────────────────────────────────
const ARGS = new Set(process.argv.slice(2));
const CHECK_MODE = ARGS.has("--check");
const WRITE_BASELINE = ARGS.has("--write-baseline");
const PRINT_JSON = ARGS.has("--json");

// ─── The 10 web apps (Expo apps use universal links, audited per V3-04). ──────
// `account`, `hub`, `staff` host more than one logical surface but each is a
// single Next app with a single route tree, so one table per app dir is right.
const WEB_APPS = [
  "account",
  "care",
  "hub",
  "jobs",
  "learn",
  "logistics",
  "marketplace",
  "property",
  "staff",
  "studio",
];

// Expo (React-Native) apps use Expo Router screen files (`account.tsx`,
// `legal/about.tsx`, `(tabs)/index.tsx`) rather than Next.js `page.tsx`, so the
// Next route-table model does not apply to them. Their universal/app links are
// audited under V3-04 (mobile deep links). We still CATALOG their hrefs (for
// completeness) but never classify them DEAD against web route tables.
const EXPO_APPS = new Set(["super-app", "company-hub"]);

// Shared widget/UI packages have no `app/` of their own; their hrefs render
// inside a HOST Next app. The dashboard-modules + dashboard-shell + messaging
// packages are mounted in the account dashboard, so their relative deep-links
// (`/wallet`, `/subscriptions`, …) resolve against the account route table.
// `account` is the canonical dashboard host for these.
const PACKAGE_HOST_APP = "account";

// `action_url:` is a customer_notifications / customer_activity field. By
// platform convention these deep-links open in the account app (the unified
// notification surface), regardless of which app's API wrote the row.
const ACTION_URL_HOST_APP = "account";

// Map a relative top-level path segment to the app whose route table owns it
// when the href is ABSOLUTE to a division domain (e.g. care.henrycogroup.com)
// OR when a cross-app helper produced it. Relative hrefs always resolve against
// the SOURCE app first (a marketplace `/account/orders` link is marketplace's
// own route), and only fall back to the division map if the source app has no
// such route.
const SUBDOMAIN_TO_APP = {
  "": "hub", // bare henrycogroup.com → hub
  care: "care",
  jobs: "jobs",
  learn: "learn",
  logistics: "logistics",
  marketplace: "marketplace",
  property: "property",
  studio: "studio",
  account: "account",
  hq: "hub", // owner console lives in the hub app under /owner
  staff: "staff",
  workspace: "staff", // staff workspace lives in the staff app
};

// Known renamed routes. A static href that matches the OLD column is LEGACY and
// the report tells the fixer the NEW target. Sourced from PRODUCT-GAP-LEDGER
// (care booking links) + the V3-04 deep-link migration notes.
const LEGACY_PATTERNS = [
  {
    test: /^\/care\?booking=/i,
    replacement: "/care/bookings/<bookingId> (account app)",
    note: "legacy care booking query link — use getCareBookingHref()",
  },
  {
    test: /^\/care\/booking\b/i,
    replacement: "/care/bookings/<bookingId> (account app)",
    note: "legacy singular /care/booking — pluralised to /care/bookings",
  },
  {
    test: /^\/account\/subscriptions\?id=/i,
    replacement: "/subscriptions/<subscriptionId> (account app)",
    note: "legacy subscription query link — use detail route",
  },
  {
    test: /^\/account\/invoices\?id=/i,
    replacement: "/invoices/<invoiceId> (account app)",
    note: "legacy invoice query link — use detail route",
  },
];

// ─── Walk config ──────────────────────────────────────────────────────────────
const HARD_SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  "out",
  ".vercel",
  ".codex-temp",
  ".worktree",
  ".claude",
  ".git",
  "coverage",
  "__tests__",
  "__mocks__",
  "__fixtures__",
]);

// search-ui is owner-reserved (memory: feedback_dashboard_search_engine_no_touch).
const OWNER_RESERVED_PREFIXES = [["packages", "search-ui"].join(sep)];

const SCAN_EXTENSIONS = new Set([".tsx", ".jsx", ".ts", ".js"]);
const SCAN_ROOTS = ["apps", "packages"];

// Test/spec/story/scripts files — not shipped UI, exempt from the catalog.
const EXEMPT_FILE_RE = /(\.test\.|\.spec\.|\.stories\.|\.d\.ts$)/i;

// ─── Generic helpers ──────────────────────────────────────────────────────────
function isOwnerReserved(relPath) {
  return OWNER_RESERVED_PREFIXES.some((p) => relPath.startsWith(p));
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function walk(dirAbs, relSoFar, files, { onlyRouteFiles = false } = {}) {
  let entries;
  try {
    entries = readdirSync(dirAbs);
  } catch {
    return;
  }
  for (const name of entries) {
    if (HARD_SKIP_DIRS.has(name)) continue;
    const childAbs = join(dirAbs, name);
    const childRel = relSoFar ? `${relSoFar}${sep}${name}` : name;
    if (isOwnerReserved(childRel)) continue;
    let st;
    try {
      st = statSync(childAbs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(childAbs, childRel, files, { onlyRouteFiles });
      continue;
    }
    const ext = name.slice(name.lastIndexOf("."));
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    if (onlyRouteFiles) {
      if (!/^(page|route)\.(tsx?|jsx?)$/.test(name)) continue;
    } else if (EXEMPT_FILE_RE.test(name)) {
      continue;
    }
    files.push({ abs: childAbs, rel: childRel });
  }
}

// ─── S2: Route tables ──────────────────────────────────────────────────────────
/**
 * Convert an app-relative directory path (the chain of segments below
 * `app/`) into a route pattern:
 *   - drop route groups:  `(public)` → removed
 *   - drop parallel slots: `@modal` → removed
 *   - `[id]`             → `:param`
 *   - `[...slug]`        → `:splat`
 *   - `[[...slug]]`      → `:splat?` (optional catch-all)
 * Returns "/" for the root.
 */
function dirSegmentsToRoute(segments) {
  const out = [];
  for (const raw of segments) {
    const seg = raw.trim();
    if (!seg) continue;
    if (seg.startsWith("(") && seg.endsWith(")")) continue; // route group
    if (seg.startsWith("@")) continue; // parallel route slot
    if (/^\[\[\.\.\..+\]\]$/.test(seg)) {
      out.push(":splat?");
      continue;
    }
    if (/^\[\.\.\..+\]$/.test(seg)) {
      out.push(":splat");
      continue;
    }
    if (/^\[.+\]$/.test(seg)) {
      out.push(":param");
      continue;
    }
    out.push(seg);
  }
  return "/" + out.join("/");
}

function buildRouteTable(app) {
  const appAbs = join(APPS_DIR, app, "app");
  const routes = new Set();
  if (!existsSync(appAbs)) {
    return { app, routes: [], note: "no app/ dir" };
  }
  const files = [];
  walk(appAbs, "", files, { onlyRouteFiles: true });
  for (const f of files) {
    const relDir = dirname(f.rel); // segments below app/
    const segments = relDir === "." ? [] : toPosix(relDir).split("/");
    const isApi = /\bapi\b/.test(toPosix(f.rel)) || /route\.(tsx?|jsx?)$/.test(f.abs);
    const route = dirSegmentsToRoute(segments);
    routes.add(JSON.stringify({ route: route === "" ? "/" : route, api: isApi }));
  }
  const list = [...routes]
    .map((s) => JSON.parse(s))
    .sort((a, b) => a.route.localeCompare(b.route));
  return { app, routes: list };
}

/**
 * A route pattern (with :param/:splat) matches a concrete path if, segment by
 * segment, literals equal and :param consumes exactly one segment while
 * :splat/:splat? consume the rest.
 */
function routeMatches(pattern, path) {
  const pSegs = pattern.split("/").filter(Boolean);
  const tSegs = path.split("/").filter(Boolean);
  let i = 0;
  for (; i < pSegs.length; i++) {
    const p = pSegs[i];
    if (p === ":splat" || p === ":splat?") return true; // consumes the rest
    const t = tSegs[i];
    if (t === undefined) {
      // optional catch-all can match zero trailing segments
      return p === ":splat?";
    }
    if (p === ":param") continue;
    if (p.toLowerCase() !== t.toLowerCase()) return false;
  }
  // pattern exhausted — only a match if the path is also exhausted
  if (tSegs.length > i) return false;
  return true;
}

function pathExistsInTable(table, path) {
  if (!table) return false;
  const clean = stripQueryAndHash(path) || "/";
  return table.routes.some((r) => routeMatches(r.route, clean));
}

function stripQueryAndHash(path) {
  return path.replace(/[?#].*$/, "");
}

function hasDynamic(path) {
  return /[?#]|:param|:splat|\$\{|<[a-z]/i.test(path);
}

// ─── S1: Static catalog ─────────────────────────────────────────────────────
// Each extractor returns { value, dynamic } where `dynamic` flags an
// unresolved template literal / interpolation.

const HREF_RE = /\bhref\s*=\s*(?:\{\s*)?(["'`])((?:\\.|(?!\1).)*)\1/g;
const REDIRECT_RE = /\b(?:redirect|permanentRedirect)\s*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
const ROUTER_RE = /\brouter\s*\.\s*(?:push|replace|prefetch)\s*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
const NEXTRES_REDIRECT_RE =
  /NextResponse\s*\.\s*redirect\s*\([\s\S]{0,80}?(["'`])((?:\\.|(?!\1).)*)\1/g;
const ACTION_URL_RE = /\baction_url\s*:\s*(["'`])((?:\\.|(?!\1).)*)\1/g;

function classifyDynamic(raw) {
  // A value is "dynamic" if it contains a template-literal interpolation or a
  // bare expression placeholder. Pure `${...}` we cannot statically resolve.
  return /\$\{/.test(raw);
}

function extractFromLine(line, lineNo, file, hits) {
  const push = (m, kind) => {
    const raw = m[2];
    hits.push({
      source: `${toPosix(file.rel)}:${lineNo}`,
      kind,
      pattern: raw,
      dynamic: classifyDynamic(raw),
    });
  };
  for (const [re, kind] of [
    [HREF_RE, "href"],
    [REDIRECT_RE, "redirect"],
    [ROUTER_RE, "router"],
    [NEXTRES_REDIRECT_RE, "next-redirect"],
    [ACTION_URL_RE, "action_url"],
  ]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) push(m, kind);
  }
}

function buildCatalog() {
  const files = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(REPO_ROOT, root);
    if (!existsSync(abs)) continue;
    walk(abs, root, files);
  }
  const hits = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file.abs, "utf8");
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      extractFromLine(line, i + 1, file, hits);
    }
  }
  return { hits, files };
}

// Which app does a `source` path belong to? `apps/<app>/...` → <app>.
function sourceApp(source) {
  const m = /^apps\/([^/]+)\//.exec(source);
  return m ? m[1] : null;
}

// Is the source file inside a shared package (no app/ of its own)?
function isPackageSource(source) {
  return source.startsWith("packages/");
}

// ─── S3: Classification ─────────────────────────────────────────────────────
function classifyEntry(entry, tables) {
  const raw = entry.pattern.trim();
  const srcApp = sourceApp(entry.source);

  // Expo apps use a different router; their links are audited under V3-04.
  if (srcApp && EXPO_APPS.has(srcApp)) {
    return { label: "EXEMPT", reason: `Expo app (${srcApp}) — audited under V3-04 universal links` };
  }

  // Empty / hash-only / query-only / JS-handler hrefs.
  if (raw === "" || raw === "#") {
    return { label: "ANCHOR", reason: "empty or hash-only href" };
  }
  if (raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("sms:")) {
    return { label: "EXTERNAL", reason: "mailto/tel/sms scheme" };
  }
  if (/^(javascript:|data:|blob:)/i.test(raw)) {
    return { label: "EXEMPT", reason: "non-navigational scheme" };
  }

  // Absolute external/internal URLs.
  if (/^https?:\/\//i.test(raw)) {
    return classifyAbsolute(raw, tables);
  }

  // Protocol-relative or non-path schemes we don't own.
  if (/^\/\//.test(raw)) {
    return { label: "EXTERNAL", reason: "protocol-relative URL" };
  }

  // Template literal. The single most common pattern is an ORIGIN prefix
  // (`${marketplaceOrigin}/sell/status`, `${ACCOUNT_ORIGIN}/wallet`) whose path
  // AFTER the origin is fully static and checkable. Detect that case and
  // resolve the static path against the division app named by the origin var
  // (or the first path segment). Anything still genuinely dynamic stays
  // DYNAMIC-MAYBE for the live walk.
  if (entry.dynamic) {
    const originResolved = tryResolveOriginPrefixed(raw, tables);
    if (originResolved) return originResolved;
    return { label: "DYNAMIC-MAYBE", reason: "template-literal interpolation" };
  }

  // Pure fragment / query (same page).
  if (raw.startsWith("#") || raw.startsWith("?")) {
    return { label: "ANCHOR", reason: "same-page fragment/query" };
  }

  // Relative (no leading slash) — usually a builder arg like "/book" passed to
  // a helper, or a genuinely relative path. We only resolve leading-slash paths
  // confidently; flag others as HELPER for manual/live confirmation.
  if (!raw.startsWith("/")) {
    return { label: "HELPER", reason: "relative/non-rooted path (likely helper arg)" };
  }

  // Leading-slash internal path. Check LEGACY first.
  for (const lp of LEGACY_PATTERNS) {
    if (lp.test.test(raw)) {
      return { label: "LEGACY", reason: lp.note, replacement: lp.replacement };
    }
  }

  // Determine the candidate HOST apps whose route table a relative path may
  // resolve against, in priority order:
  //   - shared package widgets render in the account dashboard host.
  //   - `action_url:` payloads can be written by ANY division for its own app
  //     OR surface in the unified account activity feed — try the source app
  //     first, then account.
  //   - everything else resolves against its own source app.
  const cleanPath = stripQueryAndHash(raw) || "/";
  const hostCandidates = isPackageSource(entry.source)
    ? [PACKAGE_HOST_APP]
    : entry.kind === "action_url"
      ? [srcApp, ACTION_URL_HOST_APP].filter(Boolean)
      : [srcApp].filter(Boolean);

  for (const hostApp of hostCandidates) {
    if (pathExistsInTable(tables[hostApp], cleanPath)) {
      const why = isPackageSource(entry.source)
        ? `package widget resolves in account dashboard host`
        : entry.kind === "action_url"
          ? `action_url resolves in ${hostApp} app`
          : `resolves in source app (${hostApp})`;
      return { label: "OK", reason: why };
    }
  }
  const hostApp = hostCandidates[0] || srcApp;

  // Then resolve against the app implied by the FIRST path segment (e.g.
  // /care/... → care app, /jobs/... → jobs app) for cross-app relative links
  // that the deploy rewrites onto the division host.
  const firstSeg = cleanPath.split("/").filter(Boolean)[0] || "";
  const impliedApp = SUBDOMAIN_TO_APP[firstSeg];
  if (impliedApp && pathExistsInTable(tables[impliedApp], cleanPath)) {
    return {
      label: "OK",
      reason: `resolves in division app (${impliedApp}) by first segment`,
    };
  }
  // Also try the division app with the first segment STRIPPED (e.g. a hub link
  // `/care/book` maps to the care app's `/book`).
  if (impliedApp && firstSeg) {
    const stripped = "/" + cleanPath.split("/").filter(Boolean).slice(1).join("/");
    if (pathExistsInTable(tables[impliedApp], stripped || "/")) {
      return {
        label: "OK",
        reason: `resolves in division app (${impliedApp}) after stripping /${firstSeg}`,
      };
    }
  }

  // Dynamic segment present (route param expressed as :param or <id>).
  if (hasDynamic(cleanPath)) {
    return { label: "DYNAMIC-MAYBE", reason: "dynamic segment; live-walk required" };
  }

  // Nothing matched anywhere → DEAD.
  return {
    label: "DEAD",
    reason: hostApp
      ? `no matching route in host app (${hostApp}) or division tables`
      : "no matching route in any table",
  };
}

// Origin-variable name → app. Covers the `<division>Origin` and
// `<DIVISION>_ORIGIN` conventions used across the apps for cross-division URLs.
const ORIGIN_VAR_TO_APP = {
  accountorigin: "account",
  careorigin: "care",
  huborigin: "hub",
  joborigin: "jobs",
  jobsorigin: "jobs",
  learnorigin: "learn",
  logisticsorigin: "logistics",
  marketplaceorigin: "marketplace",
  propertyorigin: "property",
  studioorigin: "studio",
};

/**
 * Resolve a template literal of the shape `${someOrigin}/static/path` where the
 * ONLY interpolation is a leading origin variable and the remainder is static.
 * Returns a classification or null when the pattern doesn't fit (genuinely
 * dynamic path segments after the origin).
 */
function tryResolveOriginPrefixed(raw, tables) {
  const m = /^\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}(\/.*)?$/.exec(raw);
  if (!m) return null;
  const varName = m[1].toLowerCase();
  const rest = m[2] || "/";
  // The remainder must be fully static (no further interpolation).
  if (/\$\{/.test(rest)) return null;
  const app = ORIGIN_VAR_TO_APP[varName];
  if (!app) return null; // unknown origin var → leave as DYNAMIC-MAYBE
  const cleanPath = stripQueryAndHash(rest) || "/";
  // Legacy check on the resolved path too.
  for (const lp of LEGACY_PATTERNS) {
    if (lp.test.test(cleanPath)) {
      return { label: "LEGACY", reason: lp.note, replacement: lp.replacement };
    }
  }
  if (pathExistsInTable(tables[app], cleanPath)) {
    return { label: "OK", reason: `origin-prefixed → ${app} route (${cleanPath})` };
  }
  if (hasDynamic(cleanPath)) {
    return { label: "DYNAMIC-MAYBE", reason: `origin-prefixed → ${app}, dynamic path` };
  }
  return { label: "DEAD", reason: `origin-prefixed → ${app}, no matching route (${cleanPath})` };
}

function classifyAbsolute(raw, tables) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { label: "EXTERNAL", reason: "unparseable absolute URL" };
  }
  const host = url.hostname.toLowerCase();
  const isHenry =
    host === "henrycogroup.com" ||
    host.endsWith(".henrycogroup.com") ||
    host === "henry.holdings" ||
    host.endsWith(".henry.holdings");
  if (!isHenry) {
    return { label: "EXTERNAL", reason: `off-platform host ${host}` };
  }
  // Internal absolute URL — map subdomain → app and resolve the path.
  const sub = host.replace(/\.?henrycogroup\.com$/i, "").replace(/\.?henry\.holdings$/i, "");
  const app = SUBDOMAIN_TO_APP[sub] ?? null;
  const path = url.pathname || "/";
  if (!app) {
    return { label: "HELPER", reason: `henry host ${host} not mapped to an app` };
  }
  if (pathExistsInTable(tables[app], path)) {
    return { label: "OK", reason: `absolute → ${app} route` };
  }
  if (hasDynamic(path)) {
    return { label: "DYNAMIC-MAYBE", reason: `absolute → ${app}, dynamic path` };
  }
  return { label: "DEAD", reason: `absolute → ${app}, no matching route (${path})` };
}

// ─── S8: anchor audit ─────────────────────────────────────────────────────────
// For hrefs of the form `#anchor` or `/path#anchor`, verify the target page
// declares `id="anchor"`. We can only do this where the target page file is
// statically locatable in the SOURCE app (same-page `#x`) — cross-app anchors
// are deferred to the live walk.
function auditAnchors(catalog, fileTextCache) {
  const findings = [];
  for (const entry of catalog) {
    const raw = entry.pattern.trim();
    const hashIdx = raw.indexOf("#");
    if (hashIdx === -1) continue;
    const anchor = raw.slice(hashIdx + 1).trim();
    if (!anchor || /\$\{/.test(anchor)) continue; // dynamic anchor
    const pathPart = raw.slice(0, hashIdx);
    // Only same-page (`#x`) anchors are statically checkable against the file
    // that declares them; otherwise we'd need the target page's rendered HTML.
    if (pathPart === "" || pathPart === ".") {
      const srcAbs = join(REPO_ROOT, entry.source.split(":")[0]);
      let text = fileTextCache.get(srcAbs);
      if (text === undefined) {
        try {
          text = readFileSync(srcAbs, "utf8");
        } catch {
          text = "";
        }
        fileTextCache.set(srcAbs, text);
      }
      const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match the anchor target whether it is declared as a JSX attribute
      // (`id="x"` / `id={"x"}`), an object property fed to a design-system
      // component (`id: "x"` — e.g. DivisionLanding `sections`/`tiles`), or a
      // scrollIntoView/getElementById target. The account dashboards use the
      // object-property form heavily, so attribute-only matching produced
      // false positives.
      const idRe = new RegExp(
        `\\bid\\s*[=:]\\s*\\{?\\s*["'\`]${esc}["'\`]`,
      );
      if (!idRe.test(text)) {
        findings.push({
          source: entry.source,
          anchor: `#${anchor}`,
          status: "UNRESOLVED-SAME-PAGE",
          note: "no id match in the same file; verify via live walk if cross-component",
        });
      }
    }
  }
  return findings;
}

// ─── S9: button-disguised-as-link audit (ADVISORY) ─────────────────────────────
// Find `<button type="button" …>` opening tags that have NO interactivity wired.
// We deliberately scope to EXPLICIT `type="button"` because that is the only
// statically-unambiguous inert case: a `<button>` with no `type` defaults to
// `submit` inside a `<form>` (so it DOES something), and we cannot tell from a
// single opening tag whether such a button sits in a form. Restricting to
// `type="button"` removes the form-submit false positives while still catching
// the genuine "looks clickable, does nothing" buttons.
//
// A `type="button"` element is a suspect when it has:
//   - no `onClick` / `onPress` / `onClickCapture` / pointer handler
//   - no `formAction`
//   - no spread (`{...props}` / `{...rest}`) — a spread may carry a handler from
//     the parent, so we treat it as wired (avoids false positives).
//   - is not `disabled` (a disabled button is intentionally inert).
// Still ADVISORY: the per-card verdict is V3-11's. Tests are excluded by walk().
const BUTTON_OPEN_RE = /<button\b([^>]*)>/gis;

function auditButtons(scanFiles, fileTextCache) {
  const findings = [];
  for (const file of scanFiles) {
    const srcApp = sourceApp(toPosix(file.rel));
    if (srcApp && EXPO_APPS.has(srcApp)) continue; // RN buttons differ; V3-04 owns
    let text = fileTextCache.get(file.abs);
    if (text === undefined) {
      try {
        text = readFileSync(file.abs, "utf8");
      } catch {
        text = "";
      }
      fileTextCache.set(file.abs, text);
    }
    if (!/<button\b/i.test(text)) continue;
    const lineStarts = computeLineStarts(text);
    BUTTON_OPEN_RE.lastIndex = 0;
    let m;
    while ((m = BUTTON_OPEN_RE.exec(text)) !== null) {
      const attrs = m[1] || "";
      const isExplicitButtonType = /\btype\s*=\s*["'`]button["'`]/i.test(attrs);
      if (!isExplicitButtonType) continue; // only the unambiguous inert case
      const hasHandler = /\bon(?:Click|Press|ClickCapture|PointerDown|MouseDown|KeyDown)\b/.test(attrs);
      const hasFormAction = /\bformAction\b/.test(attrs);
      const isDisabled = /\bdisabled\b/.test(attrs);
      const hasSpread = /\{\s*\.\.\./.test(attrs);
      if (hasHandler || hasFormAction || hasSpread || isDisabled) continue;
      const lineNo = offsetToLine(lineStarts, m.index);
      findings.push({
        source: `${toPosix(file.rel)}:${lineNo}`,
        note: 'type="button" with no onClick/onPress/formAction/spread — confirm in V3-11',
      });
    }
  }
  return findings;
}

function computeLineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) starts.push(i + 1);
  }
  return starts;
}

function offsetToLine(lineStarts, offset) {
  // binary search for the greatest start <= offset
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

// ─── Fingerprints + baseline ──────────────────────────────────────────────────
function fingerprint(entry) {
  return `${entry.source}|${entry.kind}|${entry.pattern}`;
}

function collectFailingSet(classified) {
  const set = new Set();
  for (const e of classified) {
    if (e.classification === "DEAD" || e.classification === "LEGACY") {
      set.add(fingerprint(e));
    }
  }
  return set;
}

// ─── Report ────────────────────────────────────────────────────────────────────
function writeReport(classified, anchors, buttons, counts, tables) {
  const byLabel = (label) => classified.filter((e) => e.classification === label);
  const fmt = (e) =>
    `- \`${e.source}\` — \`${e.pattern}\`  _(${e.reason})_` +
    (e.replacement ? ` → **${e.replacement}**` : "");

  const totalRoutes = Object.values(tables).reduce(
    (a, t) => a + (t.routes?.length || 0),
    0,
  );

  const lines = [];
  lines.push("# V3-06 — Dead-Link Static Scan Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Generator: scripts/v3/dead-link-scan.mjs`);
  lines.push("");
  lines.push("ANTI-CLONE: internal route-table catalog — do not publish.");
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`- Apps scanned: ${Object.keys(tables).length}`);
  lines.push(`- Routes catalogued: ${totalRoutes}`);
  lines.push(`- Href/redirect sites found: ${classified.length}`);
  lines.push("");
  lines.push("| Classification | Count |");
  lines.push("|---|---|");
  for (const k of [
    "OK",
    "DEAD",
    "LEGACY",
    "DYNAMIC-MAYBE",
    "HELPER",
    "EXTERNAL",
    "ANCHOR",
    "EXEMPT",
  ]) {
    lines.push(`| ${k} | ${counts[k] || 0} |`);
  }
  lines.push("");
  lines.push(`Anchor findings (same-page unresolved): ${anchors.length}`);
  lines.push("");

  lines.push("## DEAD (must fix or remove)");
  lines.push("");
  const dead = byLabel("DEAD");
  if (!dead.length) lines.push("_None._");
  else dead.forEach((e) => lines.push(fmt(e)));
  lines.push("");

  lines.push("## LEGACY (must update to current pattern)");
  lines.push("");
  const legacy = byLabel("LEGACY");
  if (!legacy.length) lines.push("_None._");
  else legacy.forEach((e) => lines.push(fmt(e)));
  lines.push("");

  lines.push("## DYNAMIC-MAYBE (confirm via live walk)");
  lines.push("");
  const dyn = byLabel("DYNAMIC-MAYBE");
  lines.push(`_${dyn.length} entries — sample (first 40):_`);
  dyn.slice(0, 40).forEach((e) => lines.push(fmt(e)));
  lines.push("");

  lines.push("## HELPER (cross-division / builder args — confirm via live walk)");
  lines.push("");
  const helper = byLabel("HELPER");
  lines.push(`_${helper.length} entries — sample (first 30):_`);
  helper.slice(0, 30).forEach((e) => lines.push(fmt(e)));
  lines.push("");

  lines.push("## Anchor findings");
  lines.push("");
  if (!anchors.length) lines.push("_None unresolved (same-page)._");
  else
    anchors
      .slice(0, 60)
      .forEach((a) => lines.push(`- \`${a.source}\` — \`${a.anchor}\` _(${a.note})_`));
  lines.push("");

  lines.push("## S9 — inert-button candidates (ADVISORY; owned by V3-11)");
  lines.push("");
  lines.push(
    "Static candidates only — a `<button type=\"button\">` with no `onClick`/" +
      "`onPress`/pointer handler, no `formAction`, and no spread props. Scoped to " +
      "explicit `type=\"button\"` because a typeless `<button>` defaults to submit " +
      "inside a form. Some may still be false positives (handler wired in a parent). " +
      "The per-card 'opens the exact next step' verdict is V3-11's; this is a " +
      "starting point, NOT a CI gate.",
  );
  lines.push("");
  lines.push(`_${buttons.length} candidate(s) — sample (first 40):_`);
  buttons.slice(0, 40).forEach((b) => lines.push(`- \`${b.source}\` _(${b.note})_`));
  lines.push("");

  writeFileSync(REPORT_PATH, lines.join("\n") + "\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  ensureDir(ROUTE_TABLE_DIR);

  // S2 — route tables
  const tables = {};
  for (const app of WEB_APPS) {
    const table = buildRouteTable(app);
    tables[app] = table;
    writeFileSync(
      join(ROUTE_TABLE_DIR, `${app}.json`),
      JSON.stringify(table, null, 2) + "\n",
    );
  }

  // S1 — catalog
  const { hits: catalog, files: scanFiles } = buildCatalog();
  writeFileSync(
    CATALOG_PATH,
    JSON.stringify(
      {
        schema: "v1",
        generatedAt: new Date().toISOString(),
        generator: "scripts/v3/dead-link-scan.mjs",
        count: catalog.length,
        entries: catalog,
      },
      null,
      2,
    ) + "\n",
  );

  // S3 — classify
  const classified = catalog.map((e) => {
    const c = classifyEntry(e, tables);
    return { ...e, classification: c.label, reason: c.reason, replacement: c.replacement };
  });
  const counts = {};
  for (const e of classified) counts[e.classification] = (counts[e.classification] || 0) + 1;

  // S8 — anchors / S9 — inert buttons (advisory). Share the file-text cache.
  const fileTextCache = new Map();
  const anchors = auditAnchors(catalog, fileTextCache);
  const buttons = auditButtons(scanFiles, fileTextCache);

  writeFileSync(
    CLASSIFIED_PATH,
    JSON.stringify(
      { schema: "v1", generatedAt: new Date().toISOString(), counts, entries: classified },
      null,
      2,
    ) + "\n",
  );
  writeReport(classified, anchors, buttons, counts, tables);

  const failingSet = collectFailingSet(classified);

  // --write-baseline
  if (WRITE_BASELINE) {
    writeFileSync(
      BASELINE_PATH,
      JSON.stringify(
        {
          schema: "v1",
          generatedAt: new Date().toISOString(),
          note: "V3-06 dead-link baseline. Fingerprints of DEAD/LEGACY entries acknowledged at baseline time. --check fails only on NEW fingerprints.",
          deadLegacyFingerprints: [...failingSet].sort(),
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      `[dead-link-scan] wrote baseline with ${failingSet.size} acknowledged DEAD/LEGACY fingerprint(s).`,
    );
  }

  // --check (CI gate, S10)
  if (CHECK_MODE) {
    let baselineSet = new Set();
    if (existsSync(BASELINE_PATH)) {
      try {
        const b = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
        baselineSet = new Set(b.deadLegacyFingerprints || []);
      } catch (err) {
        console.warn(`[dead-link-scan] failed to parse baseline: ${err.message}`);
      }
    }
    const newOnes = [...failingSet].filter((fp) => !baselineSet.has(fp));
    if (newOnes.length) {
      console.error(
        `[dead-link-scan] FAIL — ${newOnes.length} NEW DEAD/LEGACY link(s) introduced:`,
      );
      for (const fp of newOnes.slice(0, 40)) console.error(`  ${fp}`);
      if (newOnes.length > 40) console.error(`  ...and ${newOnes.length - 40} more`);
      console.error(
        "\nFix the link (use a typed link helper) or, if intentional, regenerate the baseline:\n  node scripts/v3/dead-link-scan.mjs --write-baseline",
      );
      process.exit(1);
    }
    console.log(
      `[dead-link-scan] OK — no NEW DEAD/LEGACY (DEAD=${counts.DEAD || 0}, LEGACY=${counts.LEGACY || 0} all baselined).`,
    );
    return;
  }

  console.log(
    `[dead-link-scan] scanned ${catalog.length} href sites across ${Object.keys(tables).length} apps.`,
  );
  console.log(
    `[dead-link-scan] DEAD=${counts.DEAD || 0} LEGACY=${counts.LEGACY || 0} DYNAMIC-MAYBE=${counts["DYNAMIC-MAYBE"] || 0} HELPER=${counts.HELPER || 0} OK=${counts.OK || 0} EXTERNAL=${counts.EXTERNAL || 0} ANCHOR=${counts.ANCHOR || 0}`,
  );
  console.log(`[dead-link-scan] report → ${toPosix(REPORT_PATH)}`);
  if (PRINT_JSON)
    console.log(
      JSON.stringify({ counts, anchors: anchors.length, inertButtons: buttons.length }, null, 2),
    );
}

main();
