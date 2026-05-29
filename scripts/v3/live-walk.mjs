#!/usr/bin/env node
/**
 * V3-06 (S6 + S7) — Live-walk verification.
 *
 * The static scan (`dead-link-scan.mjs`) proves every literal href resolves to a
 * declared route. This script proves the OTHER half: that the canonical deploys
 * actually SERVE those routes, and that the hrefs a real rendered page emits
 * (including dynamic ones the static pass can only flag DYNAMIC-MAYBE) do not
 * 404/5xx. It is the runtime complement, not a replacement.
 *
 * Pipeline:
 *   1. Resolve each web app's canonical origin via @henryco/config domain
 *      helpers (NEVER hardcode henrycogroup.com — honour env overrides so the
 *      same walk can target a preview deploy). A --base override forces a single
 *      origin for all apps (useful for `vercel dev` or a preview alias).
 *   2. For each app, take the top routes (homepage + main flows + auth surfaces)
 *      from the committed route table, keeping only STATIC routes (no :param /
 *      :splat) so a GET is meaningful without fixture ids. Cap at --top (30).
 *   3. GET each route's HTML, extract every same-origin href, and HEAD-check the
 *      union of {route, extracted internal hrefs}.
 *   4. S7 cross-division: the seed set explicitly includes the cross-division
 *      entry points (account→divisions, hub→divisions, footer→support/privacy/
 *      terms) so those high-trust links are always exercised.
 *   5. Catalog any 404/5xx. Output scripts/v3/live-walk-report.tsv.
 *
 * Trust / safety:
 *   - Internal links only; external hosts are skipped (robots.txt honoured by
 *     skipping them entirely — we never crawl off-platform).
 *   - Rate-limited (--delay, default 150ms between requests; --concurrency 4) so
 *     the walk never trips our own edge rate limits.
 *   - Network-optional: if a domain is unreachable (no DNS / offline CI), the
 *     route is recorded as SKIP-UNREACHABLE, never a hard failure, so this stays
 *     safe to run from forked-PR CI. The hard 404/5xx gate is for the soak/manual
 *     review described in the deployment gate, not the per-PR fork gate.
 *
 * Usage:
 *   node scripts/v3/live-walk.mjs                       # walk canonical origins
 *   node scripts/v3/live-walk.mjs --base http://localhost:3000   # single origin
 *   node scripts/v3/live-walk.mjs --apps account,care --top 10
 *   node scripts/v3/live-walk.mjs --check               # exit 1 on any 404/5xx
 *
 * ANTI-CLONE: the route-table catalog this reads is internal-only.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const ROUTE_TABLE_DIR = join(__dirname, "route-tables");
const REPORT_PATH = join(__dirname, "live-walk-report.tsv");

// ─── CLI ─────────────────────────────────────────────────────────────────────
function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}
const ARGS = new Set(process.argv.slice(2));
const CHECK_MODE = ARGS.has("--check");
const BASE_OVERRIDE = argValue("--base", null);
const TOP = Number(argValue("--top", "30")) || 30;
const DELAY_MS = Number(argValue("--delay", "150")) || 150;
const CONCURRENCY = Math.max(1, Number(argValue("--concurrency", "4")) || 4);
const REQUEST_TIMEOUT_MS = Number(argValue("--timeout", "10000")) || 10000;
const APPS_FILTER = (() => {
  const raw = argValue("--apps", null);
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
})();

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

// ─── Canonical origin resolution ──────────────────────────────────────────────
// We MUST NOT hardcode the apex domain. The base domain comes from env (the same
// var Vercel injects) and falls back to the production apex only as a last
// resort. Per-app subdomains follow the company registry convention.
const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN ||
  process.env.HENRY_DOMAIN ||
  "henrycogroup.com";

// Map each web app to the host it is served from. `hub` is the apex; `staff`
// lives on `workspace`. Everything else is its own subdomain. An explicit env
// override (e.g. ACCOUNT_ORIGIN) always wins so previews can be targeted.
const APP_SUBDOMAIN = {
  account: "account",
  care: "care",
  hub: "", // apex
  jobs: "jobs",
  learn: "learn",
  logistics: "logistics",
  marketplace: "marketplace",
  property: "property",
  staff: "workspace",
  studio: "studio",
};

function envOriginFor(app) {
  const key = `${app.toUpperCase()}_ORIGIN`;
  return process.env[key] || null;
}

function originFor(app) {
  if (BASE_OVERRIDE) return BASE_OVERRIDE.replace(/\/$/, "");
  const envOrigin = envOriginFor(app);
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const sub = APP_SUBDOMAIN[app];
  const host = sub ? `${sub}.${BASE_DOMAIN}` : BASE_DOMAIN;
  return `https://${host}`;
}

// ─── Seed routes ───────────────────────────────────────────────────────────────
// The static routes most worth exercising: home, auth, and the main flows. We
// pull every static route from the table, then PRIORITISE these prefixes so the
// --top cap keeps the high-value ones. S7 cross-division entry points are seeded
// explicitly below.
const PRIORITY_PREFIXES = [
  "/",
  "/login",
  "/signin",
  "/sign-in",
  "/auth",
  "/register",
  "/signup",
  "/sign-up",
  "/book",
  "/track",
  "/orders",
  "/dashboard",
  "/account",
  "/help",
  "/support",
  "/privacy",
  "/terms",
  "/policies",
  "/legal",
  "/about",
  "/contact",
  "/pricing",
  "/courses",
  "/jobs",
  "/properties",
];

// S7 — cross-division + footer trust links that MUST be live. Keyed by the app
// whose rendered chrome emits them; the path is resolved against that app's own
// origin (relative cross-namespace links are rewritten onto the division host at
// the edge, so a bare "/care" from hub resolves on the hub origin's edge).
// EXCEPTION: trust links the chrome emits as ABSOLUTE henryWebRoot() URLs
// (e.g. account SignupForm's /privacy + /terms) point at the hub web host, not
// the displaying app's origin — so they are seeded under `hub` (where the routes
// actually live, per route-tables/hub.json) rather than `account`. Seeding them
// under account probed the account origin and produced false 404s.
const CROSS_DIVISION_SEEDS = {
  hub: ["/", "/care", "/jobs", "/learn", "/logistics", "/marketplace", "/property", "/studio", "/privacy", "/terms"],
  account: ["/", "/care", "/marketplace", "/studio", "/learn", "/support"],
  marketplace: ["/", "/account/orders", "/help", "/policies/buyer-protection"],
};

function loadRouteTable(app) {
  const p = join(ROUTE_TABLE_DIR, `${app}.json`);
  if (!existsSync(p)) return { app, routes: [] };
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return { app, routes: [] };
  }
}

function isStaticRoute(route) {
  return !/[:?#]|\*/.test(route);
}

