import Link from "next/link";
import { getWorkspaceShellCopy, type AppLocale } from "@henryco/i18n";
import type { WorkspaceBadgeMap, WorkspaceNavItem } from "./types";
import { isNavActive } from "./internal";

export type WorkspaceBottomNavProps = {
  navigation: WorkspaceNavItem[];
  pathname: string;
  badges?: WorkspaceBadgeMap;
  locale?: AppLocale;
};

/**
 * Mobile-only bottom navigation. Hidden at lg+ via CSS.
 *
 * The host passes the mobile-subset (typically 4-5 highest-frequency
 * surfaces). Active state is computed against `pathname` server-side;
 * no client hook needed.
 */
export function WorkspaceBottomNav({ navigation, pathname, badges, locale = "en" }: WorkspaceBottomNavProps) {
  const copy = getWorkspaceShellCopy(locale);
  return (
    <nav className="ws-bottom-nav" aria-label={copy.bottomNav.navAria}>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        const badge = badges?.[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="ws-bottom-nav-item"
            aria-current={active ? "page" : undefined}
          >
            <Icon className="ws-bottom-nav-icon" aria-hidden />
            <span>{item.label}</span>
            {badge > 0 ? (
              <span className="ws-bottom-nav-badge" aria-label={copy.bottomNav.badgeNew(badge)}>
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
