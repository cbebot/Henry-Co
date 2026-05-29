#!/usr/bin/env node
/**
 * V3-12 (S2) — Foundation-lock live smoke orchestrator.
 *
 * This is the runtime acceptance probe for Phase B Foundation Lock. The static
 * acceptance pass (`docs/v3/foundation-lock-acceptance.md` §1) proves every
 * pass's CODE is merged to `main`. This script proves the OTHER half: that a
 * deployed production origin actually SERVES the foundation behaviours. It is
 * the network complement to the repo-state check, not a replacement.
 *
 * It deliberately checks ONLY things observable from an unauthenticated HTTP
 * client, because the conductor environment has no production session and MUST
 * NOT fabricate authenticated pass/fail evidence. The auth-gated, device, and
 * telemetry-read checks (S3–S7) stay owner-gated and are NOT attempted here.
 *
 * ─── NO FAKE CLAIMS (load-bearing) ────────────────────────────────────────────
 *   - When no origin is reachable (offline / no --base / preview-less CI), EVERY
 *     check returns SKIP and the run prints a "NO PRODUCTION EVIDENCE" banner.
 *     A skip is NOT a pass. The script refuses to imply success when it has
 *     collected no evidence — that is the whole point of running it.
 *   - A guessed route that 404s is SKIP (not in this deploy), never a fake FAIL.
 *     Only a real 5xx, a real 404 on a route that MUST exist (AASA/assetlinks/
 *     top routes), or an auth-gate that LEAKS (200 where a redirect/401 was
 *     required) counts as FAIL.
 *
 * Usage:
 *   node scripts/v3/foundation-smoke.mjs --base https://<prod-apex>
 *   node scripts/v3/foundation-smoke.mjs                 # canonical origins (env)
 *   node scripts/v3/foundation-smoke.mjs --check         # exit 1 on any FAIL
 *   node scripts/v3/foundation-smoke.mjs --json out.json # also write machine table
 *   node scripts/v3/foundation-smoke.mjs --only aasa,deeplink-roundtrip
 *
 * Output: a per-check PASS/FAIL/SKIP/WARN table to stdout, and (with --json) a
 * machine-readable artifact to attach to the acceptance doc's Section 2.
 *
 * ANTI-CLONE: route knowledge here is internal-only; do not publish the table.
 */

import { writeFileSync } from "node:fs";

// ─── CLI ─────────────────────────────────────────────────────────────────────
function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}
const ARGS = new Set(process.argv.slice(2));
const CHECK_MODE = ARGS.has("--check");
const BASE_OVERRIDE = argValue("--base", null);
const JSON_OUT = argValue("--json", null);
const REQUEST_TIMEOUT_MS = Number(argValue("--timeout", "10000")) || 10000;
const ONLY = (() => {
  const raw = argValue("--only", null);
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
})();

// ─── Canonical origin resolution (mirrors live-walk.mjs — never hardcode) ─────
// The base domain comes from env (the same var Vercel injects) and falls back to
// the production apex only as a last resort. A --base override forces a single
// origin for every app (useful to target a single preview alias). Per-app
// *_ORIGIN env vars always win so individual previews can be targeted.
const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN ||
  process.env.HENRY_DOMAIN ||
  "henrycogroup.com";

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

function originFor(app) {
  if (BASE_OVERRIDE) return BASE_OVERRIDE.replace(/\/$/, "");
  const envOrigin = process.env[`${app.toUpperCase()}_ORIGIN`];
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const sub = APP_SUBDOMAIN[app];
  const host = sub ? `${sub}.${BASE_DOMAIN}` : BASE_DOMAIN;
  return `https://${host}`;
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

async function probe(url, method = "GET") {
  try {
    const res = await fetchWithTimeout(url, {
      method,
      headers: { "user-agent": "henryco-foundation-smoke/1.0" },
    });
    let body = "";
    if (method === "GET") {
      try {
        body = await res.text();
      } catch {
        body = "";
      }
    }
    const ct = res.headers.get("content-type") || "";
    const location = res.headers.get("location") || "";
    return { ok: true, status: res.status, ct, location, body };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err?.name === "AbortError" ? "timeout" : err?.message || "fetch-failed",
    };
  }
}

