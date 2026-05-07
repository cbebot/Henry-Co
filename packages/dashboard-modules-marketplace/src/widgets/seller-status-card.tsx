import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { Store, ArrowRight } from "lucide-react";
import { titleCaseStatus } from "../format";
import type { MarketplaceVendorStatus } from "../data";

/**
 * SellerStatusCard — vendor-only widget. Surfaces the viewer's
 * vendor application + active store. Falls back to "Become a seller"
 * when the snapshot has no vendor record (the manifest already
 * gates this widget out of the home for non-vendors via
 * `getRoleGate`'s restrictions, so a `null` vendorStatus here means
 * the snapshot loaded but the viewer has not started the application
 * yet — render the entry-point variant).
 */
export function SellerStatusCard({
  vendorStatus,
}: {
  vendorStatus: MarketplaceVendorStatus | null;
}) {
  if (!vendorStatus) {
    return (
      <Panel tone="flat">
        <Section
          kicker="Vendor"
          headline="Become a seller"
          description="Apply to open a store on HenryCo Marketplace."
          action={
            <ActionButton
              href="/marketplace/account/seller-application/start"
              tone="primary"
              icon={<ArrowRight size={14} />}
              iconPosition="trailing"
            >
              Start application
            </ActionButton>
          }
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: `var(${CSS_VARS.inkMuted})`,
            }}
          >
            Onboarding takes about 8 minutes.
          </span>
        </Section>
      </Panel>
    );
  }

  const headline = vendorStatus.storeName
    ? vendorStatus.storeName
    : "Application in review";
  const description = vendorStatus.storeIsActive
    ? "Your store is live."
    : vendorStatus.applicationStatus
      ? `Application status: ${titleCaseStatus(vendorStatus.applicationStatus)}.`
      : "Awaiting review.";

  const ctaHref = vendorStatus.storeIsActive
    ? "/marketplace/vendor"
    : "/marketplace/account/seller-application";

  return (
    <Panel tone="raised">
      <Section
        kicker="Vendor"
        headline={headline}
        description={description}
        action={
          <ActionButton
            href={ctaHref}
            tone="primary"
            icon={<Store size={14} />}
          >
            {vendorStatus.storeIsActive ? "Manage store" : "Continue"}
          </ActionButton>
        }
      >
        {vendorStatus.storeIsActive ? (
          <a
            href={`/marketplace/store/${vendorStatus.storeSlug}`}
            style={{
              fontSize: "0.875rem",
              color: `var(${CSS_VARS.accentText})`,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            View public storefront
            <ArrowRight size={14} aria-hidden />
          </a>
        ) : null}
      </Section>
    </Panel>
  );
}
