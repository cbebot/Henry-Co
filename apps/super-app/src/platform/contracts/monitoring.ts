export type MonitoringAdapter = {
  init(): void;
  captureException(error: unknown, context?: Record<string, unknown>): void;
};
