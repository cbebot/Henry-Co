import "server-only";

/**
 * Server-side diagnostics for owner surfaces. Logs full detail for operators;
 * never surfaces raw errors to the browser.
 */
export function logOwnerSurfaceError(context: string, error: unknown, meta?: Record<string, unknown>) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };
  console.error(
    "[owner-surface]",
    JSON.stringify({
      context,
      ...normalized,
      ...meta,
    }),
  );
}
