"use client";

import { type ReactNode } from "react";
import {
  ArchiveIcon,
  DeleteIcon,
  MarkReadIcon,
} from "@henryco/notifications-ui/icons";
import {
  createSeverityResolver,
  type SeverityResolver,
} from "@henryco/notifications-ui/severity-style";
import {
  ACCOUNT_NOTIFICATION_TOKENS,
  type SeverityTokens,
} from "@henryco/notifications-ui/tokens";
import {
  henrycoSwipeRevealTransition,
} from "@henryco/notifications-ui/motion";
import { useSwipeReveal } from "@henryco/notifications-ui/gestures";
import { isSafeNotificationDeepLink } from "@henryco/notifications-ui/deep-link";

import { useSignalRenderState } from "../../shell/realtime-hooks";
import type { RealtimeSignal } from "../../shell/realtime-types";
import { CSS_VARS } from "../../tokens/color";
import { RADIUS } from "../../tokens/spacing";
import { typeStyle } from "../../tokens/type";
import { focusVisibleStyle } from "../../tokens/focus";

export type NotificationCardProps = {
  signal: RealtimeSignal;
  /** Token scheme — apps/account passes ACCOUNT_NOTIFICATION_TOKENS. */
  tokens?: SeverityTokens;
  /** Activate (open + mark read). */
  onActivate: () => void;
  /** Inline lifecycle action. */
  onAction: (action: "read" | "unread" | "archive" | "delete") => void;
  /** i18n function. */
  t?: (key: string) => string;
};

function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString();
}

/**
 * One notification row. Audience-agnostic. Honors quiet-hours and
 * email-fallback dimming via `useSignalRenderState()`. Renders the
 * audience-agnostic primitives (severity icon + division accent) from
 * `@henryco/notifications-ui` (V2-NOT-02-A).
 *
 * Anti-patterns avoided:
 *   #13 emoji-as-icon — uses HenryCoBell + Severity*Icon set.
 *   #14 default tailwind cards — explicit RADIUS + CSS_VARS tokens.
 */
export function NotificationCard({
  signal,
  tokens = ACCOUNT_NOTIFICATION_TOKENS,
  onActivate,
  onAction,
  t = (s) => s,
}: NotificationCardProps) {
  const resolver: SeverityResolver = createSeverityResolver(tokens);
  const renderState = useSignalRenderState(signal);
  const severityStyle = resolver.resolveSeverity(signal.priority, signal.category);
  const divisionVar = resolver.divisionAccentVar(signal.division);
  const isUnread = !signal.is_read;
  const safeDest = isSafeNotificationDeepLink(signal.action_url || signal.message_href || "")
    ? signal.action_url || signal.message_href
    : "/notifications";

  const swipe = useSwipeReveal({
    onAction: async (action) => {
      if (action === "primary-right") onAction(isUnread ? "read" : "unread");
      else if (action === "primary-left") onAction("archive");
      else if (action === "secondary-left") onAction("delete");
    },
  });

  const stopParent = (
    event:
      | React.PointerEvent<HTMLButtonElement>
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <div
      style={{
        position: "relative",
        marginBottom: "0.4rem",
        opacity: renderState.dim ? 0.7 : 1,
        transition: henrycoSwipeRevealTransition,
      }}
    >
      <div
        {...swipe.handlers}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.6rem",
          padding: "0.7rem 0.75rem",
          borderRadius: RADIUS.lg,
          borderLeft: `3px solid var(${divisionVar})`,
          backgroundColor: isUnread
            ? `var(${CSS_VARS.accentSoft})`
            : `var(${CSS_VARS.surface})`,
          transform: `translateX(${swipe.state.offsetPx}px)`,
          transition: swipe.state.transition,
          touchAction: "pan-y",
        }}
      >
        <button
          type="button"
          onClick={onActivate}
          aria-label={`${t("Open notification")}: ${signal.title}`}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            ...focusVisibleStyle(),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span
              aria-hidden
              style={{ color: `var(${severityStyle.colorVar})`, display: "inline-flex" }}
            >
              <severityStyle.Icon size={13} />
            </span>
            <p
              style={{
                ...typeStyle("bodyStrong"),
                margin: 0,
                color: `var(${CSS_VARS.ink})`,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {signal.title}
            </p>
            {isUnread ? (
              <span
                aria-hidden
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "9999px",
                  backgroundColor: `var(${severityStyle.colorVar})`,
                }}
              />
            ) : null}
          </div>

          {signal.body ? (
            <p
              style={{
                ...typeStyle("body"),
                margin: "0.3rem 0 0",
                fontSize: "0.78rem",
                lineHeight: 1.45,
                color: `var(${CSS_VARS.inkSoft})`,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {signal.body}
            </p>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.35rem",
              fontSize: "0.66rem",
              color: `var(${CSS_VARS.inkSoft})`,
            }}
          >
            <span style={{ color: `var(${divisionVar})`, fontWeight: 600 }}>
              {signal.source?.label ?? signal.division ?? ""}
            </span>
            <span aria-hidden>·</span>
            <span>{timeAgo(signal.created_at)}</span>
            {signal.email_dispatched_at ? (
              <>
                <span aria-hidden>·</span>
                <span
                  role="note"
                  aria-label={t("Email also sent")}
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    opacity: 0.7,
                  }}
                >
                  {t("Email sent")}
                </span>
              </>
            ) : null}
          </div>
          <span aria-hidden style={{ position: "absolute", left: -9999 }}>
            {safeDest}
          </span>
        </button>
        <div style={{ display: "flex", gap: "0.15rem" }}>
          <InlineActionButton
            label={t(isUnread ? "Mark as read" : "Mark as unread")}
            onClick={(e) => {
              stopParent(e);
              onAction(isUnread ? "read" : "unread");
            }}
          >
            <MarkReadIcon size={12} />
          </InlineActionButton>
          <InlineActionButton
            label={t("Archive")}
            onClick={(e) => {
              stopParent(e);
              onAction("archive");
            }}
          >
            <ArchiveIcon size={12} />
          </InlineActionButton>
          <InlineActionButton
            label={t("Delete")}
            onClick={(e) => {
              stopParent(e);
              onAction("delete");
            }}
          >
            <DeleteIcon size={12} />
          </InlineActionButton>
        </div>
      </div>
    </div>
  );
}

function InlineActionButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={label}
      style={{
        width: "1.6rem",
        height: "1.6rem",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.md,
        background: "transparent",
        border: "none",
        color: `var(${CSS_VARS.inkSoft})`,
        cursor: "pointer",
        ...focusVisibleStyle(),
      }}
    >
      {children}
    </button>
  );
}
