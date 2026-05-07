import * as Sentry from "@sentry/nextjs";
import {
  buildEdgeSentryConfig,
  buildServerSentryConfig,
} from "@henryco/observability";

/**
 * V2-DASH-01 G5 — apps/account Next.js instrumentation hook.
 *
 * Wires Sentry server + edge initialisation through @henryco/observability's
 * config-builder pattern so the apps share one set of defaults
 * (DSN env, environment, release tag, sample rates, PII redaction
 * via beforeSend/beforeBreadcrumb).
 *
 * The hook is called once per Node runtime + once per Edge runtime
 * at server start. SENTRY_DSN must be set for emission; missing
 * DSN no-ops with a console warning surfaced via the
 * @henryco/observability/sentry/instrumentation helper.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(buildServerSentryConfig());
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(buildEdgeSentryConfig());
  }
}

/**
 * Next 15+ + @sentry/nextjs ^8.28 hook — captures unhandled errors
 * from server components and route handlers as Sentry events with
 * the full request context.
 */
export const onRequestError = Sentry.captureRequestError;
