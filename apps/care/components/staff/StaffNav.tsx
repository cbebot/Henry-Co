"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  ClipboardList,
  LayoutDashboard,
  MessageSquareQuote,
  Settings2,
  Shield,
  Users2,
  Truck,
  Headset,
  ChevronRight,
  Sparkles,
  PackageSearch,
} from "lucide-react";
import type { AppRole } from "@/lib/auth/roles";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function getSections(role: AppRole): NavSection[] {
  if (role === "owner") {
    return [
      {
        title: "Core control",
        items: [
          { href: "/owner", label: "Overview", icon: LayoutDashboard },
          { href: "/owner/bookings", label: "Bookings", icon: ClipboardList },
          { href: "/owner/pricing", label: "Pricing", icon: BadgeDollarSign },
          { href: "/owner/settings", label: "Settings", icon: Settings2 },
          { href: "/owner/reviews", label: "Reviews", icon: MessageSquareQuote },
          { href: "/owner/staff", label: "Staff", icon: Users2 },
          { href: "/owner/security", label: "Security", icon: Shield },
        ],
      },
      {
        title: "Operations",
        items: [
          { href: "/manager", label: "Manager View", icon: Sparkles },
          { href: "/rider", label: "Rider View", icon: Truck },
          { href: "/support", label: "Support View", icon: Headset },
        ],
      },
    ];
  }

  if (role === "manager") {
    return [
      {
        title: "Manager control",
        items: [
          { href: "/manager", label: "Operations", icon: LayoutDashboard },
          { href: "/owner/bookings", label: "Bookings Queue", icon: ClipboardList },
          { href: "/support", label: "Support Desk", icon: Headset },
          { href: "/owner/reviews", label: "Reviews Queue", icon: MessageSquareQuote },
        ],
      },
    ];
  }

  if (role === "rider") {
    return [
      {
        title: "Delivery flow",
        items: [{ href: "/rider", label: "Rider Dashboard", icon: Truck }],
      },
    ];
  }

  if (role === "support") {
    return [
      {
        title: "Customer help",
        items: [
          { href: "/support", label: "Support Dashboard", icon: Headset },
          { href: "/track", label: "Tracking Page", icon: PackageSearch },
        ],
      },
    ];
  }

  return [];
}

export default function StaffNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const sections = getSections(role);

  function isActive(href: string) {
    if (href === "/owner") return pathname === "/owner";
    return pathname?.startsWith(href);
  }

  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            {section.title}
          </div>

          <div className="grid gap-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl border px-4 py-3 transition",
                    active
                      ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 text-zinc-950 shadow-sm dark:text-white"
                      : "border-black/10 bg-white/80 text-zinc-700 hover:border-black/15 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72 dark:hover:bg-white/[0.07]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                        active
                          ? "bg-[color:var(--accent)]/15"
                          : "bg-black/[0.04] dark:bg-white/5"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          active
                            ? "text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]"
                            : "text-zinc-600 dark:text-white/60"
                        )}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-xs text-zinc-500 dark:text-white/42">
                        {item.href}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition",
                      active
                        ? "text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]"
                        : "text-zinc-400 group-hover:translate-x-0.5 dark:text-white/35"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
