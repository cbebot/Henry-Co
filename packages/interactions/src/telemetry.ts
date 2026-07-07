/**
 * @henryco/interactions — interaction telemetry (doctrine Part VI).
 *
 * Pure module: the event taxonomy + sinks. No React here — the provider
 * and `useInteractionTelemetry()` hook live in `context.tsx` so this file
 * stays importable from anywhere (node tests, server, client) with zero
 * React cost.
 *
 * These are the EXACT Part-VI interaction events named in
 * `docs/v3/public-pages-interaction-principles.md`. They are distinct from
 * the `henry.v3.*` showcase closure events (those live in
 * `@henryco/observability`). No new interaction event is invented here.
 */

export type InteractionEvent =
  | {
      name: "page_viewed";
      props: {
        surface_id: string;
        locale: string;
        currency: string;
        commitment_tier: string;
        referrer_class?: string;
        device_class?: string;
      };
    }
  | {
      name: "cta_seen";
      props: { cta_id: string; surface_id: string; ab_variant?: string; scroll_depth_at_view?: number };
    }
  | {
      name: "cta_clicked";
      props: { cta_id: string; surface_id: string; ab_variant?: string; time_since_page_view_ms?: number };
    }
  | { name: "cta_succeeded"; props: { cta_id: string; surface_id: string; latency_ms: number } }
  | { name: "cta_failed"; props: { cta_id: string; surface_id: string; error_class: string; retried: boolean } }
  | {
      name: "commitment_rung_offered";
      props: { from_tier: string; to_tier: string; surface_id: string; trigger: string };
    }
  | { name: "commitment_rung_accepted"; props: { from_tier: string; to_tier: string; surface_id: string } }
  | { name: "joy_state_seen"; props: { cta_id: string; surface_id: string; variant: string } }
  | { name: "recovery_triggered"; props: { flow_id: string; trigger: "idle" | "exit"; consented: boolean } }
  | { name: "recovery_resumed"; props: { flow_id: string; time_to_resume_s: number } }
  | { name: "pricing_revealed"; props: { surface_id: string; currency: string; converted_from?: string } }
  | { name: "trust_stage_entered"; props: { surface_id: string; stage: string; via: string } };

export type InteractionEventName = InteractionEvent["name"];

/**
 * The transport the engines emit into. The app wires a concrete sink
 * (typically bridging `@henryco/observability`) via the provider in
 * `context.tsx`. The package hard-imports no transport.
 */
export interface InteractionTelemetrySink {
  emit(event: InteractionEvent): void;
}

/** The safe default: swallow events. Used for SSR, tests, or a missing provider. */
export const noopSink: InteractionTelemetrySink = {
  emit() {
    /* intentionally empty */
  },
};

/** Dev sink — logs each event to the console. */
export function createConsoleSink(
  log: (message: string, props: unknown) => void = (m, p) => console.debug(m, p),
): InteractionTelemetrySink {
  return {
    emit(event) {
      log(`[interaction] ${event.name}`, event.props);
    },
  };
}

/** Test / inspection sink — collects emitted events into an array. */
export function createCollectingSink(): {
  sink: InteractionTelemetrySink;
  events: InteractionEvent[];
} {
  const events: InteractionEvent[] = [];
  return {
    sink: {
      emit(event) {
        events.push(event);
      },
    },
    events,
  };
}
