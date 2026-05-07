/**
 * @henryco/observability/logger — structured logger.
 *
 * 60-line logger with `level`, `namespace`, `context` fields, methods
 * `debug`/`info`/`warn`/`error`, and `child(extra)` for scoped sub-
 * loggers. Output is one JSON line per emit, stdout — Vercel runtime
 * logs ingest cleanly, and any log-aggregation downstream (Logtail /
 * Datadog) can parse the structure without a custom shipper.
 *
 * Why no `pino` / `winston`: those add ~20kb of dependencies for
 * features (transports, custom formatters, async destinations) the
 * shell doesn't need. The shell wants: structured emit + redaction +
 * scoped namespaces. That's three small functions.
 */

import { defaultRedactor, type Redactor } from "./redaction";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LoggerOptions = {
  /** Top-level namespace — typically the package or app name. */
  namespace: string;
  /** Minimum log level to emit. Defaults to "info" in prod, "debug" in dev. */
  minLevel?: LogLevel;
  /** Bound context — included in every emit. */
  context?: Record<string, unknown>;
  /** PII redactor — defaults to `defaultRedactor`. */
  redactor?: Redactor;
  /** Output sink — defaults to console.log; tests can override. */
  sink?: (line: string) => void;
};

export type LogPayload = Record<string, unknown>;

export class Logger {
  private readonly namespace: string;
  private readonly minLevel: LogLevel;
  private readonly context: Record<string, unknown>;
  private readonly redactor: Redactor;
  private readonly sink: (line: string) => void;

  constructor(opts: LoggerOptions) {
    this.namespace = opts.namespace;
    this.minLevel = opts.minLevel ?? defaultMinLevel();
    this.context = opts.context ?? {};
    this.redactor = opts.redactor ?? defaultRedactor;
    this.sink = opts.sink ?? ((line) => console.log(line));
  }

  /**
   * Build a sub-logger with merged context. The sub-logger inherits
   * the namespace + min-level + redactor + sink, and merges the
   * supplied extra keys into its bound context.
   *
   * Use to scope a logger to a specific module:
   *   const log = rootLogger.child({ module: "shell.identity-bar" });
   */
  child(extra: Record<string, unknown>): Logger {
    return new Logger({
      namespace: this.namespace,
      minLevel: this.minLevel,
      context: { ...this.context, ...extra },
      redactor: this.redactor,
      sink: this.sink,
    });
  }

  debug(msg: string, payload?: LogPayload): void {
    this.emit("debug", msg, payload);
  }
  info(msg: string, payload?: LogPayload): void {
    this.emit("info", msg, payload);
  }
  warn(msg: string, payload?: LogPayload): void {
    this.emit("warn", msg, payload);
  }
  error(msg: string, payload?: LogPayload | Error): void {
    if (payload instanceof Error) {
      this.emit("error", msg, {
        error: { name: payload.name, message: payload.message, stack: payload.stack },
      });
      return;
    }
    this.emit("error", msg, payload);
  }

  private emit(level: LogLevel, msg: string, payload?: LogPayload): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    const redacted = this.redactor({
      ts: new Date().toISOString(),
      level,
      namespace: this.namespace,
      msg,
      ...this.context,
      ...(payload ?? {}),
    });
    try {
      this.sink(JSON.stringify(redacted));
    } catch {
      // Fallback when payload contains non-serialisable values.
      this.sink(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          namespace: this.namespace,
          msg: "logger emit failed — payload not serialisable",
          original_msg: msg,
        }),
      );
    }
  }
}

function defaultMinLevel(): LogLevel {
  const env = process.env.NODE_ENV;
  if (env === "production") return "info";
  if (env === "test") return "warn";
  return "debug";
}

/**
 * The default workspace logger — bound to the namespace `henryco`.
 * Sub-loggers should always derive via `.child({ module: ... })`.
 */
export const logger = new Logger({ namespace: "henryco" });
