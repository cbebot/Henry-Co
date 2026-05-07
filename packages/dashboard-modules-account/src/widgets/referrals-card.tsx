import { MetricCard } from "@henryco/dashboard-shell/components";
import { Gift } from "lucide-react";

/**
 * ReferralsCard — invitation surface entry. Deep-links to
 * `/referrals`. Until referral telemetry lands in @henryco/data
 * (DASH-3+), the card surfaces a calm static prompt rather than a
 * "0 invites" zero-state.
 */
export function ReferralsCard() {
  return (
    <MetricCard
      label="Referrals"
      value="Invite & earn"
      href="/referrals"
      icon={<Gift size={18} aria-hidden />}
      context={{
        kind: "trend",
        direction: "up",
        magnitude: "Share HenryCo with friends",
      }}
    />
  );
}
