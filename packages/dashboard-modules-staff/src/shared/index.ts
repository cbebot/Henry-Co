// Server-safe exports — re-exported here so module server components
// can pull from a single barrel.
export { STAFF_DIVISION_ACCENT } from "./division-accent";
export { deriveSLABucket, formatRelative } from "./sla";
export { DEFAULT_STAFF_QUEUE_FILTERS } from "./queue-filters";
// V3-41 predictive — server-safe loader + panel (no "use client" here, so a
// staff PageServer can render the panel and pass it into the client shell).
export {
  loadPredictiveSnapshot,
  EMPTY_PREDICTIVE_SNAPSHOT,
  MODULE_QUEUE_KEYS,
  type PredictiveSnapshot,
  type PredictiveSupabaseClient,
  type PredictiveForecastView,
  type PredictiveAtRiskView,
  type PredictiveDisputeView,
} from "./predictive";
export { PredictiveQueuePanel, type PredictiveQueuePanelProps } from "./predictive-panel";

// Client-only exports. Each "use client" component below is bundled
// for the browser; Next.js handles the boundary via the "use client"
// directive at the top of each source file. The DEFAULT_STAFF_QUEUE_FILTERS
// constant is intentionally NOT re-exported from a "use client" file —
// it lives in queue-filters.ts so server callers can spread it.
export {
  StaffQueueShell,
  type StaffQueueShellProps,
} from "./queue-shell";
export {
  GenericStaffQueueClient,
  type GenericQueueSnapshot,
  type GenericStaffQueueClientProps,
} from "./generic-queue";
