"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ButtonPendingContent } from "@henryco/ui";
import { getAccountUrl, getStaffHqUrl } from "@henryco/config";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { logoutEverywhere } from "@henryco/auth/client";
import { LogOut, ChevronDown, ChevronRight, ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getOwnerNavSections, type OwnerNavItem } from "@/lib/owner-navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { initials } from "@/lib/format";
import Logo from "@/components/brand/Logo";
import OwnerSearchButton from "@/components/owner/OwnerSearchButton";

type OwnerSidebarProps = {
  user: {
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
    ownerRole: string | null;
  };
  /**
   * Track B / DASH-8 G2 — registry-derived rail entries. Optional for
   * backward compatibility while the sidebar's hierarchical sub-children
   * still come from `lib/owner-navigation.ts`. When present, the rail
   * surfaces a registry-attribution data attribute so V11 can verify
   * the consumption pattern.
   */
  ownerRailEntries?: ReadonlyArray<{
    slug: string;
    title: string;
    href: string;
    description: string;
  }>;
};

function OwnerNavLink({
  item,
  pathname,
  locale,
}: {
  item: OwnerNavItem;
  pathname: string;
  locale: AppLocale;
}) {
  const isParentActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;
  const [expanded, setExpanded] = useState(isParentActive);

  const Icon = item.icon;
  const t = (text: string) => translateSurfaceLabel(locale, text);

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
          <span className="flex-1 truncate">{t(item.label)}</span>
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
                <span>{t(child.label)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OwnerSidebar({ user, ownerRailEntries }: OwnerSidebarProps) {
  const pathname = usePathname();
  const sections = getOwnerNavSections();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSignOutError(null);
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowser();
      const result = await logoutEverywhere({
        supabase,
        redirectTo: "/owner/login",
      });
      if (!result.ok && result.serverLogoutStatus && result.serverLogoutStatus >= 500) {
        throw new Error(`Owner logout failed with status ${result.serverLogoutStatus}`);
      }
    } catch (error) {
      console.error(error);
      setSignOutError(t("We could not sign you out. Try again."));
      setSigningOut(false);
    }
  };

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-[var(--owner-sidebar-width)] lg:fixed lg:inset-y-0 lg:left-0 lg:border-r lg:border-[var(--acct-line)] owner-sidebar-bg"
      data-owner-rail-source={ownerRailEntries ? "registry" : "legacy-nav"}
      data-owner-rail-slugs={ownerRailEntries?.map((entry) => entry.slug).join(",") ?? ""}
    >
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--acct-line)] px-5">
        <Logo size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--acct-ink)]">
            Henry Onyx
          </p>
          <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--owner-accent)]">
            {t("Command Center")}
          </p>
        </div>
      </div>

      <div className="mx-3 mt-3 space-y-2">
        <OwnerSearchButton variant="sidebar" />
        <Link
          href={getAccountUrl("/")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] transition-all"
        >
          <ArrowLeft size={14} />
          {t("Back to Henry Onyx Account")}
        </Link>
        <a
          href={getStaffHqUrl("/")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)] transition-all"
        >
          <ExternalLink size={14} />
          {t("Open Staff HQ")}
        </a>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 acct-scrollbar">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="mb-3">
            <p className="acct-kicker mb-1.5 px-5">{t(section)}</p>
            {items.map((item) => (
              <OwnerNavLink key={item.href} item={item} pathname={pathname} locale={locale} />
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--acct-line)] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--owner-accent)]/30"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--owner-accent-soft)] text-xs font-semibold text-[var(--owner-accent)] ring-2 ring-[var(--owner-accent)]/30">
              {initials(user.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--acct-ink)]">
              {user.fullName || t("Owner")}
            </p>
            <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--owner-accent)]">
              {user.ownerRole || t("Owner")}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            void handleSignOut();
          }}
          disabled={signingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--acct-red)] transition-colors hover:bg-[var(--acct-red-soft)]"
        >
          <ButtonPendingContent
            pending={signingOut}
            pendingLabel={t("Signing out...")}
            spinnerLabel={t("Signing out")}
          >
            <>
              <LogOut size={16} />
              {t("Sign out")}
            </>
          </ButtonPendingContent>
        </button>
        {signOutError ? (
          <p className="mt-2 px-3 text-xs font-medium text-[var(--acct-red)]" role="status">
            {signOutError}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
