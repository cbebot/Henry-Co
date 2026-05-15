#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/i18n-check.mjs
//
// Aggregate i18n gate for CI. Wraps the three audits:
//
//   1. scripts/i18n-audit-locale-coverage.mjs — fails when any locale has
//      `actionableEqual > 0` or `missing > 0` in any module. Intentional
//      echoes (allow-listed in scripts/i18n-intentional-echos.mjs) are
//      already subtracted from `actionableEqual` and do not trip the gate.
//   2. scripts/i18n-extra-labels-audit.mjs — fails when any locale has
//      `missing > 0` against the union of all EXTRA_SURFACE_LABELS_* maps.
//   3. scripts/i18n-audit-visible-strings.mjs — fails when the total
//      findings count exceeds the floor at
//      docs/closure/i18n-visible-strings.baseline.json. Subsequent passes
//      must DECREASE this number; the conductor regenerates the floor at
//      closure.
//
// Usage:
//   pnpm i18n:check                # human-readable; non-zero on failure
//   pnpm i18n:check -- --json      # JSON for CI parsing
//
// Each individual check has a dedicated npm script too:
//   pnpm i18n:check:locale
//   pnpm i18n:check:extra-labels
//   pnpm i18n:check:visible-strings
// ---------------------------------------------------------------------------

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const JSON_FLAG = process.argv.includes("--json");

const VISIBLE_STRINGS_BASELINE = path.join(
  ROOT,
  "docs",
  "closure",
  "i18n-visible-strings.baseline.json",
);

