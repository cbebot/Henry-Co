import {
  CreditCard,
  FileText,
  Folder,
  Home,
  MessageSquare,
  Sparkles,
  Star,
  type LucideIcon,
  UserCircle,
} from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
};

export const portalNavItems: PortalNavItem[] = [
  { href: "/client", label: "Home", icon: Home },
  {
    href: "/client/projects",
    label: "Projects",
    icon: Folder,
    matchPrefix: "/client/projects",
  },
  {
    href: "/client/proposals",
    label: "Proposals",
    icon: Sparkles,
    matchPrefix: "/client/proposals",
  },
  {
    href: "/client/messages",
    label: "Messages",
    icon: MessageSquare,
    matchPrefix: "/client/messages",
  },
  { href: "/client/files", label: "Files", icon: FileText, matchPrefix: "/client/files" },
  {
    href: "/client/payments",
    label: "Payments",
    icon: CreditCard,
    matchPrefix: "/client/payments",
  },
  {
    href: "/client/reviews",
    label: "Reviews",
    icon: Star,
    matchPrefix: "/client/reviews",
  },
  {
    href: "/client/profile",
    label: "Profile",
    icon: UserCircle,
    matchPrefix: "/client/profile",
  },
];

/**
 * Five-item subset for the mobile bottom nav. The full eight-item list
 * is fine on a desktop sidebar but would crowd a phone footer; we trim
 * to the highest-frequency surfaces (Home, Projects, Messages, Payments,
 * Profile). Proposals / Files / Reviews remain reachable via Home and
 * each project's detail tabs.
 */
export const portalMobileNavItems: PortalNavItem[] = portalNavItems.filter((item) =>
  ["/client", "/client/projects", "/client/messages", "/client/payments", "/client/profile"].includes(item.href),
);

export function isNavActive(currentPath: string, item: PortalNavItem) {
  if (currentPath === item.href) return true;
  if (item.matchPrefix && currentPath.startsWith(`${item.matchPrefix}/`)) return true;
  // Treat /client/dashboard (legacy) as Home — it redirects to /client
  if (item.href === "/client" && currentPath === "/client/dashboard") return true;
  return false;
}
