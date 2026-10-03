#!/usr/bin/env node
/**
 * COPY-RESET — measure visible words per public route (Playwright).
 *
 * Usage:
 *   node scripts/copy-audit/measure.mjs --domain care --base http://localhost:4102 \
 *     --out docs/copy-audit/before/care.json [--screens DIR] [--aria DIR] \
 *     [--channel chrome] [--only /,/about] [--sha <git sha>]
 *
 * Each route is rendered at desktop (1440×900) and mobile (390×844), signed out,
 * English, reduced motion (so reveal-on-scroll content is painted), after a
 * scroll-through. Counts come from extract-visible.mjs.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { DOMAINS, BUDGETS, budgetFor } from "./config.mjs";
import { extractVisible } from "./extract-visible.mjs";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const domainName = arg("--domain");
const base = (arg("--base") || "").replace(/\/$/, "");
const outPath = arg("--out");
const screensDir = arg("--screens");
const ariaDir = arg("--aria");
const channel = arg("--channel");
const only = arg("--only") ? new Set(arg("--only").split(",")) : null;
const sha = arg("--sha");

const domain = DOMAINS.find((d) => d.domain === domainName);
if (!domain || !base || !outPath) {
  console.error("usage: measure.mjs --domain <name> --base <url> --out <file.json>");
  process.exit(2);
}

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

const slugOf = (p) => (p === "/" ? "root" : p.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "_"));

async function newContext(browser, kind) {
  const ctx = await browser.newContext({
    ...VIEWPORTS[kind],
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "en-GB",
  });
  const host = new URL(base).hostname;
  await ctx.addCookies([{ name: "henryco_locale", value: "en", domain: host, path: "/" }]);
  return ctx;
}

async function render(page, url) {
  let response = null;
  try {
    response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  } catch (err) {
    return { error: String(err.message || err).slice(0, 300) };
  }
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
  return { status: response ? response.status() : null, finalUrl: page.url() };
}

const browser = await chromium.launch(channel ? { channel } : {});
const contexts = {
  desktop: await newContext(browser, "desktop"),
  mobile: await newContext(browser, "mobile"),
};
const pages = { desktop: await contexts.desktop.newPage(), mobile: await contexts.mobile.newPage() };

const resolved = new Map(); // manifest path -> concrete sample path
const linksByPath = new Map(); // concrete path -> same-origin links (desktop)
const results = [];

async function linksFor(fromPath) {
  const concrete = fromPath.startsWith("@") ? resolved.get(fromPath.slice(1)) : fromPath;
  if (!concrete) return [];
  if (linksByPath.has(concrete)) return linksByPath.get(concrete);
  const r = await render(pages.desktop, base + concrete);
  if (r.error) return [];
  const data = await pages.desktop.evaluate(extractVisible, { collectLinks: true });
  linksByPath.set(concrete, data.links);
  return data.links;
}

for (const route of domain.routes) {
  if (only && !only.has(route.path)) continue;
  let concrete = route.path;
  if (route.discover) {
    const links = await linksFor(route.discover.from);
    const re = new RegExp(route.discover.match);
    concrete = links.find((l) => re.test(l)) || null;
    if (!concrete) {
      results.push({ path: route.path, type: route.type, budget: budgetFor(route.type), status: "no-sample", data: Boolean(route.data) });
      console.log(`[measure] ${domain.domain} ${route.path} → no-sample`);
      continue;
    }
    resolved.set(route.path, concrete);
  }

  const entry = { path: route.path, sample: route.discover ? concrete : undefined, type: route.type, budget: budgetFor(route.type) };
  for (const kind of ["desktop", "mobile"]) {
    const page = pages[kind];
    const r = await render(page, base + concrete);
    if (r.error) {
      entry[kind] = { error: r.error };
      continue;
    }
    const data = await page.evaluate(extractVisible, { collectLinks: kind === "desktop" });
    if (kind === "desktop") linksByPath.set(concrete, data.links);
    const final = new URL(r.finalUrl);
    entry.status = entry.status ?? r.status;
    if (final.origin !== new URL(base).origin) entry.redirectedTo = r.finalUrl;
    else if (final.pathname !== concrete) entry.redirectedTo = final.pathname;
    entry[kind] = {
      counts: data.counts,
      h1s: data.h1s,
      title: data.title,
      metaDescription: data.metaDescription,
      metaDescriptionChars: data.metaDescriptionChars,
      hasMain: data.hasMain,
      lang: data.lang,
      ...(kind === "desktop"
        ? { headings: data.headings, images: data.images, blocks: data.blocks }
        : { blockCount: data.blocks.length }),
    };
    if (screensDir) {
      const file = join(screensDir, domain.domain, `${slugOf(route.path)}__${kind}.png`);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file, fullPage: true }).catch(() => {});
    }
    if (ariaDir && kind === "desktop") {
      const yaml = await page.locator("body").ariaSnapshot().catch((e) => `# ariaSnapshot failed: ${e.message}`);
      const file = join(ariaDir, domain.domain, `${slugOf(route.path)}.yaml`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, yaml);
    }
  }
  const pick = (k) => Math.max(entry.desktop?.counts?.[k] ?? 0, entry.mobile?.counts?.[k] ?? 0);
  entry.pageWords = pick("page");
  entry.aboveFold = pick("pageAboveFold");
  entry.chromeWords = pick("chrome");
  entry.overlayWords = pick("overlay");
  entry.visibleH1 = (entry.desktop?.h1s || []).filter((h) => h.visible).length;
  console.log(
    `[measure] ${domain.domain} ${route.path}${entry.sample && entry.sample !== route.path ? ` (${entry.sample})` : ""} → ${entry.status} page=${entry.pageWords} fold=${entry.aboveFold} chrome=${entry.chromeWords} h1=${entry.visibleH1}${entry.redirectedTo ? ` ↪ ${entry.redirectedTo}` : ""}`,
  );
  results.push(entry);
}

await browser.close();

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify(
    {
      domain: domain.domain,
      base,
      sha,
      measuredAt: new Date().toISOString(),
      budgets: BUDGETS,
      routes: results,
    },
    null,
    1,
  ),
);
console.log(`[measure] wrote ${outPath} (${results.length} routes)`);
