// PASS 24 Phase 2 — markdown subset safety baseline.
//
// Static-text snapshot of packages/messaging-thread/src/markdown.tsx.
// The engine renders an opt-in markdown subset inside support thread
// bubbles, so an XSS regression here would punch a hole in every
// surface that opts in (account + studio /support).
//
// Any change that re-introduces dangerouslySetInnerHTML, raw innerHTML
// writes, or weakens the SAFE_PROTOCOL allowlist beyond http(s) +
// mailto must fail CI.
//
// This is intentionally NOT a runtime import — keeping it free of
// TypeScript / JSX loaders means it runs cleanly via `node --test` with
// no extra deps.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = await readFile(
  resolve(__dirname, "..", "src", "markdown.tsx"),
  "utf8",
);

// Strip line + block comments before the safety checks so a phrase like
// "the engine never uses dangerouslySetInnerHTML" in a comment doesn't
// trip a false positive. We only care whether the COMPILED code path
// uses the dangerous escape hatch.
const CODE = SOURCE
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

test("markdown subset does not use dangerouslySetInnerHTML", () => {
  assert.equal(
    CODE.includes("dangerouslySetInnerHTML"),
    false,
    "Found dangerouslySetInnerHTML in source code — the engine must render to React nodes only.",
  );
});

test("markdown subset does not assign raw innerHTML", () => {
  assert.equal(
    /\binnerHTML\s*=/.test(CODE),
    false,
    "Found innerHTML assignment — the engine must render to React nodes only.",
  );
});

test("markdown subset declares an explicit SAFE_PROTOCOL allowlist", () => {
  assert.match(
    SOURCE,
    /const\s+SAFE_PROTOCOL\s*=\s*\/\^/,
    "SAFE_PROTOCOL constant must be declared at module scope.",
  );
});

test("SAFE_PROTOCOL allowlist permits only http(s) and mailto", () => {
  // The exact regex literal — any expansion (eg. adding tel:) must come
  // through this baseline so the change is reviewed deliberately.
  assert.match(
    SOURCE,
    /const\s+SAFE_PROTOCOL\s*=\s*\/\^\(https\?\:\|mailto\:\)\/i;/,
    "SAFE_PROTOCOL regex must match exactly /^(https?:|mailto:)/i.",
  );
});

test("link rendering routes URL through SAFE_PROTOCOL.test before constructing the anchor", () => {
  // Find the link-rendering branch and assert it gates on SAFE_PROTOCOL.
  // The implementation pushes a {kind: "link"} piece only inside the
  // SAFE_PROTOCOL.test(url) branch; an unsafe protocol is downgraded to
  // a plain-text rendering. This assertion guards the gating order.
  assert.match(
    SOURCE,
    /if\s*\(\s*SAFE_PROTOCOL\.test\(url\)\s*\)\s*{\s*pieces\.push\(\s*\{\s*kind:\s*"link"/,
    "Link nodes must only be constructed inside the SAFE_PROTOCOL.test branch.",
  );
});

test("link node sets rel=\"noreferrer noopener\" + target=\"_blank\"", () => {
  // Even though we sanitize the URL, we still want the link to open in
  // a new tab with reverse-tabnabbing protection so opening a customer
  // link from staff context doesn't leak window.opener.
  assert.match(
    SOURCE,
    /target=\{?"_blank"\}?/,
    "Inline links must open in a new tab.",
  );
  assert.match(
    SOURCE,
    /rel=\{?"noreferrer noopener"\}?/,
    "Inline links must set rel=\"noreferrer noopener\".",
  );
});

test("code spans render as <code> elements with a known class", () => {
  // The styled code span uses .mt-md-code which the account light theme
  // overrides for readability. Renaming this class would silently break
  // the light-mode code styling.
  assert.match(
    SOURCE,
    /<code\b[^>]*className="mt-md-code"/,
    "Code spans must carry the mt-md-code class.",
  );
});
