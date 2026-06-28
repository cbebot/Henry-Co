import type { ReactNode } from "react";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Wallet, FileCheck2, ArrowRight } from "lucide-react";

import { STUDIO_HOME_HREF, type StudioMetricsSnapshot } from "../data";
import { pluralize } from "../format";

/** Deep-links into the payments section the studio landing renders. */
const STUDIO_PAYMENTS_HREF = `${STUDIO_HOME_HREF}#studio-payments`;

/**
 * PaymentsDueCard — surfaces the viewer's studio payment posture: how
 * many payment checkpoints are still open (not paid / cancelled) and how
 * many already carry an uploaded proof. Both numbers come straight from
 * `loadStudioSnapshot` (the read-only port of
 * `getStudioDashboardData().metrics`); nothing is fabricated.
 *
 * The card carries slightly more weight than the projects pulse because
 * an open payment is a concrete next action for the viewer.
 */
export function PaymentsDueCard({
  snapshot,
}: {
  snapshot: StudioMetricsSnapshot;
}) {
  const { pendingPayments, proofSubmitted, totalPayments } = snapshot;

  return (
    <Panel tone="raised">
      <Section
        kicker="Payments"
        headline={
          pendingPayments > 0
            ? `${pluralize(pendingPayments, "payment")} awaiting you`
            : totalPayments > 0
              ? "Payments settled"
              : "No payments yet"
        }
        action={
          <ActionButton
            href={STUDIO_PAYMENTS_HREF}
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Open payments
          </ActionButton>
        }
      >
        {totalPayments > 0 ? (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <PaymentRow
              icon={<Wallet size={16} />}
              label="Pending checkpoints"
              value={pendingPayments}
              emphasize={pendingPayments > 0}
            />
            <PaymentRow
              icon={<FileCheck2 size={16} />}
              label="Proofs submitted"
              value={proofSubmitted}
            />
          </ul>
        ) : (
          <p
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.inkSoft})`,
              margin: 0,
            }}
          >
            Payment checkpoints for your studio projects appear here, with
            proof upload built in.
          </p>
        )}
      </Section>
    </Panel>
  );
}

function PaymentRow({
  icon,
  label,
  value,
  emphasize = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "0.75rem",
        borderRadius: "0.75rem",
        border: `1px solid var(${CSS_VARS.hairline})`,
        backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
          {icon}
        </span>
        <span
          style={{
            fontSize: "0.875rem",
            color: `var(${CSS_VARS.ink})`,
          }}
        >
          {label}
        </span>
      </span>
      <span
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: emphasize
            ? `var(${CSS_VARS.accentText})`
            : `var(${CSS_VARS.ink})`,
        }}
      >
        {value}
      </span>
    </li>
  );
}
