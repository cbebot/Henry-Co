import {
  LayoutDashboard,
  Wallet,
  Activity,
  CreditCard,
  Receipt,
  Bell,
  LifeBuoy,
  MapPin,
  FileText,
  Shield,
  Settings,
  ShoppingBag,
  Sparkles,
  Palette,
  GraduationCap,
  Truck,
  Building2,
  Briefcase,
  RefreshCcw,
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
  { href: "/wallet", label: "Wallet", icon: Wallet, section: "Account" },
  { href: "/payments", label: "Payments", icon: CreditCard, section: "Financial" },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCcw, section: "Financial" },
  { href: "/invoices", label: "Invoices & Receipts", icon: Receipt, section: "Financial" },
  { href: "/notifications", label: "Notifications", icon: Bell, section: "Account" },
  { href: "/support", label: "Support", icon: LifeBuoy, section: "Account" },
  { href: "/addresses", label: "Addresses", icon: MapPin, section: "Account" },
  { href: "/documents", label: "Documents", icon: FileText, section: "Account" },
  // Divisions
  { href: "/care", label: "Care", icon: Sparkles, section: "Services" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, section: "Services" },
  { href: "/studio", label: "Studio", icon: Palette, section: "Services" },
  { href: "/learn", label: "Academy", icon: GraduationCap, section: "Services" },
  { href: "/logistics", label: "Logistics", icon: Truck, section: "Services" },
  { href: "/property", label: "Property", icon: Building2, section: "Services" },
  { href: "/jobs", label: "Jobs", icon: Briefcase, section: "Services" },
  // Settings
  { href: "/security", label: "Security", icon: Shield, section: "Settings" },
  { href: "/settings", label: "Preferences", icon: Settings, section: "Settings" },
];

export function getNavSections() {
  const sections: Record<string, NavItem[]> = {};
  for (const item of accountNavItems) {
    const section = item.section || "Other";
    if (!sections[section]) sections[section] = [];
    sections[section].push(item);
  }
  return sections;
}
