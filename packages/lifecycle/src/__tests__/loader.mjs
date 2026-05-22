/**
 * Node import hook — resolves `server-only` to a no-op so any imports
 * that transitively touch server-only modules work in node:test.
 * Same pattern as packages/auth + packages/rooms.
 */
const NOOP_MODULE_URL =
  "data:text/javascript;base64," + Buffer.from("export {};").toString("base64");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: NOOP_MODULE_URL, shortCircuit: true, format: "module" };
  }
  return nextResolve(specifier, context);
}
