"use client";

/**
 * @henryco/notifications-ui/notification-bell — V3-03.
 *
 * Audience-agnostic notification bell primitive. Renders the bell
 * icon + unread badge + (optional) an in-page anchor to the
 * notifications inbox. Designed to be consumed by every division
 * shell (hub owner workspace, marketplace, care, jobs, learn,
 * logistics, property, studio).
 *
 * Per V3-03 S5, the badge count must:
 *   - Sum unread customer_notifications for customer users; unread
 *     staff_notifications for staff role users.
 *   - Update live (the host's existing realtime channel is the
 *     truth — this component does NOT subscribe directly because
 *     each division shell already has its own subscription pattern;
 *     hosts pass the live `unreadCount` as a prop).
 *   - Respect category mute preferences via
 *     notification_signal_preferences — but the count itself is
 *     pre-computed on the server by the host, so this component
 *     doesn't filter; it just renders the number the host hands it.
 *
 * The bell is intentionally LOW-API: hosts that already render their
 * own rich popover (eg. apps/account's NotificationBell.tsx) can
 * keep doing so. This shared component is the bell for shells that
 * never had a bell before — the 8 division shells from V3-BACKLOG E1.
 *
 * Strings come in via labels prop; host translates via
 * @henryco/i18n's translateSurfaceLabel in the
 * surface:notification-message namespace.
 */

import type { ReactNode } from "react";
import { HenryCoBell } from "./icons";

export type NotificationBellLabels = {
  /** aria-label when no notifications are unread. */
  openLabel?: string;
  /** aria-label suffix when unread count > 0; rendered as
   * `${openLabel} — ${count} ${unreadLabel}`. */
  unreadLabel?: string;
};

const DEFAULT_LABELS: Required<NotificationBellLabels> = {
  openLabel: "Open notifications",
  unreadLabel: "unread",
};

export type NotificationBellProps = {
  /** Current unread count. Host computes server-side + keeps live
   * via its realtime subscription. */
  unreadCount: number;
  /** Where the bell navigates on click (a `/notifications` route).
   * Render-as-Link is the host's responsibility — see hrefRenderer. */
  href?: string;
  /** Host-injected anchor renderer. The bell stays framework-agnostic
   * (works in Next.js, Remix, Vite). When omitted the bell renders
   * a plain <a> if href is set. */
  hrefRenderer?: (
    href: string,
    children: ReactNode,
    extraProps: { ariaLabel: string; className: string },
  ) => ReactNode;
  /** Click handler, alternative to href-based nav. Both can coexist:
   * the handler runs first, then the href nav (which the host's
   * anchor can preventDefault on if desired). */
  onClick?: () => void;
  /** Labels for screen reader + tooltip. */
  labels?: NotificationBellLabels;
  /** Extra className passed through to the button / anchor element. */
  className?: string;
  /** Bell glyph size in px. Defaults to 18. */
  iconSize?: number;
};

const BASE_STYLE: string =
  "relative inline-flex items-center justify-center rounded-xl p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40";

const BADGE_STYLE: string =
  "absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-[5px] text-[0.62rem] font-semibold leading-none text-white tabular-nums shadow-[0_0_0_2px_currentColor]";

function renderBadge(unreadCount: number): ReactNode {
  if (unreadCount <= 0) return null;
  const displayCount = unreadCount > 9 ? "9+" : String(unreadCount);
  return (
    <span
      className={BADGE_STYLE}
      style={{ backgroundColor: "var(--bell-badge-color, #dc2626)" }}
      aria-hidden
    >
      {displayCount}
    </span>
  );
}

export function NotificationBell({
  unreadCount,
  href,
  hrefRenderer,
  onClick,
  labels,
  className,
  iconSize = 18,
}: NotificationBellProps): ReactNode {
  const merged: Required<NotificationBellLabels> = {
    ...DEFAULT_LABELS,
    ...labels,
  };
  const ariaLabel =
    unreadCount > 0
      ? `${merged.openLabel} — ${unreadCount} ${merged.unreadLabel}`
      : merged.openLabel;

  const cls = `${BASE_STYLE} ${className ?? ""}`.trim();

  const bellContents = (
    <>
      <span className="inline-flex" aria-hidden>
        <HenryCoBell size={iconSize} />
      </span>
      {renderBadge(unreadCount)}
    </>
  );

  // Anchor rendering — host injects framework-specific Link if given.
  if (href) {
    if (hrefRenderer) {
      return hrefRenderer(href, bellContents, {
        ariaLabel,
        className: cls,
      });
    }
    return (
      <a
        href={href}
        className={cls}
        aria-label={ariaLabel}
        onClick={onClick}
        data-unread-count={unreadCount > 0 ? unreadCount : undefined}
      >
        {bellContents}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      aria-label={ariaLabel}
      onClick={onClick}
      data-unread-count={unreadCount > 0 ? unreadCount : undefined}
    >
      {bellContents}
    </button>
  );
}
