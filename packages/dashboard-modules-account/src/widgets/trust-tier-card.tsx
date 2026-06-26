import { MetricCard } from "@henryco/dashboard-shell/components";
import { ShieldCheck } from "lucide-react";
import { getDashboardShellCopy, type AppLocale } from "@henryco/i18n";
import type { CustomerOverviewSnapshot } from "../data";

/**
 * TrustTierCard — displays the derived trust tier label + score.
 * Deep-links to `/security` for the full identity surface.
 */
export function TrustTierCard({
  snapshot,
  locale,
}: {
  snapshot: CustomerOverviewSnapshot;
  locale: AppLocale;
}) {
  const { trustLabel, trustScore, hasDocuments } = snapshot;
  const copy = getDashboardShellCopy(locale);

  return (
    <MetricCard
      label={copy.trustTier.label}
      value={trustLabel}
      href="/security"
      icon={<ShieldCheck size={18} aria-hidden />}
      context={{
        kind: "trend",
        direction: trustScore >= 65 ? "up" : trustScore >= 35 ? "flat" : "down",
        magnitude: hasDocuments
          ? copy.trustTier.scoreWithDocuments(trustScore)
          : copy.trustTier.scoreUploadToAdvance(trustScore),
      }}
    />
  );
}
