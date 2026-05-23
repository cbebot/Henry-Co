/**
 * TimelineCard — the canonical activity / inbox / orders row.
 *
 * ACCOUNT-PREMIUM-01, Phase 2.
 *
 * Replaces hand-rolled `<Link className="flex items-start gap-4 px-5 py-4">`
 * patterns across activity / messages / notifications / orders /
 * subscriptions / support / referrals. The composition is identical
 * across all: avatar + body (title, detail, chips) + time + trailing.
 *
 * The caller supplies the row data — strings, division avatar color,
 * chip tones — and the primitive owns geometry, divider, hover, focus,
 * line-clamping, and reduced-motion behavior.
 *
 * Two render modes:
 *   - As a list container <TimelineCard.Container>...rows...</>
 *   - As individual rows: <TimelineCard.Row {...} />
 *
 * Rows can be either a `<div>` (passive) or an `<a>` (when `href` set).
 *
 * I18N: all strings come from props.
 */

import type { ReactNode } from "react";

export type TimelineChipTone = "default" | "gold" | "success" | "warning" | "danger" | "info";

export type TimelineChip = {
  label: string;
  tone?: TimelineChipTone;
};

export type TimelineRowProps = {
  /** The avatar — either a string (1-3 letter initials or emoji) or any ReactNode (icon). */
  avatar?: ReactNode;
  /** Avatar background color — caller passes a CSS variable expression or static color.
   * If undefined the default neutral surface tone is used. */
  avatarColor?: string;
  /** When `avatarColor` is set, force the avatar foreground to the soft-paper color. */
  avatarTone?: "neutral" | "division";
  /** The row title — single line, clamped to 1. */
  title: string;
  /** Optional detail — 2 lines max, clamped. */
  detail?: string;
  /** Optional chips below the body — 0-3 typical. */
  chips?: ReadonlyArray<TimelineChip>;
  /** Optional relative time, e.g. "12m ago" or "Today". */
  time?: string;
  /** Optional trailing slot — usually amount / numeric value. */
  trailing?: ReactNode;
  /** When set, the whole row becomes an `<a>`. */
  href?: string;
  /** Open in new tab if true (absolute URLs default to true). */
  newTab?: boolean;
};

function shouldOpenNewTab(href: string, override: boolean | undefined): boolean {
  if (typeof override === "boolean") return override;
  return /^https?:\/\//.test(href);
}

function renderRowInner({
  avatar,
  avatarColor,
  avatarTone = "neutral",
  title,
  detail,
  chips,
  time,
  trailing,
}: Omit<TimelineRowProps, "href" | "newTab">) {
  return (
    <>
      {avatar !== undefined ? (
        <span
          className="acct-timeline__avatar"
          data-tone={avatarTone}
          style={avatarColor ? { background: avatarColor } : undefined}
          aria-hidden
        >
          {avatar}
        </span>
      ) : null}
      <div className="acct-timeline__body">
        <p className="acct-timeline__title">{title}</p>
        {detail ? <p className="acct-timeline__detail">{detail}</p> : null}
        {chips && chips.length > 0 ? (
          <div className="acct-timeline__chips">
            {chips.map((chip, i) => (
              <span
                key={`${chip.label}-${i}`}
                className="acct-timeline__chip"
                data-tone={chip.tone ?? "default"}
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {trailing ? <div className="acct-timeline__trailing">{trailing}</div> : null}
      {time ? <span className="acct-timeline__time">{time}</span> : null}
    </>
  );
}

export function TimelineRow({ href, newTab, ...rest }: TimelineRowProps) {
  if (href) {
    return (
      <a
        className="acct-timeline__row"
        href={href}
        {...(shouldOpenNewTab(href, newTab)
          ? { target: "_blank", rel: "noopener noreferrer" }
          : null)}
      >
        {renderRowInner(rest)}
      </a>
    );
  }
  return <div className="acct-timeline__row">{renderRowInner(rest)}</div>;
}

export type TimelineCardProps = {
  /** Aria label for the list landmark. */
  ariaLabel?: string;
  /** Children should be a sequence of <TimelineRow /> elements. */
  children: ReactNode;
};

export function TimelineCard({ ariaLabel, children }: TimelineCardProps) {
  return (
    <div className="acct-timeline" role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

// Convenience namespace for `<TimelineCard.Row />` callers.
TimelineCard.Row = TimelineRow;
