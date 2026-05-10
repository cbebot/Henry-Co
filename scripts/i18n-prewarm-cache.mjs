#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/i18n-prewarm-cache.mjs
//
// Walk every leaf string in each *-copy module's EN baseline and ensure every
// supported target locale has a cached translation in
// public.i18n_translation_cache. Misses are filled via DeepL.
//
// Idempotent: existing cache rows are skipped. Safe to re-run.
//
// Required env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   DEEPL_API_KEY  (optional — without it the script only reports cache state
//                   and does NOT call DeepL)
//
// Usage:
//   pnpm exec tsx scripts/i18n-prewarm-cache.mjs               # all locales
//   pnpm exec tsx scripts/i18n-prewarm-cache.mjs fr de         # specific locales
//   pnpm exec tsx scripts/i18n-prewarm-cache.mjs --dry-run     # report only
// ---------------------------------------------------------------------------

import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "packages", "i18n", "src");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const localeArgs = args.filter((a) => !a.startsWith("--"));

// DeepL-supported locales only (ig/yo/ha/hi will skip — DeepL doesn't translate them)
const DEEPL_LOCALES = ["fr", "es", "pt", "ar", "de", "it", "zh"];
const TARGETS = localeArgs.length ? localeArgs : DEEPL_LOCALES;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_KEY = process.env.DEEPL_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(2);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MODULES = [
  ["surface-copy.ts", "getSurfaceCopy", "surface"],
  ["account-copy.ts", "getAccountCopy", "account"],
  ["hub-home-copy.ts", "getHubHomeCopy", "hubHome"],
  ["marketplace-copy.ts", "getMarketplaceCopy", "marketplace"],
  ["jobs-copy.ts", "getJobsCopy", "jobs"],
  ["care-copy.ts", "getCareCopy", "care"],
  ["auth-copy.ts", "getAuthCopy", "auth"],
  ["consent-copy.ts", "getConsentCopy", "consent"],
  ["state-copy.ts", "getStateCopy", "state"],
];

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function collectLeafStrings(node, out = new Set()) {
  if (typeof node === "string") {
    if (node.trim() && /[A-Za-z]/.test(node)) out.add(node);
  } else if (Array.isArray(node)) {
    for (const x of node) collectLeafStrings(x, out);
  } else if (isPlainObject(node)) {
    for (const v of Object.values(node)) collectLeafStrings(v, out);
  }
  return out;
}

async function getCachedSet(targetLocale, sources) {
  if (!sources.length) return new Set();
  const found = new Set();
  // Page through to avoid PostgREST URI length limits
  const PAGE = 500;
  for (let i = 0; i < sources.length; i += PAGE) {
    const slice = sources.slice(i, i + PAGE);
    const { data, error } = await sb
      .from("i18n_translation_cache")
      .select("source_text")
      .in("source_text", slice)
      .eq("source_locale", "en")
      .eq("target_locale", targetLocale);
    if (error) {
      console.warn(`[prewarm] cache read error for ${targetLocale}:`, error.message);
      continue;
    }
    for (const row of data ?? []) found.add(row.source_text);
  }
  return found;
}

async function deepLBatch(texts, targetLocale) {
  if (!DEEPL_KEY || !texts.length) return texts.map(() => null);
  const TARGET_MAP = {
    fr: "FR",
    es: "ES",
    pt: "PT-BR",
    ar: "AR",
    de: "DE",
    it: "IT",
    zh: "ZH",
  };
  const target = TARGET_MAP[targetLocale];
  if (!target) return texts.map(() => null);

  // DeepL supports batched text[] up to 50 per request reliably
  const BATCH = 50;
  const out = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: slice,
        target_lang: target,
        source_lang: "EN",
        tag_handling: "html",
        preserve_formatting: true,
      }),
    });
    if (!res.ok) {
      console.warn(`[prewarm] DeepL ${res.status} for ${targetLocale}`);
      out.push(...slice.map(() => null));
      continue;
    }
    const json = await res.json();
    const list = json?.translations ?? [];
    for (let k = 0; k < slice.length; k += 1) {
      out.push(list[k]?.text ?? null);
    }
  }
  return out;
}

async function upsertBatch(rows) {
  if (!rows.length) return;
  const PAGE = 200;
  for (let i = 0; i < rows.length; i += PAGE) {
    const slice = rows.slice(i, i + PAGE);
    const { error } = await sb
      .from("i18n_translation_cache")
      .upsert(slice, { onConflict: "source_text,source_locale,target_locale" });
    if (error) {
      console.warn(`[prewarm] upsert error:`, error.message);
    }
  }
}

async function main() {
  const universe = new Set();
  for (const [file, getter] of MODULES) {
    const mod = await import(pathToFileURL(path.join(SRC, file)).href);
    const fn = mod[getter];
    if (typeof fn !== "function") continue;
    const en = fn("en");
    collectLeafStrings(en, universe);
  }

  const all = [...universe];
  console.log(`Universe: ${all.length} unique EN strings across ${MODULES.length} modules`);
  console.log(`Targets: ${TARGETS.join(", ")}`);
  console.log(`DeepL: ${DEEPL_KEY ? "ENABLED" : "DISABLED (DEEPL_API_KEY missing — cache reporting only)"}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log("");

  for (const locale of TARGETS) {
    const cached = await getCachedSet(locale, all);
    const misses = all.filter((t) => !cached.has(t));
    console.log(`[${locale}] cached: ${cached.size}/${all.length}  misses: ${misses.length}`);
    if (dryRun || !DEEPL_KEY || misses.length === 0) continue;

    const translated = await deepLBatch(misses, locale);
    const rows = [];
    for (let i = 0; i < misses.length; i += 1) {
      if (translated[i]) {
        rows.push({
          source_text: misses[i],
          source_locale: "en",
          target_locale: locale,
          translated_text: translated[i],
          source: "deepl",
        });
      }
    }
    await upsertBatch(rows);
    console.log(`[${locale}] cached ${rows.length} new translations`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
