import * as Sentry from "@sentry/nextjs";
import { buildClientSentryConfig } from "@henryco/observability";

/**
 * V2-DASH-01 G5 — apps/hub browser Sentry init.
 */
Sentry.init(buildClientSentryConfig());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
