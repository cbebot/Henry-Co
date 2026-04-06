import {
  LayoutDashboard,
  Building2,
  Cog,
  DollarSign,
  Users,
  MessageSquare,
  Palette,
  Bot,
  Shield,
  TrendingUp,
  Layers,
  Receipt,
  PiggyBank,
  UserPlus,
  KeyRound,
  Mail,
  Globe,
  Settings,
  ScrollText,
  AlertTriangle,
  BarChart3,
  Megaphone,
  MessagesSquare,
  Sparkles,
  BookOpen,
  Network,
  CircuitBoard,
  ListTodo,
  Siren,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { divisionLabel } from "@/lib/format";

export type OwnerNavChild = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export type OwnerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: string;
  children?: OwnerNavChild[];
};

export const ownerNavItems: OwnerNavItem[] = [
  // ── Command ──
  {
    href: "/owner",
    label: "Executive Overview",
    icon: LayoutDashboard,
    section: "Command",
  },

  // ── Operations ──
  {
    href: "/owner/divisions",
    label: "Divisions",
    icon: Building2,
    section: "Operations",
    children: [
      { href: "/owner/divisions", label: "All Divisions", icon: Layers },
      { href: "/owner/divisions/performance", label: "Performance", icon: BarChart3 },
    ],
  },
  {
    href: "/owner/operations",
    label: "Operations Center",
    icon: Cog,
    section: "Operations",
    children: [
      { href: "/owner/operations", label: "Overview", icon: LayoutDashboard },
      { href: "/owner/operations/approvals", label: "Approval center", icon: ClipboardCheck },
      { href: "/owner/operations/queues", label: "Task Queues", icon: ListTodo },
      { href: "/owner/operations/alerts", label: "Alerts", icon: AlertTriangle },
      { href: "/owner/divisions/performance", label: "Division Ranking", icon: BarChart3 },
    ],
  },

  // ── Finance ──
  {
    href: "/owner/finance",
    label: "Finance Center",
    icon: DollarSign,
    section: "Finance",
    children: [
      { href: "/owner/finance", label: "Overview", icon: TrendingUp },
      { href: "/owner/finance/revenue", label: "Revenue", icon: BarChart3 },
      { href: "/owner/finance/invoices", label: "Invoices", icon: Receipt },
      { href: "/owner/finance/expenses", label: "Expenses", icon: PiggyBank },
    ],
  },

  // ── Workforce ──
  {
    href: "/owner/staff",
    label: "Staff & Workforce",
    icon: Users,
    section: "Workforce",
    children: [
      { href: "/owner/staff", label: "Overview", icon: Users },
      { href: "/owner/staff/directory", label: "Directory", icon: Users },
      { href: "/owner/staff/tree", label: "Org tree", icon: Network },
      { href: "/owner/staff/invite", label: "Invite Member", icon: UserPlus },
      { href: "/owner/staff/roles", label: "Roles & Permissions", icon: KeyRound },
    ],
  },

  // ── Communications ──
  {
    href: "/owner/messaging",
    label: "Messaging Center",
    icon: MessageSquare,
    section: "Communications",
    children: [
      { href: "/owner/messaging", label: "Overview", icon: Mail },
      { href: "/owner/messaging/team", label: "Team internal chat", icon: MessagesSquare },
      { href: "/owner/messaging/queues", label: "Delivery Queues", icon: Megaphone },
      { href: "/owner/messaging/alerts", label: "Owner Alerts", icon: Siren },
    ],
  },

  // ── Brand ──
  {
    href: "/owner/brand",
    label: "Brand & Subdomains",
    icon: Palette,
    section: "Brand",
    children: [
      { href: "/owner/brand", label: "Brand Overview", icon: Sparkles },
      { href: "/owner/brand/settings", label: "Brand Settings", icon: Settings },
      { href: "/owner/brand/subdomains", label: "Subdomains", icon: Globe },
      { href: "/owner/brand/pages", label: "Pages & Content", icon: BookOpen },
    ],
  },

  // ── Intelligence ──
  {
    href: "/owner/ai",
    label: "AI & Helpers",
    icon: Bot,
    section: "Intelligence",
    children: [
      { href: "/owner/ai", label: "Helper Dashboard", icon: CircuitBoard },
      { href: "/owner/ai/signals", label: "Signals", icon: Network },
      { href: "/owner/ai/insights", label: "Insights", icon: Sparkles },
    ],
  },

  // ── System ──
  {
    href: "/owner/settings",
    label: "Settings & Security",
    icon: Shield,
    section: "System",
    children: [
      { href: "/owner/settings", label: "General", icon: Settings },
      { href: "/owner/settings/comms", label: "Communication rules", icon: MessagesSquare },
      { href: "/owner/settings/security", label: "Security", icon: Shield },
      { href: "/owner/settings/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
];

export function getOwnerNavSections() {
  const sections: Record<string, OwnerNavItem[]> = {};
  for (const item of ownerNavItems) {
    const section = item.section;
    if (!sections[section]) sections[section] = [];
    sections[section].push(item);
  }
  return sections;
}

export function getOwnerBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [
    { label: "Command Center", href: "/owner" },
  ];

  if (pathname === "/owner") return crumbs;

  for (const item of ownerNavItems) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (item.href !== "/owner") {
        crumbs.push({ label: item.label, href: item.href });
      }
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.href && child.href !== item.href) {
            crumbs.push({ label: child.label, href: child.href });
          }
        }
      }
      break;
    }
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "owner" && parts[1] === "divisions" && parts[2] && parts[2] !== "performance") {
    const href = `/owner/divisions/${parts[2]}`;
    if (!crumbs.some((crumb) => crumb.href === href)) {
      crumbs.push({ label: divisionLabel(parts[2]), href });
    }
  }
  if (parts[0] === "owner" && parts[1] === "staff" && parts[2] === "users" && parts[3]) {
    crumbs.push({ label: "Directory", href: "/owner/staff/directory" });
    crumbs.push({ label: "Member profile", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "operations" && parts[2] === "queues") {
    crumbs.push({ label: "Task Queues", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "messaging" && parts[2] === "queues") {
    crumbs.push({ label: "Delivery Queues", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "messaging" && parts[2] === "alerts") {
    crumbs.push({ label: "Owner Alerts", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "brand" && parts[2] === "subdomains") {
    crumbs.push({ label: "Subdomains", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "brand" && parts[2] === "pages") {
    crumbs.push({ label: "Pages", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "brand" && parts[2] === "settings") {
    crumbs.push({ label: "Brand Settings", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "ai" && parts[2] === "signals") {
    crumbs.push({ label: "Signals", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "ai" && parts[2] === "insights") {
    crumbs.push({ label: "Insights", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "finance" && parts[2]) {
    crumbs.push({ label: divisionLabel(parts[2]), href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "settings" && parts[2] === "audit") {
    crumbs.push({ label: "Audit Log", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "settings" && parts[2] === "security") {
    crumbs.push({ label: "Security", href: pathname });
  }
  if (parts[0] === "owner" && parts[1] === "settings" && parts[2] === "comms") {
    crumbs.push({ label: "Communication rules", href: pathname });
  }

  return crumbs;
}
