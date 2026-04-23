import { getStaffHqUrl } from "@henryco/config";
import type { CrossDivisionSearchResult, CrossDivisionSearchIcon } from "@henryco/intelligence";
import { getFilteredNavItems } from "@/lib/navigation";
import { viewerCanAccessSupport } from "@/lib/roles";
import type { WorkspaceDivision, WorkspaceViewer } from "@/lib/types";

const DIVISION_LABELS: Record<WorkspaceDivision, string> = {
  care: "Care",
  marketplace: "Marketplace",
  studio: "Studio",
  jobs: "Jobs",
  property: "Property",
  learn: "Learn",
  logistics: "Logistics",
};

const DIVISION_ICONS: Record<WorkspaceDivision, CrossDivisionSearchIcon> = {
  care: "sparkles",
  marketplace: "shopping-bag",
  studio: "palette",
  jobs: "briefcase",
  property: "building",
  learn: "graduation-cap",
  logistics: "truck",
};

function toAbsoluteStaffUrl(path = "/") {
  return getStaffHqUrl(path);
}

function hrefWithParams(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return toAbsoluteStaffUrl(query ? `${path}?${query}` : path);
}

function iconFromNav(name: string): CrossDivisionSearchIcon {
  const normalized = String(name || "").trim().toLowerCase();

  if (normalized.includes("headphones")) return "headphones";
  if (normalized.includes("shopping")) return "shopping-bag";
  if (normalized.includes("briefcase")) return "briefcase";
  if (normalized.includes("graduation")) return "graduation-cap";
  if (normalized.includes("building")) return "building";
  if (normalized.includes("truck")) return "truck";
  if (normalized.includes("palette")) return "palette";
  if (normalized.includes("heart")) return "sparkles";
  if (normalized.includes("dollar")) return "receipt";
  if (normalized.includes("shield")) return "shield";
  if (normalized.includes("settings")) return "settings";
  return "layout-dashboard";
}

export function getStaffSearchResults(viewer: WorkspaceViewer): CrossDivisionSearchResult[] {
  const navItems = getFilteredNavItems(viewer);
  const results: CrossDivisionSearchResult[] = navItems.map((item, index) => ({
    id: `staff-nav:${item.href}`,
    division: "staff",
    type: item.href === "/support" ? "staff_queue" : "workflow",
    title: item.label,
    subtitle: item.section,
    description:
      item.href === "/support"
        ? "Cross-division support desk with queue-aware routing."
        : `Open the ${item.label} workspace inside Staff HQ.`,
    url: toAbsoluteStaffUrl(item.href),
    authRequirement: "staff",
    visibility: "staff",
    badge: item.section,
    icon: iconFromNav(item.icon),
    priority: 90 - index,
    source: "staff_catalog",
    tags: [item.label.toLowerCase(), item.section.toLowerCase(), "staff", "workspace", "queue"],
  }));

  if (viewerCanAccessSupport(viewer)) {
    results.push(
      {
        id: "staff-support-all",
        division: "staff",
        type: "staff_queue",
        title: "Support queue",
        subtitle: "All divisions",
        description: "Open the full cross-division support queue.",
        url: toAbsoluteStaffUrl("/support"),
        authRequirement: "staff",
        visibility: "staff",
        badge: "Queue",
        icon: "headphones",
        priority: 98,
        source: "staff_catalog",
        tags: ["support", "queue", "triage", "inbox", "all"],
      },
      {
        id: "staff-support-finance",
        division: "staff",
        type: "staff_queue",
        title: "Finance support queue",
        subtitle: "Billing, wallet, invoice, payout",
        description: "Open support items tagged for finance resolution.",
        url: hrefWithParams("/support", { queue: "support-finance" }),
        authRequirement: "staff",
        visibility: "staff",
        badge: "Finance",
        icon: "receipt",
        priority: 94,
        source: "staff_catalog",
        tags: ["support", "finance", "billing", "wallet", "invoice", "queue"],
      },
      {
        id: "staff-support-trust",
        division: "staff",
        type: "staff_queue",
        title: "Trust support queue",
        subtitle: "Verification and fraud review",
        description: "Open support items tagged for trust and verification review.",
        url: hrefWithParams("/support", { queue: "support-trust" }),
        authRequirement: "staff",
        visibility: "staff",
        badge: "Trust",
        icon: "shield",
        priority: 93,
        source: "staff_catalog",
        tags: ["support", "trust", "verification", "fraud", "queue"],
      },
      {
        id: "staff-support-general",
        division: "staff",
        type: "staff_queue",
        title: "General support queue",
        subtitle: "Standard customer issues",
        description: "Open general support queue items across divisions.",
        url: hrefWithParams("/support", { queue: "support-general" }),
        authRequirement: "staff",
        visibility: "staff",
        badge: "General",
        icon: "headphones",
        priority: 92,
        source: "staff_catalog",
        tags: ["support", "general", "queue", "customer issues"],
      }
    );

    for (const membership of viewer.divisions) {
      results.push({
        id: `staff-support-division:${membership.division}`,
        division: "staff",
        type: "staff_queue",
        title: `${DIVISION_LABELS[membership.division]} support queue`,
        subtitle: "Division-filtered support desk",
        description: `Open the support queue filtered to ${DIVISION_LABELS[membership.division]}.`,
        url: hrefWithParams("/support", { division: membership.division }),
        authRequirement: "staff",
        visibility: "staff",
        badge: "Division",
        icon: DIVISION_ICONS[membership.division],
        priority: 88,
        source: "staff_catalog",
        tags: [
          "support",
          "queue",
          membership.division,
          `${DIVISION_LABELS[membership.division].toLowerCase()} queue`,
        ],
      });
    }
  }

  return results.sort((left, right) => right.priority - left.priority);
}
