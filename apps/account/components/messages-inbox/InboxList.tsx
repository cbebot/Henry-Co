import Link from "next/link";
import type { InboxThread } from "@henryco/data";
import type { AccountCopy } from "@henryco/i18n/server";
import { DIVISION_ACCENT_VAR, formatRelative } from "./helpers";

type MessagesCopy = AccountCopy["messages"];

type Props = {
  threads: ReadonlyArray<InboxThread>;
  /** Server-resolved "now" ms — keeps formatRelative pure. */
  nowMs: number;
  copy: MessagesCopy;
};

function statusTone(status: string): "warn" | "good" | undefined {
  const v = status.toLowerCase();
  if (v === "open" || v === "pending" || v === "reviewing") return "warn";
  if (v === "closed" || v === "resolved" || v === "completed") return "good";
  return undefined;
}

/**
 * V3 Wave A1 D3 — dense inbox list. One row per thread, sourced from
 * every portal. Row layout: 4px accent rail (lit when unread) ·
 * subject + preview · timestamp + unread dot.
 *
 * Each row's `href` is the canonical thread view in the originating
 * portal (we do not rewrite or rebuild those — see audit §8.1 K-class
 * routes). The shell's role is to surface, not to host every detail.
 *
 * `copy` carries the localised "Unread" aria-label for the unread dot.
 * Timestamps continue to use the EN-only `formatRelative` helper for
 * now — the i18n surface for relative-time strings (just now/m/h/d/w)
 * is a follow-up pass that touches every dashboard list.
 */
export function InboxList({ threads, nowMs, copy }: Props) {
  return (
    <div className="acct-inbox__list" role="list">
      {threads.map((thread) => (
        <Link
          key={thread.key}
          href={thread.href}
          role="listitem"
          className="acct-inbox__row"
          data-unread={thread.unread}
        >
          <span
            className="acct-inbox__row-accent"
            aria-hidden
            style={{
              background: thread.unread
                ? `var(${DIVISION_ACCENT_VAR[thread.division]})`
                : undefined,
            }}
          />
          <div className="acct-inbox__row-body">
            <div className="acct-inbox__row-head">
              <span className="acct-inbox__row-source">{thread.sourceLabel}</span>
              <span
                className="acct-inbox__row-status"
                data-tone={statusTone(thread.status)}
              >
                {thread.status}
              </span>
            </div>
            <p className="acct-inbox__row-subject">{thread.subject}</p>
            {thread.preview ? (
              <p className="acct-inbox__row-preview">{thread.preview}</p>
            ) : null}
          </div>
          <div className="acct-inbox__row-meta">
            <span className="acct-inbox__row-time">
              {formatRelative(thread.updatedAt, nowMs)}
            </span>
            {thread.unread ? (
              <span
                className="acct-inbox__row-unread-dot"
                aria-label={copy.list.unreadDotLabel}
                title={copy.list.unreadDotLabel}
              />
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
