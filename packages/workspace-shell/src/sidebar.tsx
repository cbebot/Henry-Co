import Link from "next/link";
import Image from "next/image";
import { LogOut, Sparkles, type LucideIcon } from "lucide-react";
import { getWorkspaceShellCopy, type AppLocale } from "@henryco/i18n";
import type {
  WorkspaceBadgeMap,
  WorkspaceBrand,
  WorkspaceNavItem,
  WorkspaceViewer,
} from "./types";
import { isNavActive } from "./internal";

export type WorkspaceSidebarProps = {
  brand: WorkspaceBrand;
  viewer: WorkspaceViewer;
  navigation: WorkspaceNavItem[];
  badges?: WorkspaceBadgeMap;
  attentionCount?: number;
  pathname: string;
  accountSettingsUrl?: string;
  topSlot?: React.ReactNode;
  locale?: AppLocale;
};

function getInitials(viewer: WorkspaceViewer): string {
  if (viewer.initials) return viewer.initials;
  const candidate = (viewer.fullName || viewer.email || "").trim();
  if (!candidate) return "S";
  const parts = candidate.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || candidate[0]?.toUpperCase() || "S";
}

/**
 * Server-component-compatible desktop sidebar. Renders only at lg+.
 * Receives `pathname` from the host so it can apply aria-current to
 * the active nav link without a client hook.
 */
export function WorkspaceSidebar({
  brand,
  viewer,
  navigation,
  badges,
  attentionCount = 0,
  pathname,
  accountSettingsUrl,
  topSlot,
  locale = "en",
}: WorkspaceSidebarProps) {
  const copy = getWorkspaceShellCopy(locale);
  const initials = getInitials(viewer);
  const BrandIcon: LucideIcon = brand.icon ?? Sparkles;
  const brandHref = brand.href ?? navigation[0]?.href ?? "/";

  return (
    <aside className="ws-sidebar" aria-label={copy.sidebar.navAria}>
      {topSlot}

      <Link href={brandHref} className="ws-sidebar-brand">
        <span className="ws-sidebar-brand-square" aria-hidden>
          <BrandIcon className="h-4 w-4" />
        </span>
        <span className="ws-sidebar-brand-text">
          {brand.kicker ? <span className="ws-sidebar-brand-kicker">{brand.kicker}</span> : null}
          <span className="ws-sidebar-brand-name">{brand.shortName}</span>
        </span>
      </Link>

      {attentionCount > 0 ? (
        <div className="ws-sidebar-attention">
          <div className="ws-sidebar-attention-title">
            {copy.sidebar.attentionTitle(attentionCount)}
          </div>
          <p style={{ marginTop: "0.25rem" }}>
            {copy.sidebar.attentionBody}
          </p>
        </div>
      ) : null}

      <nav className="ws-sidebar-nav" aria-label={copy.sidebar.sectionsAria}>
        {navigation.map((item) => {
          const active = isNavActive(pathname, item);
          const badge = badges?.[item.href] ?? 0;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="ws-sidebar-link"
              aria-current={active ? "page" : undefined}
              title={item.description ?? item.label}
            >
              <span className="ws-sidebar-link-label">
                <Icon className="ws-sidebar-link-icon" aria-hidden />
                <span>{item.label}</span>
              </span>
              {badge > 0 ? (
                <span className="ws-sidebar-badge" aria-label={copy.sidebar.badgeNew(badge)}>
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="ws-sidebar-viewer">
        <div className="ws-sidebar-viewer-row">
          {viewer.avatarUrl ? (
            <Image
              src={viewer.avatarUrl}
              alt={viewer.fullName || copy.sidebar.avatarAlt}
              width={40}
              height={40}
              unoptimized
              className="ws-sidebar-viewer-avatar"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="ws-sidebar-viewer-avatar" aria-hidden>
              {initials}
            </span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ws-sidebar-viewer-name">
              {viewer.fullName || viewer.email || copy.sidebar.viewerFallback}
            </div>
            {viewer.email ? <div className="ws-sidebar-viewer-email">{viewer.email}</div> : null}
          </div>
        </div>
        {accountSettingsUrl ? (
          <a className="ws-sidebar-viewer-cta" href={accountSettingsUrl}>
            <span>{copy.sidebar.accountSettings}</span>
            <LogOut className="h-3.5 w-3.5" style={{ transform: "rotate(-90deg)" }} aria-hidden />
          </a>
        ) : null}
      </div>
    </aside>
  );
}
