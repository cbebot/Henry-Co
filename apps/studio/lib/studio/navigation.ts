import type { StudioRole } from "@/lib/studio/types";

export type StudioNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function clientNav(active: string): StudioNavItem[] {
  return [
    { href: "/client", label: "Overview", active: active === "/client" },
    { href: "/client/proposals", label: "Proposals", active: active === "/client/proposals" },
    { href: "/client/projects", label: "Projects", active: active === "/client/projects" },
    { href: "/client/files", label: "Files", active: active === "/client/files" },
    { href: "/client/reviews", label: "Reviews", active: active === "/client/reviews" },
  ];
}

export function salesNav(active: string): StudioNavItem[] {
  return [
    { href: "/sales", label: "Overview", active: active === "/sales" },
    { href: "/sales/leads", label: "Leads", active: active === "/sales/leads" },
    { href: "/sales/proposals", label: "Proposals", active: active === "/sales/proposals" },
    { href: "/sales/match", label: "Matching", active: active === "/sales/match" },
  ];
}

export function pmNav(active: string): StudioNavItem[] {
  return [
    { href: "/pm", label: "Overview", active: active === "/pm" },
    { href: "/pm/projects", label: "Projects", active: active === "/pm/projects" },
    { href: "/pm/revisions", label: "Revisions", active: active === "/pm/revisions" },
  ];
}

export function financeNav(active: string): StudioNavItem[] {
  return [
    { href: "/finance", label: "Overview", active: active === "/finance" },
    { href: "/finance/payments", label: "Payments", active: active === "/finance/payments" },
    { href: "/finance/invoices", label: "Invoices", active: active === "/finance/invoices" },
  ];
}

export function deliveryNav(active: string): StudioNavItem[] {
  return [
    { href: "/delivery", label: "Overview", active: active === "/delivery" },
    { href: "/delivery/assets", label: "Asset vault", active: active === "/delivery/assets" },
  ];
}

export function ownerNav(active: string): StudioNavItem[] {
  return [
    { href: "/owner", label: "Overview", active: active === "/owner" },
    { href: "/sales", label: "Sales", active: active === "/sales" },
    { href: "/pm", label: "Projects", active: active === "/pm" },
    { href: "/finance", label: "Finance", active: active === "/finance" },
    { href: "/delivery", label: "Delivery", active: active === "/delivery" },
    { href: "/support", label: "Support", active: active === "/support" },
  ];
}

export function supportNav(active: string): StudioNavItem[] {
  return [
    { href: "/support", label: "Inbox", active: active === "/support" },
    { href: "/support?view=urgent", label: "Urgent", active: active === "/support?view=urgent" },
  ];
}

export function navForPrimaryRole(role: StudioRole, active: string) {
  switch (role) {
    case "studio_owner":
      return ownerNav(active);
    case "sales_consultation":
      return salesNav(active);
    case "project_manager":
      return pmNav(active);
    case "finance":
      return financeNav(active);
    case "client_success":
      return supportNav(active);
    case "developer_designer":
      return deliveryNav(active);
    default:
      return clientNav(active);
  }
}
