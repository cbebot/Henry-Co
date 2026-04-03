"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import { getNavSections, type NavItem } from "@/lib/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { initials } from "@/lib/format";

type SidebarProps = {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
  unreadCount: number;
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
        active
          ? "acct-nav-active"
          : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.label === "Notifications" && item.badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--acct-red)] px-1.5 text-[0.65rem] font-bold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function Sidebar({ user, unreadCount }: SidebarProps) {
  const pathname = usePathname();
  const sections = getNavSections();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[var(--acct-sidebar-width)] lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-[var(--acct-line)] lg:bg-[var(--acct-bg-soft)]">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--acct-line)] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--acct-gold)] text-xs font-bold text-white">
          H
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">Henry & Co.</p>
          <p className="text-[0.65rem] text-[var(--acct-muted)]">My Account</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 acct-scrollbar">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="mb-4">
            <p className="acct-kicker mb-1.5 px-3">{section}</p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={{
                    ...item,
                    badge: item.label === "Notifications" ? unreadCount : undefined,
                  }}
                  active={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--acct-line)] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--acct-gold-soft)] text-xs font-bold text-[var(--acct-gold)]">
              {initials(user.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--acct-ink)]">
              {user.fullName || "Account"}
            </p>
            <p className="truncate text-xs text-[var(--acct-muted)]">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg p-1.5 text-[var(--acct-muted)] hover:bg-[var(--acct-red-soft)] hover:text-[var(--acct-red)] transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
