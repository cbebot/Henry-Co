import * as Sentry from "@sentry/react-native";

import { getEnv } from "@/core/env";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const env = getEnv();
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }
  Sentry.init({
    dsn,
    environment: env.APP_ENV,
    tracesSampleRate: env.APP_ENV === "production" ? 0.2 : 1,
    enableAutoSessionTracking: true,
  });
  initialized = true;
}
