import * as Sentry from "@sentry/nextjs";
import { buildClientSentryConfig } from "@henryco/observability";

/**
 * V3-10 (S1) — apps/care browser Sentry init.
 */
Sentry.init(buildClientSentryConfig());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
