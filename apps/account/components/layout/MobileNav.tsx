"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { getNavSections } from "@/lib/navigation";
import Logo from "@/components/brand/Logo";
import NotificationBell from "@/components/notifications/NotificationBell";
import UserAvatar from "@/components/layout/UserAvatar";

type MobileNavProps = {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
};

export default function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const sections = getNavSections();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
    });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--acct-line)] bg-[var(--acct-bg-soft)]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-sm font-semibold">My Account</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell buttonClassName="text-[var(--acct-muted)] hover:text-[var(--acct-ink)]" />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Slide-over drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[280px] overflow-y-auto bg-[var(--acct-bg-soft)] shadow-2xl acct-scrollbar">
            {/* User header */}
            <div className="flex items-center gap-3 border-b border-[var(--acct-line)] p-4">
              <UserAvatar
                name={user.fullName}
                src={user.avatarUrl}
                size={40}
                roundedClassName="rounded-full"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.fullName || "Account"}</p>
                <p className="truncate text-xs text-[var(--acct-muted)]">{user.email}</p>
              </div>
            </div>

            {/* Nav sections */}
            <nav className="p-3">
              {Object.entries(sections).map(([section, items]) => (
                <div key={section} className="mb-4">
                  <p className="acct-kicker mb-1 px-3">{section}</p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                          active
                            ? "acct-nav-active"
                            : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)]"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Sign out */}
            <div className="border-t border-[var(--acct-line)] p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--acct-red)] hover:bg-[var(--acct-red-soft)]"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </div>
  );
}
