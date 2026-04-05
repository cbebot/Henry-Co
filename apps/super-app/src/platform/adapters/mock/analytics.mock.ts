import type { AnalyticsAdapter } from "@/platform/contracts/analytics";

export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  track(event: string, properties?: Record<string, unknown>): void {
    console.log(`[analytics] ${event}`, properties ?? {});
  }

  screen(name: string, properties?: Record<string, unknown>): void {
    console.log(`[analytics] screen ${name}`, properties ?? {});
  }
}

export class NoOpAnalyticsAdapter implements AnalyticsAdapter {
  track(): void {}
  screen(): void {}
}
