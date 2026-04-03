import { homeForRole, normalizeRole, type StaffRole } from "@/lib/auth/roles";

export type StaffShellIcon =
  | "bell-ring"
  | "clipboard-list"
  | "credit-card"
  | "folder-archive"
  | "globe"
  | "home"
  | "layout-dashboard"
  | "line-chart"
  | "messages-square"
  | "settings"
  | "shield-check"
  | "sparkles"
  | "star"
  | "truck"
  | "users"
  | "wallet";

export type StaffShellNavItem = {
  href: string;
  label: string;
  sub: string;
  icon: StaffShellIcon;
  badge?: number;
  matchers?: string[];
};

export type StaffShellNavSection = {
  label: string;
  items: StaffShellNavItem[];
};

export type StaffShellRouteMeta = {
  title: string;
  description: string;
  sectionLabel: string;
  subnav: StaffShellNavItem[];
};

function withMatchers(item: StaffShellNavItem) {
  return {
    ...item,
    matchers: item.matchers && item.matchers.length > 0 ? item.matchers : [item.href],
  } satisfies StaffShellNavItem;
}

function ownerSections(unreadCount = 0): StaffShellNavSection[] {
  return [
    {
      label: "Command",
      items: [
        withMatchers({
          href: "/owner",
          label: "Overview",
          sub: "Command surface for finance, service pressure, and live company health",
          icon: "layout-dashboard",
        }),
        withMatchers({
          href: "/owner/insights",
          label: "Insights",
          sub: "Growth, service risk, backlog pressure, and owner advice from live signals",
          icon: "line-chart",
        }),
        withMatchers({
          href: "/owner/notifications",
          label: "Notifications",
          sub: "Critical alerts, transport issues, and company-wide escalations",
          icon: "bell-ring",
          badge: unreadCount || undefined,
        }),
      ],
    },
    {
      label: "Operations",
      items: [
        withMatchers({
          href: "/owner/bookings",
          label: "Bookings",
          sub: "Queue oversight, archive visibility, and payment-linked booking control",
          icon: "clipboard-list",
        }),
        withMatchers({
          href: "/owner/records",
          label: "Records",
          sub: "Garment registry, archive evidence, and intake accountability",
          icon: "folder-archive",
        }),
        withMatchers({
          href: "/owner/reviews",
          label: "Reviews",
          sub: "Moderation, trust, and service reputation",
          icon: "star",
        }),
      ],
    },
    {
      label: "Company",
      items: [
        withMatchers({
          href: "/owner/finance",
          label: "Finance",
          sub: "Cash movement, approvals, and margin pressure",
          icon: "wallet",
        }),
        withMatchers({
          href: "/owner/pricing",
          label: "Pricing",
          sub: "Published service rates, manager proposals, and final owner approval",
          icon: "sparkles",
        }),
        withMatchers({
          href: "/owner/staff",
          label: "Staff",
          sub: "Roles, access, readiness, and safe account control",
          icon: "users",
        }),
        withMatchers({
          href: "/owner/security",
          label: "Security",
          sub: "Audit activity, transport health, and sender diagnostics",
          icon: "shield-check",
        }),
        withMatchers({
          href: "/owner/settings",
          label: "Settings",
          sub: "Brand, media, payment identity, and customer messaging",
          icon: "settings",
        }),
      ],
    },
  ];
}

function managerSections(unreadCount = 0): StaffShellNavSection[] {
  return [
    {
      label: "Overview",
      items: [
        withMatchers({
          href: "/manager",
          label: "Overview",
          sub: "Daily execution, queue pressure, and staffing readiness",
          icon: "layout-dashboard",
        }),
        withMatchers({
          href: "/manager/notifications",
          label: "Notifications",
          sub: "Ops alerts, stale work, escalation pressure, and staffing gaps",
          icon: "bell-ring",
          badge: unreadCount || undefined,
        }),
      ],
    },
    {
      label: "Workflows",
      items: [
        withMatchers({
          href: "/manager/operations",
          label: "Operations",
          sub: "Booking queue, intake control, status movement, and payment capture",
          icon: "clipboard-list",
        }),
        withMatchers({
          href: "/manager/pricing",
          label: "Pricing",
          sub: "Draft proposals, pricing experiments, and owner approval handoff",
          icon: "sparkles",
        }),
        withMatchers({
          href: "/manager/expenses",
          label: "Expenses",
          sub: "Manager-recorded costs awaiting owner review",
          icon: "credit-card",
        }),
      ],
    },
    {
      label: "Cross-team",
      items: [
        withMatchers({
          href: "/support",
          label: "Support",
          sub: "Customer inbox, payment proofs, and moderation handoff",
          icon: "messages-square",
          matchers: [
            "/support",
            "/support/inbox",
            "/support/payments",
            "/support/reviews",
            "/support/archive",
            "/support/notifications",
          ],
        }),
      ],
    },
  ];
}

function supportSections(unreadCount = 0): StaffShellNavSection[] {
  return [
    {
      label: "Overview",
      items: [
        withMatchers({
          href: "/support",
          label: "Overview",
          sub: "Workload, response pressure, and channel readiness",
          icon: "layout-dashboard",
        }),
        withMatchers({
          href: "/support/notifications",
          label: "Notifications",
          sub: "Inbox, review, payment, and stale-thread alerts",
          icon: "bell-ring",
          badge: unreadCount || undefined,
        }),
      ],
    },
    {
      label: "Queues",
      items: [
        withMatchers({
          href: "/support/inbox",
          label: "Inbox",
          sub: "Active customer threads with list and detail workflow",
          icon: "messages-square",
        }),
        withMatchers({
          href: "/support/payments",
          label: "Payments",
          sub: "Payment proof review and customer follow-up",
          icon: "credit-card",
        }),
        withMatchers({
          href: "/support/reviews",
          label: "Reviews",
          sub: "Review moderation and public trust workflow",
          icon: "star",
        }),
        withMatchers({
          href: "/support/archive",
          label: "Archive",
          sub: "Resolved conversations and closed-loop history",
          icon: "folder-archive",
        }),
      ],
    },
  ];
}

