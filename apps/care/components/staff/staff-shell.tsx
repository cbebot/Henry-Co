"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BellRing,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FolderArchive,
  Globe2,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { logoutAction } from "@/app/login/actions";
import {
  markRoleNotificationItemReadAction,
  markRoleNotificationsReadAction,
} from "@/app/(staff)/actions";
import type { RoleNotificationCenter, RoleNotificationItem } from "@/lib/notifications";
import {
  getRouteMetaForPath,
  roleHome,
  roleLabel,
  roleSummary,
  type StaffShellIcon,
  type StaffShellNavItem,
  type StaffShellNavSection,
} from "@/lib/staff-shell";
import type { StaffRole } from "@/lib/auth/roles";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const navIconMap: Record<StaffShellIcon, ComponentType<{ className?: string }>> = {
  "bell-ring": BellRing,
  "clipboard-list": ClipboardList,
  "credit-card": CreditCard,
  "folder-archive": FolderArchive,
  globe: Globe2,
  home: Home,
  "layout-dashboard": LayoutDashboard,
  "line-chart": LineChart,
  "messages-square": MessagesSquare,
  settings: Settings2,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  truck: Truck,
  users: Users,
  wallet: Wallet,
};

function pageMatches(pathname: string, item: StaffShellNavItem) {
  return (item.matchers || [item.href]).some((matcher) =>
    pathname === matcher || pathname.startsWith(`${matcher}/`)
  );
}

function toneClasses(tone: RoleNotificationItem["tone"]) {
  if (tone === "critical") {
    return {
      pill: "border-red-300/30 bg-red-500/10 text-red-700 dark:text-red-100",
      dot: "bg-red-500",
      card: "border-red-300/20 bg-red-500/[0.07]",
    };
  }

  if (tone === "warning") {
    return {
      pill: "border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-100",
      dot: "bg-amber-500",
      card: "border-amber-300/20 bg-amber-500/[0.07]",
    };
  }

  if (tone === "success") {
    return {
      pill: "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100",
      dot: "bg-emerald-500",
      card: "border-emerald-300/20 bg-emerald-500/[0.07]",
    };
  }

  return {
    pill: "border-cyan-300/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100",
    dot: "bg-cyan-500",
    card: "border-cyan-300/20 bg-cyan-500/[0.07]",
  };
}

function formatRelative(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function BrandMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  const cleanSrc = typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;

  return (
    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.06] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
      {cleanSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cleanSrc} alt={name} className="h-full w-full object-contain p-1.5" />
      ) : (
        <span className="text-base font-black tracking-tight text-white">{initials(name) || "HC"}</span>
      )}
    </div>
  );
}

function NavLink({
  item,
  active,
  compact = false,
  onNavigate,
}: {
  item: StaffShellNavItem;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = navIconMap[item.icon];

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group rounded-[1.35rem] border transition",
        compact
          ? "flex items-center gap-3 px-3 py-3"
          : "grid gap-3 px-4 py-4",
        active
          ? "border-[color:var(--accent)]/24 bg-[color:var(--accent)]/12 shadow-[0_18px_48px_rgba(56,72,184,0.14)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-[1rem] border",
            compact ? "h-10 w-10" : "h-11 w-11",
            active
              ? "border-[color:var(--accent)]/28 bg-[color:var(--accent)]/16"
              : "border-white/10 bg-white/[0.04]"
          )}
        >
          <Icon className="h-4.5 w-4.5 text-[color:var(--accent)]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate text-sm font-semibold text-white">{item.label}</div>
            {item.badge ? (
              <span className="rounded-full border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                {item.badge}
              </span>
            ) : null}
          </div>
          {!compact ? (
            <div className="mt-1 text-xs leading-6 text-white/54">{item.sub}</div>
          ) : null}
        </div>

        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/32 transition group-hover:translate-x-0.5 group-hover:text-white/62" />
      </div>
    </Link>
  );
}

