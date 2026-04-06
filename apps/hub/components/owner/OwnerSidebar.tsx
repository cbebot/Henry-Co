"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { getAccountUrl, getStaffHqUrl } from "@henryco/config";
import { LogOut, ChevronDown, ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getOwnerNavSections, type OwnerNavItem } from "@/lib/owner-navigation";
import { initials } from "@/lib/format";
import Logo from "@/components/brand/Logo";

type OwnerSidebarProps = {
  user: {
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
    ownerRole: string | null;
  };
};

function OwnerNavLink({
  item,
  pathname,
}: {
  item: OwnerNavItem;
  pathname: string;
}) {
  const isParentActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;
  const [expanded, setExpanded] = useState(isParentActive);

  const Icon = item.icon;

  return (
    <div className="mb-0.5">
      <div className="flex items-center">
        <Link
          href={item.href}
          className={`group flex flex-1 items-center gap-3 rounded-r-xl px-4 py-2.5 text-sm transition-all ${
            isParentActive && !hasChildren
              ? "owner-nav-active"
              : isParentActive
                ? "text-[var(--owner-accent)] font-semibold bg-[var(--owner-accent-soft)] border-l-3 border-[var(--owner-accent)]"
                : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
          }`}
        >
          <Icon size={18} strokeWidth={isParentActive ? 2.2 : 1.8} />
          <span className="flex-1 truncate">{item.label}</span>
        </Link>
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mr-2 rounded-lg p-1.5 text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] transition-colors"
          >
            {expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="ml-8 mt-0.5 space-y-0.5 border-l border-[var(--acct-line)] pl-3">
          {item.children!.map((child) => {
            const childActive = pathname === child.href;
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] transition-all ${
                  childActive
                    ? "owner-nav-child-active"
                    : "text-[var(--acct-muted)] hover:text-[var(--acct-ink)]"
                }`}
              >
                {ChildIcon && (
                  <ChildIcon
                    size={14}
                    strokeWidth={childActive ? 2.2 : 1.6}
                  />
                )}
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OwnerSidebar({ user }: OwnerSidebarProps) {
  const pathname = usePathname();
  const sections = getOwnerNavSections();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } finally {
      window.location.href = "/owner/login";
    }
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[var(--owner-sidebar-width)] lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-[var(--acct-line)] owner-sidebar-bg">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--acct-line)] px-5">
        <Logo size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">
            Henry & Co.
          </p>
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--owner-accent)]">
            Command Center
          </p>
        </div>
      </div>

      <div className="mx-3 mt-3 space-y-1">
        <Link
          href={getAccountUrl("/")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] transition-all"
        >
          <ArrowLeft size={14} />
          Back to HenryCo Account
        </Link>
        <a
          href={getStaffHqUrl("/")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] transition-all"
        >
          <ExternalLink size={14} />
          Open Staff HQ
        </a>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 acct-scrollbar">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="mb-3">
            <p className="acct-kicker mb-1.5 px-5">{section}</p>
            {items.map((item) => (
              <OwnerNavLink key={item.href} item={item} pathname={pathname} />
            ))}
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
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--owner-accent)]/30"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--owner-accent-soft)] text-xs font-bold text-[var(--owner-accent)] ring-2 ring-[var(--owner-accent)]/30">
              {initials(user.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--acct-ink)]">
              {user.fullName || "Owner"}
            </p>
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--owner-accent)]">
              {user.ownerRole || "Owner"}
            </p>
          </div>
          <button
            onClick={() => {
              void handleSignOut();
            }}
            disabled={signingOut}
            className="rounded-lg p-1.5 text-[var(--acct-muted)] hover:bg-[var(--acct-red-soft)] hover:text-[var(--acct-red)] transition-colors"
            title="Sign out"
          >
            <ButtonPendingContent
              pending={signingOut}
              pendingLabel="Signing out..."
              spinnerLabel="Signing out"
            >
              <LogOut size={16} />
            </ButtonPendingContent>
          </button>
        </div>
      </div>
    </aside>
  );
}
