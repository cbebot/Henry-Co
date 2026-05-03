"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { isNavActive, portalNavItems, type PortalNavItem } from "@/lib/portal/navigation";
import type { ClientPortalViewer } from "@/types/portal";

function getInitials(name: string | null, email: string | null) {
  const candidate = (name || email || "").trim();
  if (!candidate) return "S";
  const parts = candidate.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || candidate[0]?.toUpperCase() || "S";
}

export function PortalSidebar({
  viewer,
  unreadCount,
  outstandingInvoices,
  attentionCount,
  accountUrl,
}: {
  viewer: ClientPortalViewer;
  unreadCount: number;
  outstandingInvoices: number;
  attentionCount: number;
  accountUrl: string;
}) {
  const pathname = usePathname() || "";
  const initials = getInitials(viewer.fullName, viewer.email);

  return (
    <aside className="hidden lg:flex h-[100dvh] sticky top-0 w-[19rem] flex-col gap-6 border-r border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_92%,transparent)] px-5 py-7 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[var(--studio-line-strong)] bg-[linear-gradient(135deg,#dff8fb,#4eb8c2)] text-[#021016]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            HenryCo
          </span>
          <span className="text-base font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">
            Studio portal
          </span>
        </span>
      </Link>

      {attentionCount > 0 ? (
        <div className="rounded-2xl border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.04)] px-3.5 py-3 text-[12px] leading-5 text-[var(--studio-ink-soft)]">
          <div className="font-semibold text-[var(--studio-ink)]">
            {attentionCount} item{attentionCount === 1 ? "" : "s"} need attention
          </div>
          <p className="mt-1">
            Outstanding invoices, files awaiting approval, and unread team messages.
          </p>
        </div>
      ) : null}

      <nav className="flex flex-col gap-1.5">
        {portalNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isNavActive(pathname, item)}
            badge={
              item.href === "/client/messages"
                ? unreadCount
                : item.href === "/client/payments"
                ? outstandingInvoices
                : 0
            }
          />
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.04)] p-3.5">
        <div className="flex items-center gap-3">
          {viewer.avatarUrl ? (
            <img
              src={viewer.avatarUrl}
              alt={viewer.fullName || "Profile"}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-[var(--studio-line-strong)] object-cover"
            />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.08)] text-[13px] font-semibold text-[var(--studio-signal)]">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[var(--studio-ink)]">
              {viewer.fullName || viewer.email || "Studio client"}
            </div>
            {viewer.email ? (
              <div className="truncate text-[11.5px] text-[var(--studio-ink-soft)]">
                {viewer.email}
              </div>
            ) : null}
          </div>
        </div>
        <a
          href={accountUrl}
          className="mt-3 inline-flex w-full items-center justify-between gap-1 rounded-xl border border-[var(--studio-line)] bg-transparent px-3 py-2 text-[12px] font-semibold text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.36)] hover:text-[var(--studio-ink)]"
        >
          <span>Account & settings</span>
          <LogOut className="h-3.5 w-3.5 -rotate-90" />
        </a>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  badge,
}: {
  item: PortalNavItem;
  active: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-[rgba(151,244,243,0.5)] bg-[linear-gradient(135deg,rgba(151,244,243,0.18),rgba(78,184,194,0.1))] text-[var(--studio-ink)] shadow-[0_18px_38px_-22px_rgba(151,244,243,0.6)]"
          : "border-transparent text-[var(--studio-ink-soft)] hover:border-[var(--studio-line)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--studio-ink)]"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${active ? "text-[var(--studio-signal)]" : ""}`} />
        {item.label}
      </span>
      {badge && badge > 0 ? (
        <span
          className={`grid h-5 min-w-[1.25rem] place-items-center rounded-full px-1.5 text-[11px] font-bold leading-none ${
            active
              ? "bg-[rgba(2,16,22,0.4)] text-[var(--studio-signal)]"
              : "bg-[rgba(151,244,243,0.18)] text-[var(--studio-signal)]"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
