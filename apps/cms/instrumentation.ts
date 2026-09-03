import { buildServerSentryConfig } from "@henryco/observability/sentry/server";

/**
 * Server runtime instrumentation. Sentry no-ops when SENTRY_DSN is absent, so
 * this is safe in every environment; PII redaction is applied by the shared
 * config's beforeSend/beforeBreadcrumb hooks.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init(buildServerSentryConfig());
  }
}
