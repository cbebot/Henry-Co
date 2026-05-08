import { MetricCard } from "@henryco/dashboard-shell/components";
import { ShieldCheck } from "lucide-react";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * TrustTierCard — displays the derived trust tier label + score.
 * Deep-links to `/security` for the full identity surface.
 */
export function TrustTierCard({
  snapshot,
}: {
  snapshot: CustomerOverviewSnapshot;
}) {
  const { trustLabel, trustScore, hasDocuments } = snapshot;

  return (
    <MetricCard
      label="Trust tier"
      value={trustLabel}
      href="/security"
      icon={<ShieldCheck size={18} aria-hidden />}
      context={{
        kind: "trend",
        direction: trustScore >= 65 ? "up" : trustScore >= 35 ? "flat" : "down",
        magnitude: hasDocuments
          ? `Score ${trustScore} · documents on file`
          : `Score ${trustScore} · upload to advance`,
      }}
    />
  );
}
