// Headless runner for the V3-18 render proof. `@henryco/branded-documents/render`
// does `import "server-only"`, whose package throws-on-import under plain Node (it is
// a bundler-only guard). tsx loads the workspace `.ts` as CommonJS, so that becomes a
// `require("server-only")`. We shim BOTH module systems to an empty module BEFORE the
// proof's import graph loads, then run the proof (which calls process.exit(0|1)). This
// is test-harness-only and changes no runtime behaviour — the guard still works in the
// Next.js bundle.
import Module, { register } from "node:module";

const SHIMMED = new Set(["server-only", "client-only"]);

// CommonJS side (tsx-transpiled workspace .ts) — the path that actually fires here.
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (SHIMMED.has(request)) return {};
  return originalLoad.call(this, request, parent, isMain);
};

// ESM side — belt-and-suspenders for any module loaded as ESM.
register("./_proof-resolve-hooks.mjs", import.meta.url);

await import("./prove-receipts.mts");
