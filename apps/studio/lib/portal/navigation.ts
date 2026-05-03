import {
  CreditCard,
  Folder,
  Home,
  MessageSquare,
  Receipt,
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
  { href: "/client/dashboard", label: "Dashboard", icon: Home, matchPrefix: "/client/dashboard" },
  {
    href: "/client/projects",
    label: "Projects",
    icon: Folder,
    matchPrefix: "/client/projects",
  },
  {
    href: "/client/messages",
    label: "Messages",
    icon: MessageSquare,
    matchPrefix: "/client/messages",
  },
  { href: "/client/files", label: "Files", icon: Receipt, matchPrefix: "/client/files" },
  {
    href: "/client/payments",
    label: "Payments",
    icon: CreditCard,
    matchPrefix: "/client/payments",
  },
  {
    href: "/client/profile",
    label: "Profile",
    icon: UserCircle,
    matchPrefix: "/client/profile",
  },
];

export function isNavActive(currentPath: string, item: PortalNavItem) {
  if (currentPath === item.href) return true;
  if (item.matchPrefix && currentPath.startsWith(`${item.matchPrefix}/`)) return true;
  return false;
}