function NotificationDrawer({
  center,
  open,
  onClose,
}: {
  center: RoleNotificationCenter;
  open: boolean;
  onClose: () => void;
}) {
  const home = roleHome(center.role);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#040814]/48 backdrop-blur-sm transition",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen w-full max-w-[28rem] flex-col border-l border-white/10 bg-[#061022]/96 px-5 py-5 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition md:px-6",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Notification center
            </div>
            <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
              {center.unreadCount > 0
                ? `${center.unreadCount} unread alert${center.unreadCount === 1 ? "" : "s"}`
                : "Everything is up to date"}
            </div>
            <div className="mt-2 text-sm leading-7 text-white/58">
              {roleSummary(center.role)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72 transition hover:bg-white/[0.09] hover:text-white"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {center.unreadCount > 0 ? (
            <form action={markRoleNotificationsReadAction}>
              <input type="hidden" name="role" value={center.role} />
              <input type="hidden" name="section" value="all" />
              <input type="hidden" name="source_route" value={`${home}/notifications`} />
              <input type="hidden" name="unread_count" value={center.unreadCount} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/12 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/18"
              >
                <CheckCheck className="h-4 w-4 text-[color:var(--accent)]" />
                Mark all as read
              </button>
            </form>
          ) : null}

          <Link
            href={`${home}/notifications`}
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08]"
          >
            Open full page
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
          {center.items.length > 0 ? (
            center.items.map((item) => {
              const tone = toneClasses(item.tone);

              return (
                <article
                  key={item.id}
                  className={cn(
                    "rounded-[1.5rem] border px-4 py-4",
                    tone.card,
                    item.isUnread ? "ring-1 ring-[color:var(--accent)]/14" : ""
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", tone.dot)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                            tone.pill
                          )}
                        >
                          {item.group}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                          {formatRelative(item.createdAt)}
                        </span>
                        {item.isUnread ? (
                          <span className="rounded-full border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                            unread
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 text-base font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-7 text-white/64">{item.body}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/82 transition hover:bg-white/[0.09]"
                        >
                          {item.actionLabel || "Open"}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>

                        {item.isUnread ? (
                          <form action={markRoleNotificationItemReadAction}>
                            <input type="hidden" name="role" value={center.role} />
                            <input type="hidden" name="item_id" value={item.id} />
                            <input type="hidden" name="source_route" value={`${home}/notifications`} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/68 transition hover:bg-white/[0.07]"
                            >
                              Mark read
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-4 py-5 text-sm leading-7 text-white/56">
              No live role-specific alerts are waiting right now.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default function StaffShell({
  children,
  role,
  brandName,
  logoUrl,
  userEmail,
  profileName,
  center,
  sections,
  quickLinks,
}: {
  children: ReactNode;
  role: StaffRole;
  brandName: string;
  logoUrl?: string | null;
  userEmail?: string | null;
  profileName?: string | null;
  center: RoleNotificationCenter;
  sections: StaffShellNavSection[];
  quickLinks: StaffShellNavItem[];
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const meta = useMemo(
    () => getRouteMetaForPath(role, pathname, center.unreadCount),
    [center.unreadCount, pathname, role]
  );

  return (
    <div className="care-shell-bg min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[color:var(--accent)]/14 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[color:var(--accent-secondary)]/10 blur-3xl" />
      </div>

      <NotificationDrawer
        center={center}
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <div className="mx-auto grid min-h-screen max-w-[1800px] grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)]">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-[#050917]/60 backdrop-blur-sm transition xl:hidden",
            navOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setNavOpen(false)}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[19rem] flex-col border-r border-white/10 bg-[#051021]/96 px-4 py-4 backdrop-blur-2xl transition xl:sticky xl:top-0 xl:z-auto xl:h-screen",
            navOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0",
            railCollapsed ? "xl:w-[6.5rem]" : "xl:w-[20rem]"
          )}
        >
          <div className="flex items-center justify-between gap-3 px-2">
            <Link href={roleHome(role)} className="flex min-w-0 items-center gap-3">
              <BrandMark name={brandName} logoUrl={logoUrl} />
              {!railCollapsed ? (
                <div className="min-w-0">
                  <div className="truncate text-base font-black tracking-tight text-white">{brandName}</div>
                  <div className="truncate text-xs text-white/48">{roleLabel(role)} workspace</div>
                </div>
              ) : null}
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRailCollapsed((value) => !value)}
                className="hidden xl:inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                aria-label={railCollapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {railCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.08] hover:text-white xl:hidden"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Active role
            </div>
            <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
              {railCollapsed ? roleLabel(role).slice(0, 1) : roleLabel(role)}
            </div>
            {!railCollapsed ? (
              <>
                <div className="mt-1 truncate text-sm text-white/58">
                  {profileName || userEmail || "Team member"}
                </div>
                <div className="mt-3 text-xs leading-6 text-white/52">{roleSummary(role)}</div>
              </>
            ) : null}
          </div>

          <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
            {sections.map((section) => (
              <div key={section.label} className="space-y-2">
                {!railCollapsed ? (
                  <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
                    {section.label}
                  </div>
                ) : null}
                <div className="grid gap-2">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={pageMatches(pathname, item)}
                      compact={railCollapsed}
                      onNavigate={() => setNavOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {!railCollapsed ? (
              <div className="space-y-2">
                <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
                  Public touchpoints
                </div>
                <div className="grid gap-2">
                  {quickLinks.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={pathname === item.href}
                      onNavigate={() => setNavOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <form action={logoutAction} className="mt-5">
            <PendingSubmitButton
              label={railCollapsed ? "Sign out" : "Sign out"}
              pendingLabel="Signing out..."
              icon={<LogOut className="h-4 w-4" />}
              variant="danger"
              className={cn(
                "w-full rounded-full border-red-400/20 bg-red-500/10 px-5 py-3 text-red-100 hover:bg-red-500/14",
                railCollapsed ? "justify-center px-0" : ""
              )}
            />
          </form>
        </aside>

        <div className="min-w-0 px-4 pb-10 pt-4 sm:px-6 xl:px-8">
          <header className="sticky top-0 z-30 mb-6 rounded-[2rem] border border-white/10 bg-[#081223]/88 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setNavOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/72 transition hover:bg-white/[0.09] hover:text-white xl:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                    {meta.sectionLabel}
                  </div>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                    {meta.title}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/58">
                    {meta.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/74">
                  {profileName || roleLabel(role)}
                </div>

                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="relative inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/10 px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/16"
                >
                  <BellRing className="h-4 w-4 text-[color:var(--accent)]" />
                  Alerts
                  {center.unreadCount > 0 ? (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-[color:var(--accent-deep)]">
                      {center.unreadCount}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            {meta.subnav.length > 1 ? (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {meta.subnav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      pageMatches(pathname, item)
                        ? "border-[color:var(--accent)]/24 bg-[color:var(--accent)]/12 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/66 hover:bg-white/[0.07] hover:text-white"
                    )}
                  >
                    {(() => {
                      const Icon = navIconMap[item.icon];
                      return <Icon className="h-4 w-4 text-[color:var(--accent)]" />;
                    })()}
                    {item.label}
                    {item.badge ? (
                      <span className="rounded-full border border-[color:var(--accent)]/24 bg-[color:var(--accent)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
