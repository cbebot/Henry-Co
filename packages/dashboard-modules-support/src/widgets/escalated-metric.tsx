import { MetricCard } from "@henryco/dashboard-shell/components";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { SupportSnapshot } from "../data";

/**
 * EscalatedMetric — surfaces the count of threads flagged high or
 * urgent priority that haven't yet resolved. When zero, renders a
 * quiet "All requests calm" trend so the widget is never decorative.
 */
export function EscalatedMetric({ snapshot }: { snapshot: SupportSnapshot }) {
  const { escalatedCount } = snapshot;
  const hasEscalated = escalatedCount > 0;

  return (
    <MetricCard
      label="Escalated"
      value={hasEscalated ? String(escalatedCount) : "0"}
      icon={
        hasEscalated ? (
          <AlertTriangle size={18} aria-hidden />
        ) : (
          <ShieldCheck size={18} aria-hidden />
        )
      }
      href="/support"
      context={
        hasEscalated
          ? {
              kind: "comparison",
              vs: `${escalatedCount} thread${escalatedCount === 1 ? "" : "s"}`,
              delta: "flagged for attention",
            }
          : {
              kind: "trend",
              direction: "flat",
              magnitude: "All requests calm",
            }
      }
    />
  );
}
