import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { Truck, ArrowRight } from "lucide-react";

import { LOGISTICS_HOME_HREF, getLogisticsQuickActions } from "../data";

/**
 * LogisticsEntryCard — the honest entry-point widget for Henry Onyx
 * Logistics. Surfaces the division's real quick actions (book / track /
 * history), each deep-linking to the live `/logistics` surface.
 */
export function LogisticsEntryCard() {
  const logistics = getDivisionConfig("logistics");
  const actions = getLogisticsQuickActions();

  return (
    <Panel tone="raised">
      <Section
        kicker={logistics.shortName}
        headline="Move it with confidence"
        description="Book a shipment and follow every parcel from pickup to doorstep."
        action={
          <ActionButton
            href={LOGISTICS_HOME_HREF}
            tone="primary"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open Logistics
          </ActionButton>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: `1px solid var(${CSS_VARS.hairline})`,
                backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                color: `var(${CSS_VARS.ink})`,
                textDecoration: "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  color: logistics.accentText,
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
              <span style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{action.label}</span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: `var(${CSS_VARS.inkSoft})`,
                    lineHeight: 1.4,
                  }}
                >
                  {action.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </Panel>
  );
}
