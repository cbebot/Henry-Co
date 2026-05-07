/**
 * @henryco/observability/sentry/client — Sentry browser config builder.
 *
 * Returns the option object the host app passes to `Sentry.init()` in
 * its `sentry.client.config.ts`.
 *
 * Usage in `apps/account/sentry.client.config.ts`:
 *
 *   import * as Sentry from "@sentry/nextjs";
 *   import { buildClientSentryConfig } from "@henryco/observability/sentry/client";
 *   Sentry.init(buildClientSentryConfig());
 */

import { defaultRedactor } from "../redaction";

export type ClientSentryConfig = {
  dsn: string | undefined;
  environment: string;
  release: string | undefined;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  beforeSend: (event: SentryEvent) => SentryEvent | null;
};

type SentryEvent = Record<string, unknown>;

const DEFAULT_TRACES_SAMPLE_RATE = 0.1;
const DEFAULT_REPLAYS_SESSION_SAMPLE_RATE = 0.0; // Disabled by default — replays are heavy.
const DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE = 1.0;

export function buildClientSentryConfig(opts: { release?: string } = {}): ClientSentryConfig {
  return {
    dsn: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SENTRY_DSN : undefined,
    environment:
      (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT : undefined) ||
      (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) ||
      "development",
    release:
      opts.release ??
      (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA : undefined),
    tracesSampleRate: numericEnv("NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE", DEFAULT_TRACES_SAMPLE_RATE),
    replaysSessionSampleRate: numericEnv(
      "NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE",
      DEFAULT_REPLAYS_SESSION_SAMPLE_RATE,
    ),
    replaysOnErrorSampleRate: numericEnv(
      "NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE",
      DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE,
    ),
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
  const raw = typeof process !== "undefined" ? process.env[name] : undefined;
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
