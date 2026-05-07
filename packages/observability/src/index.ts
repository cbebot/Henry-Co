/**
 * @henryco/observability — workspace observability primitives.
 *
 * Three concerns:
 *   1. Structured logger with PII redaction — `./logger` + `./redaction`
 *   2. Event-taxonomy emitter — `./events`
 *   3. Sentry config builders — `./sentry/{server,client,instrumentation}`
 *
 * The package does NOT take a hard dep on `@sentry/nextjs`. Host apps
 * install Sentry at whatever version their Next.js version supports
 * (currently v9 for Next 16), and call `Sentry.init(buildServerSentryConfig())`
 * in their own instrumentation files. This decouples the package from
 * Sentry-version churn and avoids peer-dep mismatch warnings.
 */

export {
  Logger,
  logger,
  type LoggerOptions,
  type LogLevel,
  type LogPayload,
} from "./logger";

export {
  createRedactor,
  defaultRedactor,
  DEFAULT_REDACT_KEYS,
  type Redactor,
} from "./redaction";

export {
  emitEvent,
  type HenryEventName,
  type EventClassification,
  type EventOutcome,
  type EmitEventParams,
} from "./events";

export {
  buildServerSentryConfig,
  buildEdgeSentryConfig,
  type ServerSentryConfig,
  type EdgeSentryConfig,
} from "./sentry/server";

export {
  buildClientSentryConfig,
  type ClientSentryConfig,
} from "./sentry/client";

export { registerHenryCoInstrumentation } from "./sentry/instrumentation";
