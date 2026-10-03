#!/usr/bin/env node
/**
 * COPY-RESET — strip stale translations after the English source changes.
 *
 * For every typed copy module changed since --base, compare the English object
 * at the base commit with the working tree. Any key whose English text changed
 * (or was removed) is deleted from every locale override in the same family, so
 * that locale falls back to the new English instead of showing a stale
 * translation of the old text. Every stripped key is written to a manifest for
 * re-translation.
 *
 * Containers recognised (same file, same family prefix):
 *   const EN / const FR …              const FOO_EN / const FOO_FR …
 *   function buildEN(locale) { return { … } } / function buildFR …
 * Locale objects typed `Partial<T>` are widened to `DeepPartial<T>` when a
 * nested key is stripped (every getter deep-merges at runtime).
 *
 * English-keyed labels (translateSurfaceLabel and friends) are reported, not
 * edited: a new English label needs dictionary entries in every locale.
 *
 * Usage:
 *   node scripts/copy-audit/i18n-strip.mjs [--base origin/main] [--write]
 *        [--manifest docs/copy-audit/translation-manifest.json]
 * Without --write it only reports (dry run). Exit 1 in --check mode if any
 * locale still carries an override for English text that changed.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";

const require = createRequire(resolve("packages/i18n/package.json"));
const ts = require("typescript");

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const baseRef = arg("--base", "origin/main");
const manifestPath = arg("--manifest", "docs/copy-audit/translation-manifest.json");
const ROOTS = ["packages/i18n/src", "apps", "packages/ui/src", "packages/config"];

const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 1 << 28 });
const base = git("merge-base", "HEAD", baseRef).trim();

const LOCALES = ["FR", "ES", "PT", "AR", "DE", "IT", "ZH", "HI", "IG", "YO", "HA"];
const LOCALE_RE = new RegExp(`^(?:(.*)_|build)?(EN|${LOCALES.join("|")})$`);

function unwrap(n) {
  while (n && (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isSatisfiesExpression?.(n) || ts.isTypeAssertionExpression?.(n))) n = n.expression;
  return n;
}

function containers(sf) {
  const out = [];
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        const m = LOCALE_RE.exec(d.name.text);
        const init = unwrap(d.initializer);
        if (m && init && ts.isObjectLiteralExpression(init)) {
          out.push({ family: m[1] ?? (d.name.text.startsWith("build") ? "build" : ""), code: m[2], obj: init, typeNode: d.type ?? null, name: d.name.text });
        }
      }
    } else if (ts.isFunctionDeclaration(st) && st.name && st.body) {
      const m = LOCALE_RE.exec(st.name.text);
      if (!m) continue;
      const ret = st.body.statements.find((s) => ts.isReturnStatement(s) && s.expression && ts.isObjectLiteralExpression(unwrap(s.expression)));
      if (ret) out.push({ family: m[1] ?? "build", code: m[2], obj: unwrap(ret.expression), typeNode: null, name: st.name.text });
    }
  }
  return out;
}

function keyOf(name, sf) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name) || ts.isPrivateIdentifier?.(name)) return name.text;
  return name.getText(sf);
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

function flatten(obj, sf, prefix = "", out = new Map()) {
  obj.properties.forEach((p, i) => {
    let key;
    let init = null;
    if (ts.isPropertyAssignment(p)) {
      key = keyOf(p.name, sf);
      init = unwrap(p.initializer);
    } else if (ts.isShorthandPropertyAssignment(p)) key = p.name.text;
    else if (ts.isSpreadAssignment(p)) key = `…spread${i}`;
    else key = p.name ? keyOf(p.name, sf) : `…member${i}`;
    const path = prefix ? `${prefix}.${key}` : key;
    if (init && ts.isObjectLiteralExpression(init)) {
      out.set(path, { node: p, isObj: true, obj: init });
      flatten(init, sf, path, out);
    } else {
      out.set(path, { node: p, isObj: false, fp: norm(p.getText(sf).slice(p.getText(sf).indexOf(":") + 1)), text: (init ?? p).getText(sf) });
    }
  });
  return out;
}

function parse(file, src) {
  return ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

// --only a,b,c restricts the run to files whose path starts with one of the
// prefixes, so parallel editors never rewrite each other's files.
const ONLY = arg("--only") ? arg("--only").split(",").map((s) => s.trim()).filter(Boolean) : null;
const changedFiles = git("diff", "--name-only", base, "--", ...ROOTS)
  .split("\n")
  .filter((f) => /\.(ts|tsx)$/.test(f) && existsSync(f))
  .filter((f) => !ONLY || ONLY.some((p) => f.startsWith(p)));

const report = { base, generatedAt: new Date().toISOString(), files: [], labels: { added: [], removed: [] }, totals: {} };
let staleOverrides = 0;

for (const file of changedFiles) {
  const headSrc = readFileSync(file, "utf8");
  let baseSrc = null;
  try {
    baseSrc = git("show", `${base}:${file}`);
  } catch {
    continue; // new file — nothing translated yet
  }
  const headSf = parse(file, headSrc);
  const baseSf = parse(file, baseSrc);
  const headC = containers(headSf);
  const baseC = containers(baseSf);
  const families = new Set(headC.filter((c) => c.code === "EN").map((c) => c.family));
  const deletions = [];
  const widen = new Set();
  const fileReport = { file, families: [] };

  for (const fam of families) {
    const enHead = headC.find((c) => c.family === fam && c.code === "EN");
    const enBase = baseC.find((c) => c.family === fam && c.code === "EN");
    if (!enHead || !enBase) continue;
    const h = flatten(enHead.obj, headSf);
    const b = flatten(enBase.obj, baseSf);
    const changed = [];
    const removed = [];
    for (const [path, bv] of b) {
      const hv = h.get(path);
      if (!hv) removed.push(path);
      else if (bv.isObj !== hv.isObj || (!bv.isObj && bv.fp !== hv.fp)) changed.push(path);
    }
    const added = [...h.keys()].filter((p) => !b.has(p));
    if (!changed.length && !removed.length) continue;
    const touched = new Set([...changed, ...removed]);
    const famReport = { family: fam || "(default)", changed, removed, added, stripped: {}, newEnglish: {} };
    for (const p of changed) {
      const hv = h.get(p);
      if (hv && !hv.isObj) famReport.newEnglish[p] = hv.text;
    }

    const underTouched = (p) => touched.has(p) || [...touched].some((t) => p.startsWith(t + "."));
    const outermost = (list) => list.filter((p) => !list.some((q) => q !== p && p.startsWith(q + ".")));
    for (const loc of headC.filter((c) => c.family === fam && c.code !== "EN")) {
      const lm = flatten(loc.obj, headSf);
      // Already stripped in an earlier --write run: in the base locale, gone now.
      const baseLoc = baseC.find((c) => c.family === fam && c.code === loc.code);
      const already = baseLoc ? outermost([...flatten(baseLoc.obj, baseSf).keys()].filter((p) => underTouched(p) && !lm.has(p))) : [];
      const outer = outermost([...lm.keys()].filter(underTouched));
      if (!outer.length) {
        if (already.length) famReport.stripped[loc.code.toLowerCase()] = already.sort();
        continue;
      }
      const nodes = new Set(outer.map((p) => lm.get(p).node));
      // cascade: an object property left with no surviving children goes too
      let grew = true;
      while (grew) {
        grew = false;
        for (const [p, v] of lm) {
          if (!v.isObj || nodes.has(v.node)) continue;
          const props = v.obj.properties;
          if (props.length && props.every((c) => nodes.has(c))) {
            props.forEach((c) => nodes.delete(c));
            nodes.add(v.node);
            outer.push(p);
            grew = true;
          }
        }
      }
      famReport.stripped[loc.code.toLowerCase()] = outermost([...new Set([...outer, ...already])]).sort();
      staleOverrides += outer.length;
      for (const n of nodes) deletions.push(n);
      if (loc.typeNode && outer.some((p) => p.includes("."))) {
        const t = loc.typeNode.getText(headSf);
        const m = /^Partial<(\w+)>$/.exec(t);
        if (m) widen.add(m[1]);
      }
    }
    fileReport.families.push(famReport);
  }

  if (!fileReport.families.length) continue;
  report.files.push(fileReport);

  if (WRITE && deletions.length) {
    let out = headSrc;
    const ranges = deletions
      .map((n) => {
        let end = n.end;
        while (out[end] === " " || out[end] === "\t") end++;
        if (out[end] === ",") end++;
        return [n.getFullStart(), end];
      })
      .sort((a, b) => b[0] - a[0]);
    for (const [s, e] of ranges) out = out.slice(0, s) + out.slice(e);
    for (const typeName of widen) {
      out = out.replace(new RegExp(`(?<!Deep)Partial<${typeName}>`, "g"), `DeepPartial<${typeName}>`);
      if (!/\bDeepPartial\b[^\n]*from\s+["'][^"']*merge-messages["']/.test(out) && !/import[^;]*\bDeepPartial\b/.test(out)) {
        const imp = /import\s*\{([^}]*)\}\s*from\s*["']\.\/merge-messages["'];?/.exec(out);
        if (imp) out = out.replace(imp[0], imp[0].replace(imp[1], `${imp[1].trim()}, type DeepPartial `));
        else out = `import type { DeepPartial } from "./merge-messages";\n` + out;
      }
    }
    writeFileSync(file, out);
  }
}

// English-keyed labels (Pattern B): report additions/removals for dictionary upkeep.
const LABEL_CALL = /translate[A-Za-z]*Label\(\s*[A-Za-z_.]+\s*,\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
function labelsIn(src) {
  const s = new Set();
  for (const m of src.matchAll(LABEL_CALL)) s.add(m[2]);
  return s;
}
for (const file of changedFiles) {
  let baseSrc = "";
  try {
    baseSrc = git("show", `${base}:${file}`);
  } catch {
    /* new file */
  }
  const a = labelsIn(baseSrc);
  const b = labelsIn(readFileSync(file, "utf8"));
  for (const l of b) if (!a.has(l)) report.labels.added.push({ file, label: l });
  for (const l of a) if (!b.has(l)) report.labels.removed.push({ file, label: l });
}

