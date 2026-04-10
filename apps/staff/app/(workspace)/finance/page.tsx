import { getDivisionUrl, getHqUrl } from "@henryco/config";
import { BanknoteArrowDown, DollarSign, Landmark, ReceiptText, Wallet } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const viewer = await requireStaff();
  const hasFinance = viewerHasPermission(viewer, "division.finance");

  if (!hasFinance) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Finance" />
        <StaffEmptyState
          icon={DollarSign}
          title="Access restricted"
          description="You do not have finance permissions. Contact your manager if you need access to financial data."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Finance"
        description="Manage payouts, funding requests, expense approvals, and financial reporting."
      />
      <StaffWorkspaceLaunchpad
        readiness="partial"
        overview="Finance controls are live today, but they are distributed across owner and division-specific finance routes. This page now points to those real ledgers instead of pretending a unified finance cockpit is already done."
        links={[
          {
            href: `${getHqUrl("/owner/finance")}`,
            label: "Group finance",
            description: "Open the owner-side finance overview for cross-company visibility.",
            icon: Landmark,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("care")}/owner/finance`,
            label: "Care finance",
            description: "Review care payments, expenses, and finance-sensitive ops.",
            icon: ReceiptText,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("marketplace")}/finance`,
            label: "Marketplace finance",
            description: "Inspect seller payouts, disputes, and revenue-sensitive cases.",
            icon: Wallet,
            readiness: "live",
          },
          {
            href: `${getDivisionUrl("studio")}/finance/invoices`,
            label: "Studio invoices",
            description: "Handle studio invoice truth and payment movement.",
            icon: BanknoteArrowDown,
            readiness: "live",
          },
        ]}
        notes={[
          "This remains partial because approvals and reporting are still distributed across division finance routes rather than one shared ledger.",
        ]}
      />
    </div>
  );
}
