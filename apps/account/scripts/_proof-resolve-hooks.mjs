// Module-resolution hooks for the headless V3-18 render proof.
//
// `@henryco/branded-documents/render` is `import "server-only"` — the Vercel
// `server-only` package resolves to a THROWING module under plain Node (and to an
// empty module only under the bundler's `react-server` condition). The proof renders
// real PDFs via the same server render path, so under tsx/Node we shim `server-only`
// (and its `client-only` sibling) to an empty module. This is test-harness-only and
// changes no runtime behaviour — the guard still works in the Next.js bundle.
const SHIMMED = new Set(["server-only", "client-only"]);

export async function resolve(specifier, context, nextResolve) {
  if (SHIMMED.has(specifier)) {
    return { url: "data:text/javascript,", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
