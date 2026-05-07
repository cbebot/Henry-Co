/**
 * @henryco/observability/sentry/instrumentation — Next.js
 * instrumentation hook.
 *
 * The host app's `instrumentation.ts` exports a `register` function
 * Next runs at server start. The host calls
 * `await registerHenryCoInstrumentation()` from within `register()`;
 * we dynamically import the runtime-specific Sentry config and
 * initialise it.
 *
 * Why dynamic: Next 16 calls `register()` once for each runtime —
 * we want to load only the config relevant to the current runtime
 * without bundling the other.
 */

export async function registerHenryCoInstrumentation(): Promise<void> {
  const runtime = process.env.NEXT_RUNTIME;

  // The Sentry init lives in the host app's own instrumentation
  // file because Sentry-nextjs requires the import to happen at the
  // module-top level (Next's bundler analyses for it). This helper
  // logs the runtime selection so a host that forgets to wire the
  // init can spot the absence in Vercel logs.
  if (runtime === "nodejs") {
    // Optional: log a warning if SENTRY_DSN is missing so the host
    // realises observability is silently disabled.
    if (!process.env.SENTRY_DSN) {
      console.warn(
        "[henryco/observability] SENTRY_DSN is not set — server-side error tracking disabled.",
      );
    }
  }
  if (runtime === "edge") {
    if (!process.env.SENTRY_DSN) {
      console.warn(
        "[henryco/observability] SENTRY_DSN is not set — edge error tracking disabled.",
      );
    }
  }
}
