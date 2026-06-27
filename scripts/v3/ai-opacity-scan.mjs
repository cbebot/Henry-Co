#!/usr/bin/env node
// V3-AI-01 — provider/model opacity scan (the CI "no provider id / real model name in any
// client bundle" check). The governed gateway's hard rule: the provider/source and the
// concrete Claude model name are SERVER-ONLY. They may appear only behind
// `@henryco/ai-gateway`'s `./server` boundary (which carries `import "server-only"` and is
// excluded from every client bundle by the exports map). Anywhere else — the client-safe
// barrel, the pure modules, any app client component — is a leak.
//
// Exits non-zero on any violation. Run from the repo root.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SERVER_BOUNDARY = join("packages", "ai-gateway", "src", "server");

// The dangerous tokens: concrete model ids + the provider SDK import. (The bare word
// "anthropic" appears legitimately in doc comments and as a redaction KEY NAME — those are
// not leaks, so we scan for the model ids and the SDK import specifically.)
const MODEL_ID = /claude-(?:haiku|sonnet|opus|fable|mythos)-[0-9]/;
const SDK_IMPORT = /from\s+["']@anthropic-ai\/sdk["']|require\(\s*["']@anthropic-ai\/sdk["']\s*\)/;

// Scope: the V3-AI-01 surface — the governed gateway + the marketplace AI surface it
// powers. (apps/studio's three pre-existing inline `new Anthropic(...)` server actions are
// the documented Pass-2 gateway-migration target — server-side `"use server"`, not a client
// leak — and are out of this pass's scope.)
const SCAN_ROOTS = ["packages/ai-gateway", "apps/marketplace"];
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".turbo", "coverage", ".git"]);
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const violations = [];

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else if (CODE_EXT.test(name)) {
      scanFile(full);
    }
  }
}

function scanFile(full) {
  const rel = relative(ROOT, full);
  const relPosix = rel.split(sep).join("/");
  // Files behind the gateway's server-only boundary are allowed to name the model + SDK.
  if (relPosix.includes("packages/ai-gateway/src/server/")) return;
  // Test files assert opacity using a fake model id — not shipped client code.
  if (/__tests__|\.test\.|\.spec\./.test(rel)) return;
  const text = readFileSync(full, "utf8");
  // A leak requires the token to reach a CLIENT bundle. Server-only modules and Next
  // `"use server"` actions never ship to the client — skip them. (Anything that names a
  // model/SDK without one of these markers IS client-reachable and a real leak.)
  const head = text.slice(0, 600);
  const serverMarked = /^\s*(?:"use server"|'use server')/.test(head) || /import\s+["']server-only["']/.test(head);
  if (serverMarked) return;
  if (MODEL_ID.test(text)) violations.push(`${rel}: concrete Claude model id in a client-reachable file`);
  if (SDK_IMPORT.test(text)) violations.push(`${rel}: imports @anthropic-ai/sdk in a client-reachable file`);
}

for (const r of SCAN_ROOTS) walk(join(ROOT, r));

if (violations.length) {
  console.error("AI opacity scan FAILED — provider/model leaked outside the server boundary:");
  for (const v of violations) console.error("  • " + v);
  process.exit(1);
}
console.log(`AI opacity scan: OK — no Claude model id or @anthropic-ai/sdk import outside ${SERVER_BOUNDARY.split(sep).join("/")}`);
