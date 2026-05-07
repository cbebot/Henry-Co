import * as Sentry from "@sentry/nextjs";
import { buildClientSentryConfig } from "@henryco/observability";

/**
 * V2-DASH-01 G5 — apps/account browser Sentry init.
 *
 * Runs once at first render. Reads NEXT_PUBLIC_SENTRY_DSN; missing DSN
 * no-ops without throwing.
 */
Sentry.init(buildClientSentryConfig());

/**
 * Next 16 router transition hook — emits a Sentry breadcrumb on every
 * client-side navigation so the breadcrumb timeline carries the full
 * navigation chain leading into an error.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
