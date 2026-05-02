/**
 * Legacy entry point. The implementation moved to `./SupportDock` in
 * V5-2 (premium support concierge redesign). This file is preserved as
 * a thin re-export so any external consumer that imported by relative
 * path keeps working without churn.
 */
export { SupportDock as AssistDock } from "./SupportDock";
export type { AssistDockProps, AssistDivision } from "./SupportDock";
