import { MetricCard } from "@henryco/dashboard-shell/components";
import { Gift } from "lucide-react";

/**
 * ReferralsCard — invitation surface entry. Deep-links to
 * `/referrals`. Until referral telemetry lands in @henryco/data
 * (DASH-3+), the card surfaces a calm static prompt rather than a
 * "0 invites" zero-state.
 *
 * V3-08 (Empty Dashboard Truth): the context is `direction: "flat"`,
 * NOT "up". There is no measured referral trend behind this card —
 * an up-arrow would paint a fabricated positive movement on data that
 * does not exist. `flat` renders the neutral `Minus` glyph, which is
 * the truthful "no signal yet" state for a static entry-point prompt.
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
        direction: "flat",
        magnitude: "Share HenryCo with friends",
      }}
    />
  );
}
