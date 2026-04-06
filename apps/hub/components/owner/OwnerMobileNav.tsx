"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { getAccountUrl } from "@henryco/config";
import { Menu, X, LogOut, ArrowLeft } from "lucide-react";
import { getOwnerNavSections } from "@/lib/owner-navigation";
import { initials } from "@/lib/format";
import Logo from "@/components/brand/Logo";

type OwnerMobileNavProps = {
  user: {
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
    ownerRole: string | null;
  };
};

export default function OwnerMobileNav({ user }: OwnerMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const pathname = usePathname();
  const sections = getOwnerNavSections();

  const isActive = (href: string) => {
    if (href === "/owner") return pathname === "/owner";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSignOutError(null);
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Owner logout failed with status ${response.status}`);
      }
      window.location.assign("/owner/login");
    } catch (error) {
      console.error(error);
      setSignOutError("We could not sign you out. Try again.");
      setSigningOut(false);
    }
  };

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--acct-line)] bg-[var(--acct-bg-soft)]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <div>
            <span className="text-sm font-semibold">Henry & Co.</span>
            <span className="ml-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--owner-accent)]">
              CMD
            </span>
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Slide-over drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[300px] overflow-y-auto owner-sidebar-bg shadow-2xl acct-scrollbar">
            {/* User header */}
            <div className="flex items-center gap-3 border-b border-[var(--acct-line)] p-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--owner-accent)]/30"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--owner-accent-soft)] text-sm font-bold text-[var(--owner-accent)]">
                  {initials(user.fullName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user.fullName || "Owner"}
                </p>
                <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--owner-accent)]">
                  {user.ownerRole || "Owner"}
                </p>
              </div>
            </div>

            {/* Back link */}
            <Link
              href={getAccountUrl("/")}
              onClick={() => setOpen(false)}
              className="mx-3 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--acct-muted)] hover:bg-[var(--acct-surface)]"
            >
              <ArrowLeft size={14} />
              Back to HenryCo Account
            </Link>

            {/* Nav sections */}
            <nav className="p-3">
              {Object.entries(sections).map(([section, items]) => (
                <div key={section} className="mb-4">
                  <p className="acct-kicker mb-1 px-3">{section}</p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                            active
                              ? "owner-nav-active rounded-l-none"
                              : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)]"
                          }`}
                        >
                          <Icon size={18} />
                          <span className="flex-1">{item.label}</span>
                        </Link>
                        {item.children && active && (
                          <div className="ml-8 mt-0.5 space-y-0.5 border-l border-[var(--acct-line)] pl-3">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive = pathname === child.href;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setOpen(false)}
                                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] transition-all ${
                                    childActive
                                      ? "owner-nav-child-active"
                                      : "text-[var(--acct-muted)]"
                                  }`}
                                >
                                  {ChildIcon && <ChildIcon size={14} />}
                                  <span>{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Sign out */}
            <div className="border-t border-[var(--acct-line)] p-3">
              <button
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--acct-red)] hover:bg-[var(--acct-red-soft)]"
              >
                <ButtonPendingContent
                  pending={signingOut}
                  pendingLabel="Signing out..."
                  spinnerLabel="Signing out"
                >
                  <>
                    <LogOut size={18} />
                    Sign out
                  </>
                </ButtonPendingContent>
              </button>
              {signOutError ? (
                <p className="mt-2 px-3 text-xs font-medium text-[var(--acct-red)]" role="status">
                  {signOutError}
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </div>
  );
}