const uniqueKeys = new Set();
let entries = 0;
for (const f of report.files)
  for (const fam of f.families)
    for (const [loc, paths] of Object.entries(fam.stripped))
      for (const p of paths) {
        uniqueKeys.add(`${f.file}#${fam.family}#${p}`);
        entries++;
        void loc;
      }
report.totals = { filesWithEnglishChanges: report.files.length, keysStripped: uniqueKeys.size, localeEntriesStripped: entries, labelsAdded: report.labels.added.length };

// A scoped (--only) run edits files but never overwrites the shared manifest.
if (!ONLY && (WRITE || !CHECK)) {
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(report, null, 1));
  const md = [
    "# Re-translation manifest",
    "",
    `English changed since \`${base.slice(0, 8)}\`. Each key below was removed from the listed locales, which now show the new English until translated.`,
    "",
    `Totals: ${report.totals.keysStripped} key(s) · ${report.totals.localeEntriesStripped} locale entr(ies) · ${report.labels.added.length} new English-keyed label(s).`,
  ];
  for (const f of report.files) {
    for (const fam of f.families) {
      const keys = new Map();
      for (const [loc, paths] of Object.entries(fam.stripped)) for (const p of paths) keys.set(p, [...(keys.get(p) || []), loc]);
      if (!keys.size) continue;
      md.push("", `## ${f.file}${fam.family !== "(default)" ? ` — ${fam.family}` : ""}`, "", "| key | locales | new English |", "|---|---|---|");
      for (const [p, locs] of [...keys].sort()) {
        const en = fam.newEnglish[p] ? fam.newEnglish[p].replace(/\s+/g, " ").replace(/\|/g, "\\|").slice(0, 160) : fam.removed.includes(p) ? "_(removed)_" : "";
        md.push(`| \`${p}\` | ${locs.join(", ")} | ${en} |`);
      }
    }
  }
  if (report.labels.added.length) {
    md.push("", "## New English-keyed labels (add to each locale's label dictionary)", "", "| label | file |", "|---|---|");
    for (const l of report.labels.added) md.push(`| ${l.label.replace(/\|/g, "\\|")} | ${l.file} |`);
  }
  writeFileSync(manifestPath.replace(/\.json$/, ".md"), md.join("\n") + "\n");
}
console.log(`[i18n-strip] base ${base.slice(0, 8)} · ${report.files.length} module(s) with English changes · ${uniqueKeys.size} key(s) / ${entries} locale entr(ies) ${WRITE ? "stripped" : "to strip"} · ${report.labels.added.length} new English label(s)`);
if (CHECK && staleOverrides > 0) {
  console.error(`[i18n-strip] FAIL — ${staleOverrides} locale override(s) still translate English text that changed. Run with --write.`);
  process.exit(1);
}
