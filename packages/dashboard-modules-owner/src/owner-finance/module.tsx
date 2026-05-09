import { DollarSign } from "lucide-react";
import type {
  OwnerDashboardModule,
  OwnerBulkAction,
} from "@henryco/dashboard-shell/owner-register";
import type {
  PaletteEntry,
  NotificationCategory,
  RouteEntry,
} from "@henryco/dashboard-shell";

/**
 * owner-finance — Track B finance center module.
 *
 * Revenue, invoices, expenses. Highest power-user-density surface in
 * the owner shell — bulk operations on invoices (mark paid, void,
 * remind), bulk operations on expenses (approve, reject, escalate).
 *
 * Every bulk action writes one audit_log row per affected row plus a
 * bulk_correlation_id grouping them (V14 gate).
 */
export const ownerFinanceModule: OwnerDashboardModule = {
  slug: "owner-finance",
  title: "Finance",
  description: "Revenue, invoices, expenses — bulk operations, exports, reconcile traces.",
  icon: () => <DollarSign size={18} aria-hidden />,

  getEligibleViewer() {
    return "allowed";
  },

  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },

  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "finance", kind: "home", label: "Finance" },
      { path: "finance/revenue", kind: "detail", label: "Revenue" },
      { path: "finance/invoices", kind: "detail", label: "Invoices" },
      { path: "finance/expenses", kind: "detail", label: "Expenses" },
    ];
  },

  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "owner-finance.home",
        source: "owner-finance",
        groupLabel: "Open" as const,
        label: "Open finance center",
        kicker: "Owner",
        href: "/owner/finance",
        keywords: ["finance", "money", "revenue"],
      },
      {
        id: "owner-finance.revenue",
        source: "owner-finance",
        groupLabel: "Open" as const,
        label: "Revenue",
        kicker: "Owner",
        href: "/owner/finance/revenue",
        keywords: ["revenue", "income"],
      },
      {
        id: "owner-finance.invoices",
        source: "owner-finance",
        groupLabel: "Open" as const,
        label: "Invoices",
        kicker: "Owner",
        href: "/owner/finance/invoices",
        keywords: ["invoices", "billing"],
      },
      {
        id: "owner-finance.expenses",
        source: "owner-finance",
        groupLabel: "Open" as const,
        label: "Expenses",
        kicker: "Owner",
        href: "/owner/finance/expenses",
        keywords: ["expenses", "costs"],
      },
    ];
  },

  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "owner.finance-alert", label: "Finance alerts", accent: "#B91C1C", source: "owner-finance" },
      { slug: "owner.invoice", label: "Invoice activity", accent: "#0E5A6F", source: "owner-finance" },
    ];
  },

  getBulkActions(): ReadonlyArray<OwnerBulkAction> {
    return [
      {
        id: "invoice.mark-paid",
        label: "Mark paid",
        variant: "primary",
        confirmCopy: (n) => `This will mark ${n} invoice${n === 1 ? "" : "s"} as paid and emit ${n} audit log row${n === 1 ? "" : "s"}.`,
      },
      {
        id: "invoice.void",
        label: "Void",
        variant: "destructive",
        requiresReason: true,
        confirmCopy: (n) => `Voiding ${n} invoice${n === 1 ? "" : "s"} cannot be undone. A reason is required.`,
      },
      {
        id: "invoice.remind",
        label: "Send reminder",
        variant: "secondary",
        confirmCopy: (n) => `Send a payment reminder to ${n} invoice recipient${n === 1 ? "" : "s"}.`,
      },
      {
        id: "expense.approve",
        label: "Approve expense",
        variant: "primary",
      },
      {
        id: "expense.reject",
        label: "Reject expense",
        variant: "destructive",
        requiresReason: true,
      },
    ];
  },
};