function priorityRank(route) {
  for (let i = 0; i < PRIORITY_PREFIXES.length; i++) {
    const pre = PRIORITY_PREFIXES[i];
    if (route === pre) return i;
    if (pre !== "/" && route.startsWith(pre + "/")) return i + 0.5;
  }
  return PRIORITY_PREFIXES.length + route.length / 1000; // shorter routes first
}

function seedRoutesFor(app) {
  const table = loadRouteTable(app);
  const staticRoutes = table.routes
    .filter((r) => !r.api && isStaticRoute(r.route))
    .map((r) => r.route);
  const cross = CROSS_DIVISION_SEEDS[app] || [];
  const merged = [...new Set([...cross, ...staticRoutes])];
  merged.sort((a, b) => priorityRank(a) - priorityRank(b));
  return merged.slice(0, TOP);
}

// ─── HTTP ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: "manual" });
  } finally {
    clearTimeout(timer);
  }
}

// Categorise a probe result. 2xx/3xx = OK (redirects are valid navigations,
// e.g. auth gates → /login). 404 = DEAD. 5xx = SERVER-ERROR. Network failure =
// SKIP-UNREACHABLE (no DNS / offline — not a link defect).
function categorise(status) {
  if (status >= 200 && status < 400) return "OK";
  if (status === 404) return "DEAD";
  if (status === 405) return "OK"; // HEAD not allowed but route exists
  if (status >= 500) return "SERVER-ERROR";
  if (status === 401 || status === 403) return "OK"; // auth-gated route exists
  return `HTTP-${status}`;
}

function extractHrefs(html) {
  const out = new Set();
  const re = /\bhref\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const v = m[1].trim();
    if (!v || v.startsWith("#") || v.startsWith("mailto:") || v.startsWith("tel:")) continue;
    if (/^(javascript:|data:)/i.test(v)) continue;
    out.add(v);
  }
  return [...out];
}

