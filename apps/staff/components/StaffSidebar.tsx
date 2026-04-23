"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { getHqUrl } from "@henryco/config";
import { LogOut, ChevronDown, ChevronRight, ExternalLink, Search } from "lucide-react";
import { createElement, useState } from "react";
import { resolveIcon } from "@/components/StaffPrimitives";
import { initials } from "@/lib/format";
import type { WorkspaceNavItem } from "@/lib/types";

type StaffSidebarProps = {
  viewer: {
    fullName: string | null;
    email: string | null;
    profileRole: string | null;
    hasExecutiveAccess: boolean;
  };
  sections: Record<string, WorkspaceNavItem[]>;
  divisionSet: string[];
};

function NavLink({
  item,
  pathname,
  divisionSet,
}: {
  item: WorkspaceNavItem;
  pathname: string;
  divisionSet: string[];
}) {
  const isActive = item.href === "/"
    ? pathname === "/"
    : pathname === item.href || pathname.startsWith(item.href + "/");
  const icon = resolveIcon(item.icon);

  const divisionKey = item.href.replace("/", "");
  const isDivision = divisionSet.includes(divisionKey);

  return (
    <div className="mb-0.5">
      <Link
        href={item.href}
        className={`group flex items-center gap-3 rounded-r-xl px-4 py-2.5 text-sm transition-all ${
          isActive
            ? "staff-nav-active"
            : "text-[var(--staff-muted)] hover:bg-[var(--staff-surface)] hover:text-[var(--staff-ink)]"
        }`}
      >
        {createElement(icon, { size: 18, strokeWidth: isActive ? 2.2 : 1.8 })}
        <span className="flex-1 truncate">{item.label}</span>
        {isDivision && (
          <span className="rounded-md bg-[var(--staff-accent-soft)] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--staff-accent)]">
            div
          </span>
        )}
        {item.badge != null && item.badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--staff-gold)] px-1.5 text-[0.65rem] font-bold text-[var(--staff-bg)]">
            {item.badge}
          </span>
        )}
      </Link>
    </div>
  );
}

function SidebarSection({
  label,
  items,
  pathname,
  divisionSet,
  defaultExpanded = true,
}: {
  label: string;
  items: WorkspaceNavItem[];
  pathname: string;
  divisionSet: string[];
  defaultExpanded?: boolean;
}) {
  const hasActiveItem = items.some((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [expanded, setExpanded] = useState(defaultExpanded || hasActiveItem);

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="staff-kicker mb-1.5 flex w-full items-center justify-between px-5"
      >
        <span>{label}</span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {expanded &&
        items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            divisionSet={divisionSet}
          />
        ))}
    </div>
  );
}

export default function StaffSidebar({ viewer, sections, divisionSet }: StaffSidebarProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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
    <aside className="hidden lg:flex lg:flex-col lg:w-[var(--staff-sidebar-width)] lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-[var(--staff-line)] staff-sidebar-bg">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--staff-line)] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--staff-gold)] text-sm font-bold text-[var(--staff-bg)]">
          H
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--staff-ink)]">
            Henry & Co.
          </p>
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--staff-gold)]">
            Staff HQ
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--staff-muted)] transition-colors hover:bg-[var(--staff-surface)] hover:text-[var(--staff-ink)]"
          aria-label="Search Staff HQ"
          title="Search Staff HQ"
        >
          <Search size={17} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 staff-scrollbar">
        {Object.entries(sections).map(([section, items]) => (
          <SidebarSection
            key={section}
            label={section}
            items={items}
            pathname={pathname}
            divisionSet={divisionSet}
            defaultExpanded={section === "Command" || section === "Workspaces"}
          />
        ))}
      </nav>

      {viewer.hasExecutiveAccess && (
        <div className="border-t border-[var(--staff-line)] px-3 py-2">
          <a
            href={getHqUrl("/")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--staff-muted)] hover:bg-[var(--staff-surface)] hover:text-[var(--staff-ink)] transition-all"
          >
            <ExternalLink size={14} />
            Owner HQ
          </a>
        </div>
      )}

      <div className="border-t border-[var(--staff-line)] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--staff-gold-soft)] text-xs font-bold text-[var(--staff-gold)] ring-2 ring-[var(--staff-gold)]/30">
            {initials(viewer.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--staff-ink)]">
              {viewer.fullName || "Staff"}
            </p>
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--staff-gold)]">
              {viewer.profileRole || "Staff"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            void handleSignOut();
          }}
          disabled={signingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--staff-critical)] transition-colors hover:bg-[var(--staff-critical-soft)]"
        >
          <ButtonPendingContent
            pending={signingOut}
            pendingLabel="Signing out..."
            spinnerLabel="Signing out"
          >
            <>
              <LogOut size={16} />
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
    </aside>
  );
}
