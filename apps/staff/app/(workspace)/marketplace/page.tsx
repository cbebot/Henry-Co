import { getDivisionUrl } from "@henryco/config";
import { BanknoteArrowDown, Headphones, ShieldCheck, ShoppingBag } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const viewer = await requireStaff();
  const hasMarketplace = viewer.divisions.some((d) => d.division === "marketplace");

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

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Workspace"
        title="Marketplace Operations"
        description="Manage orders, vendor relationships, disputes, and catalog moderation."
      />
      <StaffWorkspaceLaunchpad
        overview="Marketplace operations already run inside HenryCo Marketplace. Staff HQ now points directly at those owner, support, finance, and moderation routes instead of leaving operators inside a dead shell."
        links={[
          {
            href: `${getDivisionUrl("marketplace")}/owner`,
            label: "Owner control",
            description: "Inspect platform-wide marketplace performance and governance surfaces.",
            icon: ShoppingBag,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("marketplace")}/support`,
            label: "Support desk",
            description: "Handle buyer and seller support flows where they actually execute.",
            icon: Headphones,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("marketplace")}/finance`,
            label: "Finance lane",
            description: "Review payouts, payment disputes, and finance-sensitive decisions.",
            icon: BanknoteArrowDown,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("marketplace")}/moderation`,
            label: "Moderation",
            description: "Control catalog trust, seller risk, and policy enforcement.",
            icon: ShieldCheck,
            readiness: "live",
          },
        ]}
        notes={[
          "Marketplace login and admin smoke checks now accept Next.js redirect HTML as well as raw 307 responses, which matches live production behavior.",
        ]}
      />
    </div>
  );
}
