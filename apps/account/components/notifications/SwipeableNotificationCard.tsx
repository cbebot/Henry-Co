"use client";

/**
 * Premium swipe-aware wrapper for notification cards.
 *
 * Uses the audience-agnostic gesture hook from @henryco/notifications-ui,
 * binds it to the customer-side notification mutation endpoints, and
 * exposes ARIA-correct keyboard equivalents.
 *
 *   ←  / a    archive
 *   ←← / d    delete
 *   →  / r    mark-read toggle
 *
 * Reduced-motion users get a long-press → static action tray fallback;
 * the gesture hook detects `prefers-reduced-motion` itself.
 *
 * The wrapper is opinionated about the action contract — primary-left =
 * archive, secondary-left = delete, primary-right = read toggle — but
 * stays unopinionated about the API surface: callers pass the four
 * callbacks. The customer bell + inbox both supply the same map.
 */

import { useCallback, useMemo } from "react";
import {
  ArchiveIcon,
  DeleteIcon,
  MarkReadIcon,
  type SwipeAction,
  useSwipeReveal,
} from "@henryco/notifications-ui";

export type SwipeableNotificationCardProps = {
  isRead: boolean;
  onMarkRead: () => Promise<void>;
  onMarkUnread: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
  /** Optional analytics hook fired when the user arms an action. */
  onArmed?: (action: SwipeAction | null) => void;
  /** Localized labels — keep i18n at the consumer level. */
  labels: {
    archive: string;
    delete: string;
    markRead: string;
    markUnread: string;
  };
  children: React.ReactNode;
};

export function SwipeableNotificationCard({
  isRead,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onDelete,
  onArmed,
  labels,
  children,
}: SwipeableNotificationCardProps) {
  const handleAction = useCallback(
    async (action: SwipeAction) => {
      switch (action) {
        case "primary-right":
          await (isRead ? onMarkUnread() : onMarkRead());
          return;
        case "primary-left":
          await onArchive();
          return;
        case "secondary-left":
          await onDelete();
          return;
        default:
          return;
      }
    },
    [isRead, onMarkRead, onMarkUnread, onArchive, onDelete],
  );

  const { state, handlers } = useSwipeReveal({
    onAction: handleAction,
    onArmed,
  });

  const armedLabel = useMemo(() => {
    if (state.armed === "primary-right") {
      return isRead ? labels.markUnread : labels.markRead;
    }
    if (state.armed === "primary-left") return labels.archive;
    if (state.armed === "secondary-left") return labels.delete;
    return null;
  }, [state.armed, isRead, labels]);

  // Compose the visible offset. Negative offsets reveal the left action
  // tray (archive/delete). Positive offsets reveal the right action
  // tray (read toggle). The card transform is the offset itself.
  const cardStyle: React.CSSProperties = {
    transform: `translateX(${state.offsetPx}px)`,
    transition: state.transition,
    touchAction: "pan-y",
    willChange: state.busy ? "auto" : "transform",
  };

  // Action tray reveal width grows with offset, capped at the secondary
  // reveal threshold. Color gradient signals which action is armed.
  const leftTrayWidth = Math.min(120, Math.max(0, -state.offsetPx));
  const rightTrayWidth = Math.min(120, Math.max(0, state.offsetPx));

  return (
    <div
      className="relative isolate overflow-hidden"
      data-armed={state.armed ?? undefined}
      data-busy={state.busy ? "true" : undefined}
    >
      {/* Left tray: archive (primary) → delete (secondary) */}
      {leftTrayWidth > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end gap-3 pr-4 text-white"
          style={{
            width: leftTrayWidth + 24,
            background:
              state.armed === "secondary-left"
                ? "linear-gradient(90deg, rgba(220,38,38,0) 0%, rgba(220,38,38,0.95) 100%)"
                : "linear-gradient(90deg, rgba(180,140,30,0) 0%, rgba(180,140,30,0.92) 100%)",
            transition: state.transition,
          }}
        >
          {state.armed === "secondary-left" ? (
            <DeleteIcon size={20} />
          ) : (
            <ArchiveIcon size={20} />
          )}
        </div>
      ) : null}

      {/* Right tray: read/unread toggle */}
      {rightTrayWidth > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-start gap-3 pl-4 text-white"
          style={{
            width: rightTrayWidth + 24,
            background:
              "linear-gradient(270deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.85) 100%)",
            transition: state.transition,
          }}
        >
          <MarkReadIcon size={20} />
        </div>
      ) : null}

      <div
        role="presentation"
        className="relative"
        style={cardStyle}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerCancel}
        onKeyDown={handlers.onKeyDown}
      >
        {children}
      </div>

      {/* Live region announces the armed action for screen readers. */}
      <span aria-live="polite" className="sr-only">
        {armedLabel ?? ""}
      </span>
    </div>
  );
}
