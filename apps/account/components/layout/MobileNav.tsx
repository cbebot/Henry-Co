"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Search } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { getNavSections } from "@/lib/navigation";
import Logo from "@/components/brand/Logo";
import NotificationBell from "@/components/notifications/NotificationBell";
import UserAvatar from "@/components/layout/UserAvatar";

type MobileNavProps = {
  user: { fullName: string | null; email: string | null; avatarUrl: string | null };
};

export default function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const sections = getNavSections();

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
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--acct-line)] bg-[var(--acct-bg-soft)]/98 px-4">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-sm font-semibold">My Account</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="rounded-lg p-2 text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
            aria-label="Search account and HenryCo routes"
          >
            <Search size={18} />
          </Link>
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
          <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-[280px] overflow-y-auto bg-[var(--acct-bg-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.22)] acct-scrollbar">
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
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
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
                type="button"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                className="flex w-full min-h-[44px] items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--acct-red)] hover:bg-[var(--acct-red-soft)] disabled:cursor-wait disabled:opacity-65"
              >
                <ButtonPendingContent
                  pending={signingOut}
                  pendingLabel="Signing out…"
                  spinnerLabel="Signing out"
                  textClassName="inline-flex items-center gap-3 font-semibold"
                >
                  <>
                    <LogOut size={18} />
                    Sign out
                  </>
                </ButtonPendingContent>
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
