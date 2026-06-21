import {
  LayoutDashboard,
  Wallet,
  Activity,
  ListTodo,
  CreditCard,
  Receipt,
  Bell,
  BellRing,
  Bookmark,
  LifeBuoy,
  MapPin,
  FileText,
  Shield,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Sparkles,
  Palette,
  GraduationCap,
  Truck,
  Building2,
  Briefcase,
  RefreshCcw,
  Users,
  Store,
  Gamepad2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  section?: string;
};

export const accountNavItems: NavItem[] = [
  // Core
  { href: "/", label: "Overview", icon: LayoutDashboard, section: "Account" },
  { href: "/activity", label: "Activity", icon: Activity, section: "Account" },
  { href: "/tasks", label: "Tasks", icon: ListTodo, section: "Account" },
  { href: "/wallet", label: "Wallet", icon: Wallet, section: "Account" },
  { href: "/payments", label: "Payments", icon: CreditCard, section: "Financial" },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCcw, section: "Financial" },
  { href: "/invoices", label: "Invoices & Receipts", icon: Receipt, section: "Financial" },
  { href: "/notifications", label: "Notifications", icon: Bell, section: "Account" },
  { href: "/support", label: "Support", icon: LifeBuoy, section: "Account" },
  { href: "/addresses", label: "Addresses", icon: MapPin, section: "Account" },
  { href: "/saved-items", label: "Saved Items", icon: Bookmark, section: "Account" },
  { href: "/documents", label: "Documents", icon: FileText, section: "Account" },
  { href: "/verification", label: "Verification", icon: ShieldCheck, section: "Account" },
  // Divisions
  { href: "/care", label: "Care", icon: Sparkles, section: "Services" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, section: "Services" },
  { href: "/studio", label: "Studio", icon: Palette, section: "Services" },
  { href: "/learn", label: "Academy", icon: GraduationCap, section: "Services" },
  { href: "/logistics", label: "Logistics", icon: Truck, section: "Services" },
  { href: "/property", label: "Property", icon: Building2, section: "Services" },
  { href: "/jobs", label: "Jobs", icon: Briefcase, section: "Services" },
  { href: "/play", label: "Henry Onyx Live", icon: Gamepad2, section: "Services" },
  // Business
  { href: "/business", label: "Business", icon: Store, section: "Business" },
  // Trust & Settings
  { href: "/referrals", label: "Referrals", icon: Users, section: "Settings" },
  { href: "/verification", label: "Submit KYC", icon: ShieldCheck, section: "Settings" },
  { href: "/security", label: "Security", icon: Shield, section: "Settings" },
  { href: "/settings", label: "Preferences", icon: Settings, section: "Settings" },
  { href: "/settings/notifications", label: "Notification Preferences", icon: BellRing, section: "Settings" },
];

// The arena nav entry is dormant until the public flag is set, so the free-play
// foundation can ship "off" in prod and light up with one env flip (the page
// itself additionally gates on the server capability via isGamingArenaReady()).
const GAMING_NAV_VISIBLE =
  process.env.NEXT_PUBLIC_GAMING_ARENA_ENABLED === "1" ||
  process.env.NEXT_PUBLIC_GAMING_ARENA_ENABLED === "true";

export function getNavSections() {
  const sections: Record<string, NavItem[]> = {};
  for (const item of accountNavItems) {
    if (item.href === "/play" && !GAMING_NAV_VISIBLE) continue;
    const section = item.section || "Other";
    if (!sections[section]) sections[section] = [];
    sections[section].push(item);
  }
  return sections;
}