function riderSections(unreadCount = 0): StaffShellNavSection[] {
  return [
    {
      label: "Routing",
      items: [
        withMatchers({
          href: "/rider",
          label: "Overview",
          sub: "Route health, active volume, and today’s movement board",
          icon: "layout-dashboard",
        }),
        withMatchers({
          href: "/rider/notifications",
          label: "Notifications",
          sub: "Pickup, delivery, and route-pressure alerts only",
          icon: "bell-ring",
          badge: unreadCount || undefined,
        }),
      ],
    },
    {
      label: "Queues",
      items: [
        withMatchers({
          href: "/rider/pickups",
          label: "Pickups",
          sub: "Collection-ready requests grouped by urgency",
          icon: "clipboard-list",
        }),
        withMatchers({
          href: "/rider/deliveries",
          label: "Deliveries",
          sub: "Return movement and completion confirmation",
          icon: "truck",
        }),
        withMatchers({
          href: "/rider/history",
          label: "History",
          sub: "Delivered movement history and completed route trace",
          icon: "folder-archive",
        }),
        withMatchers({
          href: "/rider/expenses",
          label: "Expenses",
          sub: "Route-linked fuel, transfer, and delivery costs",
          icon: "credit-card",
        }),
      ],
    },
  ];
}

function staffSections(unreadCount = 0): StaffShellNavSection[] {
  return [
    {
      label: "Execution",
      items: [
        withMatchers({
          href: "/staff",
          label: "Overview",
          sub: "Service readiness, visit load, and recurring cadence health",
          icon: "layout-dashboard",
        }),
        withMatchers({
          href: "/staff/notifications",
          label: "Notifications",
          sub: "Assigned service execution and customer-ready handoffs only",
          icon: "bell-ring",
          badge: unreadCount || undefined,
        }),
      ],
    },
    {
      label: "Queues",
      items: [
        withMatchers({
          href: "/staff/assignments",
          label: "Assignments",
          sub: "Active home and office visits in grouped priority rails",
          icon: "clipboard-list",
        }),
        withMatchers({
          href: "/staff/history",
          label: "History",
          sub: "Completed and recurring visit history for later follow-through",
          icon: "folder-archive",
        }),
      ],
    },
  ];
}

export function normalizeStaffRole(value?: string | null): StaffRole {
  const normalized = normalizeRole(value);
  return normalized === "customer" ? "staff" : normalized;
}

export function roleHome(value?: string | null) {
  return homeForRole(normalizeStaffRole(value));
}

export function roleLabel(value?: string | null) {
  const role = normalizeStaffRole(value);
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function getRoleNavSections(role: StaffRole, unreadCount = 0) {
  if (role === "owner") return ownerSections(unreadCount);
  if (role === "manager") return managerSections(unreadCount);
  if (role === "support") return supportSections(unreadCount);
  if (role === "rider") return riderSections(unreadCount);
  return staffSections(unreadCount);
}

export function getRoleNav(role: StaffRole, unreadCount = 0) {
  return getRoleNavSections(role, unreadCount).flatMap((section) => section.items);
}

export function getRouteMetaForPath(role: StaffRole, pathname: string, unreadCount = 0): StaffShellRouteMeta {
  const sections = getRoleNavSections(role, unreadCount);

  for (const section of sections) {
    const matched = section.items.find((item) =>
      (item.matchers || [item.href]).some((matcher) =>
        matcher === "/" ? pathname === "/" : pathname === matcher || pathname.startsWith(`${matcher}/`)
      )
    );

    if (matched) {
      return {
        title: matched.label,
        description: matched.sub,
        sectionLabel: section.label,
        subnav: section.items,
      };
    }
  }

  const home = getRoleNav(role, unreadCount)[0];
  return {
    title: home?.label || "Workspace",
    description: home?.sub || "Role-specific operations workspace.",
    sectionLabel: "Overview",
    subnav: sections[0]?.items || [],
  };
}

export function roleSummary(role: StaffRole) {
  if (role === "owner") {
    return "Company-wide visibility across service performance, finance, staffing, transport, and brand trust.";
  }
  if (role === "manager") {
    return "Daily operational control for queue movement, intake accuracy, and team coordination.";
  }
  if (role === "support") {
    return "Customer conversation ownership, proof review, moderation, and reply quality.";
  }
  if (role === "rider") {
    return "Pickup and return movement only, with route-ready clarity and minimal clutter.";
  }
  return "Home and office execution, assignment readiness, and recurring visit continuity.";
}

export const quickLinks: StaffShellNavItem[] = [
  withMatchers({
    href: "/",
    label: "Public home",
    sub: "Customer landing experience",
    icon: "home",
  }),
  withMatchers({
    href: "/book",
    label: "Booking flow",
    sub: "Customer request and payment handoff",
    icon: "sparkles",
  }),
  withMatchers({
    href: "/pricing",
    label: "Pricing",
    sub: "Live service pricing and packages",
    icon: "wallet",
  }),
  withMatchers({
    href: "/track",
    label: "Tracking",
    sub: "Customer-facing service timeline",
    icon: "globe",
  }),
];
