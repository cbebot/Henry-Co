/**
 * @henryco/observability/sentry/server — Sentry server config builder.
 *
 * Returns the option object the host app passes to `Sentry.init()` in
 * its `instrumentation.ts` (Node runtime). Decoupling the config from
 * the call to `Sentry.init()` lets `@henryco/observability` ship
 * without taking a hard dependency on `@sentry/nextjs` at a specific
 * major version — the host app installs Sentry at whatever version
 * its Next.js version supports, and we just supply the options.
 *
 * Usage in `apps/account/instrumentation.ts`:
 *
 *   import * as Sentry from "@sentry/nextjs";
 *   import { buildServerSentryConfig } from "@henryco/observability/sentry/server";
 *
 *   export function register() {
 *     if (process.env.NEXT_RUNTIME === "nodejs") {
 *       Sentry.init(buildServerSentryConfig());
 *     }
 *     if (process.env.NEXT_RUNTIME === "edge") {
 *       Sentry.init(buildEdgeSentryConfig());
 *     }
 *   }
 */

import { defaultRedactor } from "../redaction";

export type ServerSentryConfig = {
  dsn: string | undefined;
  environment: string;
  release: string | undefined;
  tracesSampleRate: number;
  profilesSampleRate: number;
  beforeSend: (event: SentryEvent) => SentryEvent | null;
  beforeBreadcrumb: (breadcrumb: SentryBreadcrumb) => SentryBreadcrumb | null;
};

export type EdgeSentryConfig = {
  dsn: string | undefined;
  environment: string;
  release: string | undefined;
  tracesSampleRate: number;
  beforeSend: (event: SentryEvent) => SentryEvent | null;
};

type SentryEvent = Record<string, unknown>;
type SentryBreadcrumb = Record<string, unknown>;

const DEFAULT_TRACES_SAMPLE_RATE = 0.1;
const DEFAULT_PROFILES_SAMPLE_RATE = 0.1;

/**
 * Build the `Sentry.init` option set for the Node server runtime.
 *
 * Reads:
 *   SENTRY_DSN              — required for emission; falls back to undefined (Sentry no-ops)
 *   SENTRY_ENVIRONMENT      — defaults to NODE_ENV
 *   VERCEL_GIT_COMMIT_SHA   — used as the release tag
 *   SENTRY_TRACES_SAMPLE_RATE — defaults to 0.1
 *   SENTRY_PROFILES_SAMPLE_RATE — defaults to 0.1
 */
export function buildServerSentryConfig(opts: { release?: string } = {}): ServerSentryConfig {
  return {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: opts.release ?? process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: numericEnv("SENTRY_TRACES_SAMPLE_RATE", DEFAULT_TRACES_SAMPLE_RATE),
    profilesSampleRate: numericEnv("SENTRY_PROFILES_SAMPLE_RATE", DEFAULT_PROFILES_SAMPLE_RATE),
    beforeSend: (event) => {
      // Redact PII from the event body before transmission.
      try {
        return defaultRedactor(event) as SentryEvent;
      } catch {
        return event;
      }
    },
    beforeBreadcrumb: (breadcrumb) => {
      try {
        return defaultRedactor(breadcrumb) as SentryBreadcrumb;
      } catch {
        return breadcrumb;
      }
    },
  };
}

/**
 * Build the `Sentry.init` option set for the Edge runtime. Edge
 * doesn't support profiling so the profiles sample rate is omitted.
 */
export function buildEdgeSentryConfig(opts: { release?: string } = {}): EdgeSentryConfig {
  return {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: opts.release ?? process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: numericEnv("SENTRY_TRACES_SAMPLE_RATE", DEFAULT_TRACES_SAMPLE_RATE),
    beforeSend: (event) => {
      try {
        return defaultRedactor(event) as SentryEvent;
      } catch {
        return event;
      }
    },
  };
}

function numericEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