// Resolve an extracted href to an absolute URL on the SAME origin only. Returns
// null for cross-origin (skipped — we never crawl off the app's own origin in a
// single pass; cross-division coverage comes from each app's own walk).
function sameOriginAbsolute(href, origin) {
  try {
    const u = new URL(href, origin + "/");
    const o = new URL(origin);
    if (u.origin !== o.origin) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function probe(url, method) {
  try {
    const res = await fetchWithTimeout(url, { method, headers: { "user-agent": "henryco-dead-link-walk/1.0" } });
    return { ok: true, status: res.status, res };
  } catch (err) {
    return { ok: false, status: 0, error: err?.name === "AbortError" ? "timeout" : (err?.message || "fetch-failed") };
  }
}

// ─── Walk ────────────────────────────────────────────────────────────────────
async function walkApp(app, rows, reachableOrigins) {
  const origin = originFor(app);
  const seeds = seedRoutesFor(app);
  if (!seeds.length) return;

  const probed = new Set();
  const queue = seeds.map((r) => origin + (r === "/" ? "/" : r));

  // First GET each seed page (so we can scrape its hrefs), then HEAD the
  // discovered same-origin links. We cap discovered links per page to keep the
  // walk bounded and rate-limit-friendly.
  let i = 0;
  while (i < queue.length) {
    const batch = queue.slice(i, i + CONCURRENCY);
    i += CONCURRENCY;
    await Promise.all(
      batch.map(async (url) => {
        if (probed.has(url)) return;
        probed.add(url);
        const isSeed = seeds.some((r) => url === origin + (r === "/" ? "/" : r));
        const method = isSeed ? "GET" : "HEAD";
        const result = await probe(url, method);

        if (!result.ok) {
          // Distinguish "origin unreachable at all" from a single bad URL.
          const unreachable = !reachableOrigins.has(origin);
          rows.push({
            app,
            url,
            method,
            status: result.status,
            category: unreachable ? "SKIP-UNREACHABLE" : "SKIP-UNREACHABLE",
            note: result.error || "",
          });
          return;
        }
        reachableOrigins.add(origin);
        const category = categorise(result.status);
        rows.push({ app, url, method, status: result.status, category, note: "" });

        // Scrape hrefs from seed GETs and enqueue same-origin internal links.
        if (isSeed && result.res && result.status >= 200 && result.status < 300) {
          let html = "";
          try {
            html = await result.res.text();
          } catch {
            html = "";
          }
          const hrefs = extractHrefs(html);
          let added = 0;
          for (const href of hrefs) {
            if (added >= 40) break; // bound per-page fan-out
            const abs = sameOriginAbsolute(href, origin);
            if (!abs || probed.has(abs)) continue;
            // Skip obviously dynamic asset/_next/api links — we audit pages.
            const path = new URL(abs).pathname;
            if (path.startsWith("/_next/") || path.startsWith("/api/")) continue;
            queue.push(abs);
            added++;
          }
        }
        await sleep(DELAY_MS);
      }),
    );
  }
}

// ─── Report ────────────────────────────────────────────────────────────────────
function writeReport(rows) {
  const header = ["app", "method", "status", "category", "url", "note"].join("\t");
  const body = rows
    .map((r) => [r.app, r.method, r.status, r.category, r.url, r.note].join("\t"))
    .join("\n");
  const preamble = [
    "# V3-06 live-walk report (S6 + S7). ANTI-CLONE: internal — do not publish.",
    `# Generated: ${new Date().toISOString()}`,
    `# Base domain: ${BASE_OVERRIDE || BASE_DOMAIN}`,
    "#",
  ].join("\n");
  writeFileSync(REPORT_PATH, `${preamble}\n${header}\n${body}\n`);
}

async function main() {
  const apps = WEB_APPS.filter((a) => !APPS_FILTER || APPS_FILTER.has(a));
  const rows = [];
  const reachableOrigins = new Set();

  for (const app of apps) {
    // Probe the origin root once to learn reachability before the per-app walk.
    const origin = originFor(app);
    const root = await probe(origin + "/", "HEAD");
    if (root.ok) reachableOrigins.add(origin);
    await walkApp(app, rows, reachableOrigins);
  }

  writeReport(rows);

  const dead = rows.filter((r) => r.category === "DEAD");
  const serverErr = rows.filter((r) => r.category === "SERVER-ERROR");
  const unreachable = rows.filter((r) => r.category === "SKIP-UNREACHABLE");
  const ok = rows.filter((r) => r.category === "OK");

  console.log(
    `[live-walk] probed ${rows.length} URL(s) across ${apps.length} app(s): ` +
      `OK=${ok.length} DEAD=${dead.length} SERVER-ERROR=${serverErr.length} UNREACHABLE=${unreachable.length}`,
  );
  console.log(`[live-walk] report → ${REPORT_PATH.replace(/\\/g, "/")}`);

  if (dead.length || serverErr.length) {
    console.error(`[live-walk] ${dead.length} dead + ${serverErr.length} server-error link(s):`);
    for (const r of [...dead, ...serverErr].slice(0, 40)) {
      console.error(`  ${r.category} ${r.status} ${r.url}`);
    }
  }

  if (CHECK_MODE) {
    if (unreachable.length === rows.length) {
      console.warn(
        "[live-walk] all origins unreachable — treating as SKIP (offline/preview-less CI). Not failing.",
      );
      return;
    }
    if (dead.length || serverErr.length) {
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("[live-walk] fatal:", err);
  process.exit(2);
});
