"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  MessageSquareQuote,
  Settings2,
  Tags,
} from "lucide-react";

const items = [
  { href: "/owner", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/owner/pricing", label: "Pricing", icon: Tags },
  { href: "/owner/settings", label: "Settings", icon: Settings2 },
  { href: "/owner/reviews", label: "Reviews", icon: MessageSquareQuote },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function OwnerNav() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/owner"
            ? pathname === "/owner"
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              active
                ? "border border-white/10 bg-white/10 text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}