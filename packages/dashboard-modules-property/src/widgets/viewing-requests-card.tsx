import { MetricCard } from "@henryco/dashboard-shell/components";
import { CalendarCheck } from "lucide-react";
import { PROPERTY_HOME_HREF, type PropertySnapshot } from "../data";

const VIEWING_REQUESTS_LABEL = "Viewing requests";

/**
 * ViewingRequestsCard — a compact metric surfacing the viewer's REAL
 * viewing-request count, with their open inquiry count as required
 * context. Both numbers come from `customer_activity` aggregates in the
 * snapshot; nothing is fabricated. Deep-links to `/property`.
 *
 * The module only mounts this widget when there is genuine activity
 * (an inquiry or a viewing), so the home feed never carries a hollow
 * "0 viewings" metric — matching the calm-by-default home posture.
 */
export function ViewingRequestsCard({ snapshot }: { snapshot: PropertySnapshot }) {
  const { viewings, inquiries } = snapshot.stats;
  const inquiryLabel = `${inquiries} open inquir${inquiries === 1 ? "y" : "ies"}`;

  return (
    <MetricCard
      label={VIEWING_REQUESTS_LABEL}
      value={String(viewings)}
      icon={<CalendarCheck size={18} aria-hidden />}
      href={PROPERTY_HOME_HREF}
      context={
        viewings > 0
          ? {
              kind: "trend",
              direction: "up",
              magnitude: `awaiting confirmation · ${inquiryLabel}`,
            }
          : {
              kind: "comparison",
              vs: "viewings",
              delta: inquiryLabel,
            }
      }
    />
  );
}
