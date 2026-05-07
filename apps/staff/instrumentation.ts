import * as Sentry from "@sentry/nextjs";
import {
  buildEdgeSentryConfig,
  buildServerSentryConfig,
} from "@henryco/observability";

/**
 * V2-DASH-01 G5 — apps/staff Next.js instrumentation hook.
 * See apps/account/instrumentation.ts for the design rationale.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(buildServerSentryConfig());
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(buildEdgeSentryConfig());
  }
}

export const onRequestError = Sentry.captureRequestError;
