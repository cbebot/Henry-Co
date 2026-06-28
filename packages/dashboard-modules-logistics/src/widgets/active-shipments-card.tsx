import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Truck, ArrowRight } from "lucide-react";

import { formatMoney, timeAgo, titleCaseStatus } from "../format";
import { LOGISTICS_HOME_HREF, type LogisticsSnapshot } from "../data";

/**
 * ActiveShipmentsCard — surfaces the viewer's shipments currently in
 * flight (quote → pickup → in-transit → attempted-delivery), newest
 * activity first. The headline count is the real `metrics.activeCount`.
 *
 * Empty state: typographic minimalism — no cartoon, no exclamation.
 * Clicking the card chrome or any row deep-links to the live
 * `/logistics` surface (set as the widget `href` in the module).
 */
export function ActiveShipmentsCard({
  snapshot,
}: {
  snapshot: LogisticsSnapshot;
}) {
  const { active } = snapshot;
  const count = snapshot.metrics.activeCount;

  return (
    <Panel tone="raised">
      <Section
        kicker="In flight"
        headline={
          count > 0
            ? `${count} shipment${count === 1 ? "" : "s"} on the way`
            : "No active shipments"
        }
        action={
          <ActionButton
            href={LOGISTICS_HOME_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            View all
          </ActionButton>
        }
      >
        {active.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            When you book a delivery, it shows up here with live tracking.
          </p>
        ) : (
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {active.slice(0, 3).map((shipment) => (
              <li key={shipment.id}>
                <Link
                  href={LOGISTICS_HOME_HREF}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: `1px solid var(${CSS_VARS.hairline})`,
                    backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                    color: `var(${CSS_VARS.ink})`,
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      minWidth: 0,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        color: `var(${CSS_VARS.accentText})`,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        backgroundColor: `var(${CSS_VARS.accentSoft})`,
                        flexShrink: 0,
                      }}
                    >
                      <Truck size={16} />
                    </span>
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {shipment.trackingCode
                          ? shipment.trackingCode
                          : "Shipment"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: `var(${CSS_VARS.inkMuted})`,
                        }}
                      >
                        {titleCaseStatus(shipment.lifecycleStatus)} ·{" "}
                        {timeAgo(shipment.lastActivityAt)}
                      </span>
                    </span>
                  </div>
                  {shipment.amountMinor > 0 ? (
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: `var(${CSS_VARS.accentText})`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatMoney(shipment.amountMinor, shipment.currency)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </Panel>
  );
}
