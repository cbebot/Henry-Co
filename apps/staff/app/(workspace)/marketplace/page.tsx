import { getDivisionUrl } from "@henryco/config";
import { BanknoteArrowDown, Headphones, ShieldCheck, ShoppingBag } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasDivisionRole } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad, type LaunchpadLink } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const viewer = await requireStaff();
  const hasMarketplace = viewer.divisions.some((d) => d.division === "marketplace");
  const hasMarketplaceOversight = viewerHasAnyFamily(viewer, ["division_manager", "system_admin"]);
  const links: LaunchpadLink[] = [];

  if (!hasMarketplace) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Workspace" title="Marketplace Operations" />
        <StaffEmptyState
          icon={ShoppingBag}
          title="Access restricted"
          description="You do not have access to the Marketplace division. Contact your manager if you believe this is an error."
        />
      </div>
    );
  }

  if (hasMarketplaceOversight || viewerHasDivisionRole(viewer, "marketplace", ["marketplace_admin"])) {
    links.push({
      href: `${getDivisionUrl("marketplace")}/owner`,
      label: "Owner control",
      description: "Inspect platform-wide marketplace performance and governance surfaces.",
      icon: ShoppingBag,
      readiness: "live",
    });
  }

  if (
    hasMarketplaceOversight ||
    viewerHasDivisionRole(viewer, "marketplace", [
      "marketplace_ops",
      "catalog_manager",
      "campaign_manager",
      "seller_success",
    ])
  ) {
    links.push({
      href: `${getDivisionUrl("marketplace")}/operations`,
      label: "Operations lane",
      description: "Route order, catalog, campaign, and seller-success work through the live ops surface.",
      icon: ShoppingBag,
      readiness: "live",
    });
  }

  if (
    hasMarketplaceOversight ||
    viewerHasDivisionRole(viewer, "marketplace", [
      "marketplace_support",
      "seller_success",
      "marketplace_admin",
      "marketplace_ops",
    ])
  ) {
    links.push({
      href: `${getDivisionUrl("marketplace")}/support`,
      label: "Support desk",
      description: "Handle buyer and seller support flows where they actually execute.",
      icon: Headphones,
      readiness: "live",
    });
  }

  if (
    hasMarketplaceOversight ||
    viewerHasDivisionRole(viewer, "marketplace", ["marketplace_finance", "marketplace_admin"])
  ) {
    links.push({
      href: `${getDivisionUrl("marketplace")}/finance`,
      label: "Finance lane",
      description: "Review payouts, payment disputes, and finance-sensitive decisions.",
      icon: BanknoteArrowDown,
      readiness: "live",
    });
  }

  if (
    hasMarketplaceOversight ||
    viewerHasDivisionRole(viewer, "marketplace", ["marketplace_moderator", "marketplace_admin"])
  ) {
    links.push({
      href: `${getDivisionUrl("marketplace")}/moderation`,
      label: "Moderation",
      description: "Control catalog trust, seller risk, and policy enforcement.",
      icon: ShieldCheck,
      readiness: "live",
    });
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Marketplace Operations"
        description="Manage orders, vendor relationships, disputes, and catalog moderation."
      />
      <StaffWorkspaceLaunchpad
        overview="Marketplace operations already run inside HenryCo Marketplace. Staff HQ now points directly at those owner, support, finance, and moderation routes instead of leaving operators inside a dead shell."
        links={links}
        notes={[
          "Marketplace login and admin smoke checks now accept Next.js redirect HTML as well as raw 307 responses, which matches live production behavior.",
        ]}
      />
    </div>
  );
}
