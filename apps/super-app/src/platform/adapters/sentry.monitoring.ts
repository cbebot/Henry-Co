import * as Sentry from "@sentry/react-native";

import { getEnv } from "@/core/env";
import type { MonitoringAdapter } from "@/platform/contracts/monitoring";
import { getRuntimeMode } from "@/platform/runtime";

let started = false;

export class SentryMonitoringAdapter implements MonitoringAdapter {
  init(): void {
    if (started) return;
    const dsn = getEnv().SENTRY_DSN?.trim();
    if (!dsn) return;
    Sentry.init({
      dsn,
      environment: getRuntimeMode(),
      tracesSampleRate: getEnv().APP_ENV === "production" ? 0.2 : 1,
      enableAutoSessionTracking: true,
    });
    started = true;
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    Sentry.captureException(error, { extra: context });
  }
}