function runNode(scriptRelPath, args = [], opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, scriptRelPath), ...args], {
      cwd: ROOT,
      env: opts.env ? { ...process.env, ...opts.env } : process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b) => {
      stdout += b.toString("utf8");
    });
    child.stderr.on("data", (b) => {
      stderr += b.toString("utf8");
    });
    child.on("error", (err) => {
      resolve({ code: 1, stdout, stderr: stderr + String(err) });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

// Resolve the local tsx binary (devDependency); fall back to `tsx` on PATH.
function resolveTsxBin() {
  const candidates = [
    path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs"),
    path.join(ROOT, "node_modules", ".bin", "tsx"),
    path.join(ROOT, "node_modules", ".bin", "tsx.cmd"),
  ];
  return candidates;
}

function runViaTsx(scriptRelPath, args = []) {
  return new Promise((resolve) => {
    const candidates = resolveTsxBin();
    const tsxCliMjs = candidates[0];
    // Preferred: node ./node_modules/tsx/dist/cli.mjs <script>
    const argv = [tsxCliMjs, path.join(ROOT, scriptRelPath), ...args];
    const child = spawn(process.execPath, argv, {
      cwd: ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b) => {
      stdout += b.toString("utf8");
    });
    child.stderr.on("data", (b) => {
      stderr += b.toString("utf8");
    });
    child.on("error", (err) => {
      resolve({ code: 1, stdout, stderr: stderr + String(err) });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

function parseJsonSafely(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// ── Check 1: locale coverage ───────────────────────────────────────────────

async function checkLocaleCoverage() {
  // The audit loads .ts copy modules; tsx must be the runner.
  const { code, stdout, stderr } = await runViaTsx("scripts/i18n-audit-locale-coverage.mjs");
  if (code !== 0) {
    return {
      name: "locale-coverage",
      ok: false,
      reason: "audit script exited non-zero",
      details: { code, stderr: stderr.trim().slice(0, 4000) },
      remediation:
        "Run `pnpm i18n:check:locale` locally; the audit must load every *-copy.ts via tsx/Node ESM. Ensure scripts/i18n-audit-locale-coverage.mjs runs through `pnpm exec tsx`.",
    };
  }
  const report = parseJsonSafely(stdout);
  if (!report || typeof report !== "object" || !report.modules) {
    return {
      name: "locale-coverage",
      ok: false,
      reason: "audit output not parseable as JSON",
      details: { stdoutPreview: stdout.slice(0, 4000) },
      remediation:
        "Run `pnpm i18n:check:locale` locally and inspect output. The aggregate gate expects a JSON report on stdout.",
    };
  }
  const failures = [];
  for (const [moduleLabel, byLocale] of Object.entries(report.modules)) {
    for (const [locale, r] of Object.entries(byLocale)) {
      if (locale === "en") continue;
      const actionable = (r?.actionableEqual ?? 0) + (r?.missing ?? 0);
      if (actionable > 0) {
        failures.push({
          module: moduleLabel,
          locale,
          actionableEqual: r.actionableEqual ?? 0,
          missing: r.missing ?? 0,
          sampleEqualPaths: r.sampleEqualPaths ?? [],
          sampleMissingPaths: r.sampleMissingPaths ?? [],
        });
      }
    }
  }
  if (failures.length > 0) {
    return {
      name: "locale-coverage",
      ok: false,
      reason: "one or more locales fall through to EN unintentionally or have missing keys",
      details: { failures: failures.slice(0, 60), totalFailures: failures.length },
      remediation:
        "Either translate the listed keys in the locale's section of the *-copy.ts module, or, if the EN echo is intentional, add the dotted path to scripts/i18n-intentional-echos.mjs with a one-line reason.",
    };
  }
  return { name: "locale-coverage", ok: true, summary: "All 12 locales fully covered across every copy module." };
}

// ── Check 2: extra labels ──────────────────────────────────────────────────

async function checkExtraLabels() {
  // surface-extra-labels.ts is TypeScript — the audit must run under tsx.
  const { code, stdout, stderr } = await runViaTsx("scripts/i18n-extra-labels-audit.mjs");
  if (code !== 0) {
    return {
      name: "extra-labels",
      ok: false,
      reason: "audit script exited non-zero",
      details: { code, stderr: stderr.trim().slice(0, 4000) },
      remediation:
        "Run `pnpm i18n:check:extra-labels` locally. Ensure packages/i18n/src/surface-extra-labels.ts exports an EXTRA_SURFACE_LABELS_<LOC> map for every non-EN locale.",
    };
  }
  // The extra-labels audit prints a human table; parse for missing > 0 rows.
  // Header reads: "Locale | Have | Missing | Echo-EN"
  const lines = stdout.split(/\r?\n/);
  const dataLineRe = /^([a-z]{2})\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*$/;
  const failures = [];
  for (const line of lines) {
    const match = line.trim().match(dataLineRe);
    if (!match) continue;
    const [, locale, have, missing, echo] = match;
    if (Number(missing) > 0) {
      failures.push({ locale, have: Number(have), missing: Number(missing), echoEn: Number(echo) });
    }
  }
  if (failures.length > 0) {
    return {
      name: "extra-labels",
      ok: false,
      reason: "one or more locales are missing extra-surface-label entries",
      details: { failures },
      remediation:
        "Populate the missing keys in packages/i18n/src/surface-extra-labels.ts (EXTRA_SURFACE_LABELS_<LOC>). Sample missing keys are printed below the table by the audit script.",
    };
  }
  return { name: "extra-labels", ok: true, summary: "All locales have full extra-surface-label coverage." };
}

// ── Check 3: visible strings (baseline-relative) ──────────────────────────

async function checkVisibleStrings() {
  const [baselineRaw, scanDefault, scanHubStaff] = await Promise.all([
    fs.readFile(VISIBLE_STRINGS_BASELINE, "utf8").catch(() => null),
    runNode("scripts/i18n-audit-visible-strings.mjs"),
    runNode("scripts/i18n-audit-visible-strings.mjs", ["apps/hub", "apps/staff"]),
  ]);
  if (!baselineRaw) {
    return {
      name: "visible-strings",
      ok: false,
      reason: "baseline file missing",
      details: { path: path.relative(ROOT, VISIBLE_STRINGS_BASELINE) },
      remediation:
        "Capture the current floor with `node scripts/i18n-audit-visible-strings.mjs` (combined with hub+staff), aggregate findings, and write to docs/closure/i18n-visible-strings.baseline.json.",
    };
  }
  if (scanDefault.code !== 0 || scanHubStaff.code !== 0) {
    return {
      name: "visible-strings",
      ok: false,
      reason: "visible-strings audit failed",
      details: {
        defaultCode: scanDefault.code,
        defaultStderr: scanDefault.stderr.slice(0, 2000),
        hubStaffCode: scanHubStaff.code,
        hubStaffStderr: scanHubStaff.stderr.slice(0, 2000),
      },
      remediation:
        "Run `pnpm i18n:check:visible-strings` and inspect stderr. The audit walks .ts/.tsx under the workspace and should not error.",
    };
  }
  const j1 = parseJsonSafely(scanDefault.stdout);
  const j2 = parseJsonSafely(scanHubStaff.stdout);
  if (!j1 || !j2) {
    return {
      name: "visible-strings",
      ok: false,
      reason: "visible-strings audit output not parseable",
      details: { defaultPreview: scanDefault.stdout.slice(0, 1500), hubStaffPreview: scanHubStaff.stdout.slice(0, 1500) },
      remediation: "Run `pnpm i18n:check:visible-strings` locally and inspect.",
    };
  }
  const baseline = parseJsonSafely(baselineRaw);
  if (!baseline || typeof baseline.totalFindings !== "number") {
    return {
      name: "visible-strings",
      ok: false,
      reason: "baseline file malformed",
      details: { preview: baselineRaw.slice(0, 1500) },
      remediation:
        "Restore docs/closure/i18n-visible-strings.baseline.json to a JSON object with a numeric `totalFindings`.",
    };
  }
  const seen = new Map();
  for (const f of [...j1.files, ...j2.files]) {
    const norm = f.file.replace(/\\/g, "/");
    if (!seen.has(norm)) seen.set(norm, f.findings.length);
  }
  let total = 0;
  const byApp = {};
  for (const [file, n] of seen) {
    const parts = file.split("/");
    const app = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    byApp[app] = (byApp[app] || 0) + n;
    total += n;
  }
  const baselineTotal = baseline.totalFindings;
  if (total > baselineTotal) {
    const regressedApps = [];
    for (const [app, count] of Object.entries(byApp)) {
      const baseCount = baseline.byApp?.[app] ?? 0;
      if (count > baseCount) regressedApps.push({ app, baseline: baseCount, current: count, delta: count - baseCount });
    }
    return {
      name: "visible-strings",
      ok: false,
      reason: `visible-strings count regressed: ${total} > baseline ${baselineTotal}`,
      details: {
        current: total,
        baseline: baselineTotal,
        delta: total - baselineTotal,
        fileCount: seen.size,
        regressedApps,
      },
      remediation:
        "Either translate the newly introduced hardcoded strings (Pattern A copy modules or Pattern B translateSurfaceLabel) or, if your changes legitimately raised the floor, regenerate the baseline at docs/closure/i18n-visible-strings.baseline.json after coordinating with the conductor.",
    };
  }
  return {
    name: "visible-strings",
    ok: true,
    summary: `visible-strings total ${total} ≤ baseline ${baselineTotal} (${total === baselineTotal ? "flat" : `−${baselineTotal - total}`} across ${seen.size} files).`,
  };
}

// ── Driver ─────────────────────────────────────────────────────────────────

async function main() {
  const results = [];
  // Run sequentially so output reads cleanly; each check is independent.
  results.push(await checkLocaleCoverage());
  results.push(await checkExtraLabels());
  results.push(await checkVisibleStrings());

  const ok = results.every((r) => r.ok);

  if (JSON_FLAG) {
    process.stdout.write(
      `${JSON.stringify(
        { ok, generatedAt: new Date().toISOString(), checks: results },
        null,
        2,
      )}\n`,
    );
    process.exit(ok ? 0 : 1);
  }

  for (const r of results) {
    if (r.ok) {
      console.log(`[PASS] ${r.name}: ${r.summary}`);
    } else {
      console.log(`[FAIL] ${r.name}: ${r.reason}`);
      console.log(`       hint: ${r.remediation}`);
      const failures = r.details?.failures;
      if (Array.isArray(failures) && failures.length > 0) {
        const head = failures.slice(0, 8);
        for (const f of head) {
          if (f.module && f.locale) {
            console.log(`         • ${f.module}/${f.locale}: actionableEqual=${f.actionableEqual}, missing=${f.missing}`);
          } else if (f.locale) {
            console.log(`         • ${f.locale}: missing=${f.missing}`);
          }
        }
        if (failures.length > head.length) {
          console.log(`         ...and ${failures.length - head.length} more`);
        }
      }
      const regressedApps = r.details?.regressedApps;
      if (Array.isArray(regressedApps) && regressedApps.length > 0) {
        console.log(`         regressed apps:`);
        for (const a of regressedApps) {
          console.log(`         • ${a.app}: ${a.baseline} → ${a.current} (+${a.delta})`);
        }
      }
    }
  }
  console.log("");
  console.log(ok ? "i18n:check OK" : "i18n:check FAILED");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
