import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { EmptyState, Panel, Section, SignalCard } from "@henryco/dashboard-shell";
import { getAccountHeroesCopy } from "@henryco/i18n";
import type { SignalFeedItem, SignalFeedCursor } from "@henryco/data";
import { getAccountAppLocale } from "@/lib/locale-server";
import { divisionColor, divisionLabel } from "@/lib/format";
import {
  formatRelative,
  groupByRecency,
  mapSignalPriority,
  RECENCY_LABEL,
  RECENCY_ORDER,
} from "@/lib/smart-home/format";

/**
 * SignalFeed — the server-rendered signal stream below the attention
 * panel. Renders up to N items as `<SignalCard>` rows, dimming the
 * ones that have already been mirrored to email
 * (`emailDispatched=true`) — anti-pattern #18-adjacent: the user has
 * a parallel acknowledgement channel for those, so they shouldn't
 * compete visually with truly fresh signals (audit §A.8).
 *
 * Recency grouping: signals are bucketed by created_at into "Today /
 * Yesterday / Earlier this week / Older". Each bucket renders as a
 * sub-section so the visual hierarchy carries time without forcing
 * the user to read the timestamp on every row.
 *
 * Pagination uses cursor search-params:
 *   /?cursor.score=<n>&cursor.created_at=<iso>
 *
 * Cursor-based — not offset — so the page re-rank from a 30 s cache
 * window doesn't shift items between pages.
 *
 * The empty state (no signals at all) is typographic; closes
 * anti-pattern #16. When ranked metrics OR the module grid are
 * carrying content, the parent Smart Home suppresses this empty
 * fallback and lets the rest of the page do the talking.
 */
export type SignalFeedProps = {
  items: ReadonlyArray<SignalFeedItem>;
  nextCursor: SignalFeedCursor | null;
  prevHref: string | null;
  hideEmpty?: boolean;
  /**
   * Viewer's IANA timezone — drives the "Today / Yesterday" bucket
   * boundaries. Falls back to `Africa/Lagos` (HenryCo's default
   * audience) inside `bucketRecency` when omitted.
   */
  timezone?: string;
};

export async function SignalFeed({ items, nextCursor, prevHref, hideEmpty, timezone }: SignalFeedProps) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).signalFeed;
  if (items.length === 0) {
    if (hideEmpty) return null;
    return (
      <Panel tone="flat">
        <EmptyState
          kicker={copy.kicker}
          headline={copy.emptyHeadline}
          body={copy.emptyBody}
        />
      </Panel>
    );
  }

  const nextHref = nextCursor
    ? `/?cursor.score=${encodeURIComponent(String(nextCursor.score))}&cursor.created_at=${encodeURIComponent(nextCursor.createdAt)}`
    : null;

  const grouped = groupByRecency(items, { timezone });

  return (
    <Section
      kicker={copy.kicker}
      headline={copy.headline}
      action={
        <Link
          href="/notifications"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "var(--hc-accent-text, #C9A227)",
            fontSize: "0.75rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Inbox size={14} aria-hidden /> {copy.openInbox}
        </Link>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {RECENCY_ORDER.map((bucket) => {
          const rows = grouped[bucket];
          if (!rows || rows.length === 0) return null;
          return (
            <div key={bucket}>
              <h3
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--acct-muted, #6B7280)",
                  margin: 0,
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                }}
              >
                <span>{RECENCY_LABEL[bucket]}</span>
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "var(--acct-line, rgba(0,0,0,0.06))",
                  }}
                />
                <span style={{ fontSize: "0.7rem", color: "var(--acct-muted, #6B7280)", fontVariantNumeric: "tabular-nums" }}>
                  {rows.length}
                </span>
              </h3>
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {rows.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    kicker={divisionLabel(signal.division)}
                    title={signal.title}
                    body={signal.body ?? undefined}
                    priority={mapSignalPriority(signal.priority)}
                    accent={divisionColor(signal.division)}
                    timestamp={formatRelative(signal.createdAt)}
                    href={signal.actionUrl ?? "/notifications"}
                    read={signal.emailDispatched}
                    action={
                      signal.emailDispatched ? { label: copy.emailed, tone: "neutral" } : undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {(prevHref || nextHref) ? (
        <nav
          aria-label={copy.paginationAria}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--acct-line, rgba(0,0,0,0.06))",
          }}
        >
          {prevHref ? (
            <Link
              href={prevHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--acct-ink, #0F172A)",
                textDecoration: "none",
              }}
            >
              <ChevronLeft size={14} aria-hidden /> {copy.newer}
            </Link>
          ) : (
            <span aria-hidden />
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--acct-ink, #0F172A)",
                textDecoration: "none",
              }}
            >
              {copy.older} <ChevronRight size={14} aria-hidden />
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </nav>
      ) : null}
    </Section>
  );
}
