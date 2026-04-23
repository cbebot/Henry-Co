"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Search } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { getNavSections, type NavItem } from "@/lib/navigation";
import Logo from "@/components/brand/Logo";
import NotificationBell from "@/components/notifications/NotificationBell";
import UserAvatar from "@/components/layout/UserAvatar";

type SidebarProps = {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
        active
          ? "acct-nav-active"
          : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sections = getNavSections();
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[var(--acct-sidebar-width)] lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-[var(--acct-line)] lg:bg-[var(--acct-bg-soft)]">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--acct-line)] px-5">
        <Logo size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">Henry & Co.</p>
          <p className="text-[0.65rem] text-[var(--acct-muted)]">My Account</p>
        </div>
        <Link
          href="/search"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--acct-muted)] transition-colors hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
          aria-label="Search account and HenryCo routes"
          title="Search account and HenryCo routes"
        >
          <Search size={17} />
        </Link>
        <NotificationBell />
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
                  item={item}
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
          <UserAvatar
            name={user.fullName}
            src={user.avatarUrl}
            size={36}
            roundedClassName="rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--acct-ink)]">
              {user.fullName || "Account"}
            </p>
            <p className="truncate text-xs text-[var(--acct-muted)]">{user.email}</p>
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="rounded-lg p-1.5 text-[var(--acct-muted)] transition-colors hover:bg-[var(--acct-red-soft)] hover:text-[var(--acct-red)] disabled:cursor-wait disabled:opacity-60"
            title="Sign out"
            aria-busy={signingOut}
          >
            {signingOut ? (
              <span className="inline-flex h-4 w-4 items-center justify-center">
                <HenryCoActivityIndicator size="sm" label="Signing out" />
              </span>
            ) : (
              <LogOut size={16} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
