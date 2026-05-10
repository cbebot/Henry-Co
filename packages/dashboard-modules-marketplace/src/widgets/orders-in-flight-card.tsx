import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Truck, ArrowRight } from "lucide-react";
import { formatMoney, timeAgo, titleCaseStatus } from "../format";
import type { MarketplaceSnapshot } from "../data";

/**
 * OrdersInFlightCard — surfaces marketplace orders currently in
 * pending / preparing / shipped / out-for-delivery states.
 *
 * Empty state: typographic minimalism per anti-pattern #16 — no
 * cartoon, no "you don't have any orders!" exclamation.
 *
 * PASS 22 issue #1+#2 — the per-order rows previously linked to
 * `/marketplace/orders/[orderNo]` (no such route in apps/account → 404)
 * via raw `<a>` (full reload). Detail pages live on the marketplace
 * subdomain; until they're mirrored into the account shell we land users
 * on `/marketplace` (the orders summary surface), and use Next/Link for
 * SPA-fast navigation.
 */
export function OrdersInFlightCard({
  snapshot,
}: {
  snapshot: MarketplaceSnapshot;
}) {
  const { ordersInFlight, ordersInFlightCount } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="In flight"
        headline={
          ordersInFlightCount > 0
            ? `${ordersInFlightCount} order${ordersInFlightCount === 1 ? "" : "s"} on the way`
            : "No orders in flight"
        }
        action={
          <ActionButton
            href="/marketplace"
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            View all
          </ActionButton>
        }
      >
        {ordersInFlight.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            When you place an order, it shows up here with live tracking.
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
            {ordersInFlight.slice(0, 3).map((order) => (
              <li key={order.id}>
                <Link
                  href="/marketplace"
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
                        Order #{order.orderNo}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: `var(${CSS_VARS.inkMuted})`,
                        }}
                      >
                        {titleCaseStatus(order.status)} · placed {timeAgo(order.placedAt)}
                      </span>
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: `var(${CSS_VARS.accentText})`,
                    }}
                  >
                    {formatMoney(order.grandTotal, order.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </Panel>
  );
}
