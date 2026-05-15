/**
 * Node import hook — resolves `server-only` to an in-memory no-op so
 * the rooms server actions can be imported in tests without throwing.
 *
 * This is test-only; production code paths in Next.js use Next's
 * vendored `server-only` which is enforced at build time.
 */
const NOOP_MODULE_URL =
  "data:text/javascript;base64," +
  Buffer.from("export {};").toString("base64");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: NOOP_MODULE_URL, shortCircuit: true, format: "module" };
  }
  return nextResolve(specifier, context);
}