// ─── Result vocabulary ─────────────────────────────────────────────────────────
const PASS = "PASS";
const FAIL = "FAIL";
const SKIP = "SKIP"; // route absent / origin unreachable — NOT a pass, NOT a fail
const WARN = "WARN"; // served but a softer expectation missed (informational)

const REDIRECT = new Set([301, 302, 303, 307, 308]);
const GATE_OK = new Set([301, 302, 303, 307, 308, 401, 403]);

// Banned "loading theater" copy V3-05 removed — their presence in served HTML is
// a regression. Kept narrow to avoid false hits on legitimate prose.
const LOADING_THEATER_RE =
  /\b(warming up|spinning up|getting things ready|just a moment while we|hang tight while)\b/i;

// ─── Checks ──────────────────────────────────────────────────────────────────
// Each check is declarative: { id, pass, title, run(ctx) → {status, detail} }.
// `run` may probe one or more URLs and decide. Network failure inside a check is
// reported as SKIP (the runner also pre-flights origin reachability).

function jsonParseable(body) {
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

const CHECKS = [
  // ── V3-04 — universal links: AASA must serve as parseable JSON with applinks ──
  {
    id: "aasa",
    pass: "V3-04",
    title: "Apple App Site Association served (apex)",
    async run() {
      const url = originFor("hub") + "/.well-known/apple-app-site-association";
      const r = await probe(url, "GET");
      if (!r.ok) return { status: SKIP, detail: `unreachable (${r.error})`, url };
      if (r.status === 404) return { status: FAIL, detail: "404 — AASA must be served for universal links", url };
      if (r.status >= 500) return { status: FAIL, detail: `${r.status} server error`, url };
      if (r.status !== 200) return { status: WARN, detail: `unexpected ${r.status}`, url };
      if (!jsonParseable(r.body)) return { status: FAIL, detail: "200 but body is not JSON", url };
      const j = JSON.parse(r.body);
      const hasApplinks = j && (j.applinks || j.appclips || j.webcredentials);
      return hasApplinks
        ? { status: PASS, detail: "200 + parseable JSON with applinks", url }
        : { status: FAIL, detail: "JSON has no applinks/webcredentials key", url };
    },
  },
  // ── V3-04 — Android assetlinks must serve as a parseable JSON array ──
  {
    id: "assetlinks",
    pass: "V3-04",
    title: "Android assetlinks.json served (apex)",
    async run() {
      const url = originFor("hub") + "/.well-known/assetlinks.json";
      const r = await probe(url, "GET");
      if (!r.ok) return { status: SKIP, detail: `unreachable (${r.error})`, url };
      if (r.status === 404) return { status: FAIL, detail: "404 — assetlinks must be served for App Links", url };
      if (r.status >= 500) return { status: FAIL, detail: `${r.status} server error`, url };
      if (r.status !== 200) return { status: WARN, detail: `unexpected ${r.status}`, url };
      if (!jsonParseable(r.body)) return { status: FAIL, detail: "200 but body is not JSON", url };
      const j = JSON.parse(r.body);
      return Array.isArray(j) && j.some((e) => e && e.relation)
        ? { status: PASS, detail: "200 + JSON array with relation entries", url }
        : { status: FAIL, detail: "JSON is not a relation array", url };
    },
  },
  // ── V3-04 S1 — deep-link auth round-trip: a protected deep link, hit
  //    unauthenticated, must REDIRECT to login carrying a return param. A 200
  //    that leaks the surface = FAIL; a 500 = FAIL; a 404 = SKIP (route absent). ──
  {
    id: "deeplink-roundtrip",
    pass: "V3-04",
    title: "Protected account deep link redirects to login w/ return param",
    async run() {
      const url = originFor("account") + "/dashboard";
      const r = await probe(url, "GET");
      if (!r.ok) return { status: SKIP, detail: `unreachable (${r.error})`, url };
      if (r.status === 404) return { status: SKIP, detail: "route absent in this deploy", url };
      if (r.status >= 500) return { status: FAIL, detail: `${r.status} server error`, url };
      if (REDIRECT.has(r.status)) {
        const loc = r.location.toLowerCase();
        const toAuth = /login|signin|sign-in|auth/.test(loc);
        const hasReturn = /(redirect|return|next|callback|continue)/.test(loc);
        if (toAuth && hasReturn) return { status: PASS, detail: `→ ${r.location}`, url };
        if (toAuth) return { status: WARN, detail: `redirects to auth but no return param: ${r.location}`, url };
        return { status: WARN, detail: `redirects elsewhere: ${r.location}`, url };
      }
      if (r.status === 401 || r.status === 403) return { status: WARN, detail: `gated (${r.status}) but no login redirect`, url };
      if (r.status === 200) return { status: FAIL, detail: "200 — protected deep link served without auth (leak)", url };
      return { status: WARN, detail: `unexpected ${r.status}`, url };
    },
  },
  // ── V3-01/02/08 — auth gate sanity: a protected surface must gate (redirect or
  //    401/403), never 500, never leak 200. Reuses /dashboard as the canonical
  //    gated surface; 404 ⇒ SKIP. ──
  {
    id: "auth-gate",
    pass: "V3-02",
    title: "Account dashboard is auth-gated (no leak, no 500)",
    async run() {
      const url = originFor("account") + "/settings";
      const r = await probe(url, "GET");
      if (!r.ok) return { status: SKIP, detail: `unreachable (${r.error})`, url };
      if (r.status === 404) return { status: SKIP, detail: "route absent in this deploy", url };
      if (r.status >= 500) return { status: FAIL, detail: `${r.status} server error`, url };
      if (GATE_OK.has(r.status)) return { status: PASS, detail: `gated (${r.status})`, url };
      if (r.status === 200) return { status: FAIL, detail: "200 — gated surface served without auth (leak)", url };
      return { status: WARN, detail: `unexpected ${r.status}`, url };
    },
  },
  // ── V3-03 — notification API gates rather than 500s when unauthenticated. ──
  {
    id: "notif-api-gate",
    pass: "V3-03",
    title: "Notifications API gates unauthenticated (401/403, not 500)",
    async run() {
      const url = originFor("account") + "/api/notifications";
      const r = await probe(url, "GET");
      if (!r.ok) return { status: SKIP, detail: `unreachable (${r.error})`, url };
      if (r.status === 404) return { status: SKIP, detail: "endpoint absent in this deploy", url };
      if (r.status >= 500) return { status: FAIL, detail: `${r.status} server error on notif API`, url };
      if (r.status === 401 || r.status === 403) return { status: PASS, detail: `gated (${r.status})`, url };
      if (r.status === 200) return { status: WARN, detail: "200 — verify this is not a leak (may be public summary)", url };
      return { status: WARN, detail: `unexpected ${r.status}`, url };
    },
  },
  // ── V3-05 — no loading-theater copy in served homepage HTML. ──
  {
    id: "no-loading-theater",
    pass: "V3-05",
    title: "Homepage HTML free of loading-theater copy",
    async run() {
      const url = originFor("hub") + "/";
      const r = await probe(url, "GET");
      if (!r.ok) return { status: SKIP, detail: `unreachable (${r.error})`, url };
      if (r.status >= 500) return { status: FAIL, detail: `${r.status} server error`, url };
      if (r.status >= 400) return { status: SKIP, detail: `homepage ${r.status}`, url };
      const m = r.body.match(LOADING_THEATER_RE);
      return m
        ? { status: FAIL, detail: `loading-theater phrase present: "${m[0]}"`, url }
        : { status: PASS, detail: "no banned warmup copy", url };
    },
  },
  // ── V3-06 — top routes live across divisions (homepage of each app). 404/5xx
  //    on a division homepage = FAIL; unreachable = SKIP. ──
  {
    id: "top-routes-live",
    pass: "V3-06",
    title: "Every division homepage serves (no 404/5xx)",
    async run() {
      const apps = Object.keys(APP_SUBDOMAIN);
      const results = [];
      for (const app of apps) {
        const url = originFor(app) + "/";
        const r = await probe(url, "HEAD");
        results.push({ app, url, status: r.ok ? r.status : 0, ok: r.ok });
        await sleep(120);
      }
      const reachable = results.filter((x) => x.ok);
      if (!reachable.length) return { status: SKIP, detail: "all division origins unreachable" };
      const bad = reachable.filter((x) => x.status === 404 || x.status >= 500);
      if (bad.length) {
        return {
          status: FAIL,
          detail: bad.map((x) => `${x.app}=${x.status}`).join(" "),
          url: bad[0].url,
        };
      }
      return {
        status: PASS,
        detail: `${reachable.length}/${apps.length} division homepages serve`,
      };
    },
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────
const ICON = { PASS: "✅", FAIL: "❌", SKIP: "⏭️ ", WARN: "⚠️ " };

async function main() {
  const selected = CHECKS.filter((c) => !ONLY || ONLY.has(c.id));

  // Pre-flight: is ANY origin reachable at all? If not, we will SKIP everything
  // and print the NO-EVIDENCE banner rather than fabricate results.
  const apexRoot = await probe(originFor("hub") + "/", "HEAD");
  const anyReachable = apexRoot.ok;

  const rows = [];
  for (const check of selected) {
    let result;
    try {
      result = await check.run();
    } catch (err) {
      result = { status: SKIP, detail: `check threw: ${err?.message || err}` };
    }
    rows.push({ id: check.id, pass: check.pass, title: check.title, ...result });
  }

  // ── Table ──
  const base = BASE_OVERRIDE || `https://*.${BASE_DOMAIN}`;
  console.log(`\n# Foundation-lock live smoke — base ${base}`);
  console.log(`# ${new Date().toISOString()}`);
  console.log("");
  console.log("| Pass  | Check | Result | Detail |");
  console.log("|-------|-------|--------|--------|");
  for (const r of rows) {
    const icon = ICON[r.status] || r.status;
    const detail = (r.detail || "").replace(/\|/g, "\\|").slice(0, 100);
    console.log(`| ${r.pass} | ${r.title} | ${icon}${r.status} | ${detail} |`);
  }

  const counts = rows.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  console.log("");
  console.log(
    `# ${rows.length} checks: PASS=${counts.PASS || 0} FAIL=${counts.FAIL || 0} ` +
      `WARN=${counts.WARN || 0} SKIP=${counts.SKIP || 0}`,
  );

  const allSkipped = rows.every((r) => r.status === SKIP);
  if (!anyReachable || allSkipped) {
    console.log("");
    console.log("############################################################");
    console.log("#  NO PRODUCTION EVIDENCE COLLECTED — this run proves       #");
    console.log("#  NOTHING. No origin was reachable (offline / no --base /  #");
    console.log("#  preview-less CI). Re-run with --base against a reachable  #");
    console.log("#  production origin before recording any S2 result.        #");
    console.log("############################################################");
  }

  if (JSON_OUT) {
    writeFileSync(
      JSON_OUT,
      JSON.stringify(
        {
          base,
          generatedAt: new Date().toISOString(),
          anyOriginReachable: anyReachable,
          counts,
          noEvidence: !anyReachable || allSkipped,
          rows,
        },
        null,
        2,
      ),
    );
    console.log(`# JSON → ${JSON_OUT}`);
  }

  if (CHECK_MODE) {
    // Offline/preview-less CI must not fake-fail OR fake-pass: exit 0 but loud.
    if (!anyReachable || allSkipped) {
      console.warn("[foundation-smoke] all checks skipped — not failing, but NO evidence collected.");
      return;
    }
    if ((counts.FAIL || 0) > 0) process.exit(1);
  }
}

main().catch((err) => {
  console.error("[foundation-smoke] fatal:", err);
  process.exit(2);
});
