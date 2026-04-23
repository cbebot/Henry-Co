"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getHqUrl } from "@henryco/config";
import { ButtonPendingContent } from "@henryco/ui";
import { Menu, X, LogOut, ExternalLink, Search } from "lucide-react";
import { resolveIcon } from "@/components/StaffPrimitives";
import { initials } from "@/lib/format";
import type { WorkspaceNavItem } from "@/lib/types";

type StaffMobileNavProps = {
  viewer: {
    fullName: string | null;
    email: string | null;
    profileRole: string | null;
    hasExecutiveAccess: boolean;
  };
  sections: Record<string, WorkspaceNavItem[]>;
};

export default function StaffMobileNav({ viewer, sections }: StaffMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
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
        throw new Error(`Staff logout failed with status ${response.status}`);
      }
      window.location.assign("/login");
    } catch (error) {
      console.error(error);
      setSignOutError("We could not sign you out. Try again.");
      setSigningOut(false);
    }
  };

  return (
    <div className="lg:hidden">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--staff-line)] bg-[var(--staff-bg-soft)]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--staff-gold)] text-xs font-bold text-[var(--staff-bg)]">
            H
          </div>
          <div>
            <span className="text-sm font-semibold">Henry & Co.</span>
            <span className="ml-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--staff-gold)]">
              Staff
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="rounded-lg p-2 text-[var(--staff-muted)] hover:text-[var(--staff-ink)]"
            aria-label="Search Staff HQ"
          >
            <Search size={18} />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-[var(--staff-muted)] hover:text-[var(--staff-ink)]"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[300px] overflow-y-auto staff-sidebar-bg shadow-2xl staff-scrollbar">
            <div className="flex items-center gap-3 border-b border-[var(--staff-line)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--staff-gold-soft)] text-sm font-bold text-[var(--staff-gold)]">
                {initials(viewer.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {viewer.fullName || "Staff"}
                </p>
                <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--staff-gold)]">
                  {viewer.profileRole || "Staff"}
                </p>
              </div>
            </div>

            <nav className="p-3">
              {Object.entries(sections).map(([section, items]) => (
                <div key={section} className="mb-4">
                  <p className="staff-kicker mb-1 px-3">{section}</p>
                  {items.map((item) => {
                    const Icon = resolveIcon(item.icon);
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                          active
                            ? "staff-nav-active rounded-l-none"
                            : "text-[var(--staff-muted)] hover:bg-[var(--staff-surface)]"
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

            {viewer.hasExecutiveAccess && (
              <div className="border-t border-[var(--staff-line)] px-3 py-2">
                <a
                  href={getHqUrl("/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--staff-muted)] hover:bg-[var(--staff-surface)]"
                >
                  <ExternalLink size={14} />
                  Owner HQ
                </a>
              </div>
            )}

            <div className="border-t border-[var(--staff-line)] p-3">
              <button
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--staff-critical)] hover:bg-[var(--staff-critical-soft)]"
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
                <p className="mt-2 px-3 text-xs font-medium text-[var(--staff-critical)]" role="status">
                  {signOutError}
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}

      <div className="h-14" />
    </div>
  );
}
