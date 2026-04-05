import type { MonitoringAdapter } from "@/platform/contracts/monitoring";

export class NoOpMonitoringAdapter implements MonitoringAdapter {
  init(): void {}

  captureException(error: unknown, context?: Record<string, unknown>): void {
    console.warn("[monitoring:noop]", error, context);
  }
}
