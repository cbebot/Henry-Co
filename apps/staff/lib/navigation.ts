import type { WorkspaceViewer, WorkspaceNavItem, WorkspacePermission, WorkspaceDivision } from "@/lib/types";
import {
  viewerCanAccessOperations,
  viewerCanAccessSupport,
  viewerCanAccessSystemSettings,
} from "@/lib/roles";

export const staffNavItems: WorkspaceNavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "LayoutDashboard",
    section: "Command",
  },
  {
    href: "/support",
    label: "Support",
    icon: "Headphones",
    section: "Workspaces",
  },
  {
    href: "/care",
    label: "Care",
    icon: "Heart",
    section: "Workspaces",
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: "ShoppingBag",
    section: "Workspaces",
  },
  {
    href: "/studio",
    label: "Studio",
    icon: "Palette",
    section: "Workspaces",
  },
  {
    href: "/jobs",
    label: "Jobs",
    icon: "Briefcase",
    section: "Workspaces",
  },
  {
    href: "/learn",
    label: "Learn",
    icon: "GraduationCap",
    section: "Workspaces",
  },
  {
    href: "/property",
    label: "Property",
    icon: "Building2",
    section: "Workspaces",
  },
  {
    href: "/logistics",
    label: "Logistics",
    icon: "Truck",
    section: "Workspaces",
  },
  {
    href: "/operations",
    label: "Operations",
    icon: "Cog",
    section: "Operations",
  },
  {
    href: "/finance",
    label: "Finance",
    icon: "DollarSign",
    section: "Operations",
  },
  {
    href: "/kyc",
    label: "KYC Review",
    icon: "ShieldCheck",
    section: "Operations",
  },
  {
    href: "/workforce",
    label: "Workforce",
    icon: "Users",
    section: "Operations",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "Settings",
    section: "System",
  },
];

const DIVISION_NAV_MAP: Record<string, WorkspaceDivision> = {
  "/care": "care",
  "/marketplace": "marketplace",
  "/studio": "studio",
  "/jobs": "jobs",
  "/learn": "learn",
  "/property": "property",
  "/logistics": "logistics",
};

const PERMISSION_NAV_MAP: Record<string, WorkspacePermission> = {
  "/finance": "division.finance",
  "/kyc": "division.moderate",
  "/workforce": "staff.directory.view",
  "/settings": "settings.view",
};

export function getFilteredNavItems(viewer: WorkspaceViewer): WorkspaceNavItem[] {
  const viewerDivisions = new Set(viewer.divisions.map((d) => d.division));

  return staffNavItems.filter((item) => {
    if (item.href === "/") {
      return true;
    }

    if (item.href === "/support") return viewerCanAccessSupport(viewer);
    if (item.href === "/operations") return viewerCanAccessOperations(viewer);
    if (item.href === "/settings") return viewerCanAccessSystemSettings(viewer);

    const requiredDivision = DIVISION_NAV_MAP[item.href];
    if (requiredDivision) {
      return viewerDivisions.has(requiredDivision);
    }

    const requiredPermission = PERMISSION_NAV_MAP[item.href];
    if (requiredPermission) {
      return viewer.permissions.includes(requiredPermission);
    }

    return true;
  });
}

export function getNavSections(items: WorkspaceNavItem[]): Record<string, WorkspaceNavItem[]> {
  const sections: Record<string, WorkspaceNavItem[]> = {};
  for (const item of items) {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  }
  return sections;
}
