import "server-only";

import { emitEvent } from "@henryco/observability";

// V3-49 services-catalog telemetry. Server-side, fire-and-forget. Payloads carry
// vertical/service slug + division only — never PII.

export function emitServicesCatalogViewed(input: {
  surface: "care_directory" | "hub_directory";
  verticalCount: number;
}): void {
  emitEvent({
    name: "henry.services.catalog.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: {
      surface: input.surface,
      vertical_count: input.verticalCount,
      division: "care",
    },
  });
}

export function emitServiceViewed(input: {
  verticalSlug: string;
  serviceSlug: string;
  providerSupplied: boolean;
}): void {
  emitEvent({
    name: "henry.services.service.viewed",
    classification: "user_action",
    outcome: "completed",
    payload: {
      vertical: input.verticalSlug,
      service: input.serviceSlug,
      provider_supplied: input.providerSupplied,
      division: "care",
    },
  });
}

export function emitServiceBookingStarted(input: {
  verticalSlug: string;
  serviceSlug: string;
}): void {
  emitEvent({
    name: "henry.services.booking.started",
    classification: "user_action",
    outcome: "started",
    payload: {
      vertical: input.verticalSlug,
      service: input.serviceSlug,
      division: "care",
    },
  });
}
