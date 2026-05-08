import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { EmptyState, Panel, Section, SignalCard } from "@henryco/dashboard-shell";
import type { SignalFeedItem, SignalFeedCursor } from "@henryco/data";
import { divisionColor, divisionLabel } from "@/lib/format";

/**
 * SignalFeed — the server-rendered signal stream below the attention
 * panel. Renders up to N items as `<SignalCard>` rows, dimming the
 * ones that have already been mirrored to email
 * (`emailDispatched=true`) — anti-pattern #18-adjacent: the user has
 * a parallel acknowledgement channel for those, so they shouldn't
 * compete visually with truly fresh signals (audit §A.8).
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
};

export function SignalFeed({ items, nextCursor, prevHref, hideEmpty }: SignalFeedProps) {
  if (items.length === 0) {
    if (hideEmpty) return null;
    return (
      <Panel tone="flat">
        <EmptyState
          kicker="Signal feed"
          headline="Nothing to surface yet."
          body="When notifications, lifecycle updates, or division activity land, they appear here ranked by priority."
        />
      </Panel>
    );
  }

  const nextHref = nextCursor
    ? `/?cursor.score=${encodeURIComponent(String(nextCursor.score))}&cursor.created_at=${encodeURIComponent(nextCursor.createdAt)}`
    : null;

  return (
    <Section
      kicker="Signal feed"
      headline="Everything across HenryCo, ranked"
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
          <Inbox size={14} aria-hidden /> Open inbox
        </Link>
      }
    >
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {items.map((signal) => (
          <SignalCard
            key={signal.id}
            kicker={divisionLabel(signal.division)}
            title={signal.title}
            body={signal.body ?? undefined}
            priority={mapPriority(signal.priority)}
            accent={divisionColor(signal.division)}
            timestamp={formatRelative(signal.createdAt)}
            href={signal.actionUrl ?? "/notifications"}
            read={signal.emailDispatched}
            action={signal.emailDispatched ? { label: "Emailed", tone: "neutral" } : undefined}
          />
        ))}
      </div>
      {(prevHref || nextHref) ? (
        <nav
          aria-label="Signal feed pagination"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginTop: "1rem",
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
              <ChevronLeft size={14} aria-hidden /> Newer
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
              Older <ChevronRight size={14} aria-hidden />
            </Link>
          ) : (
            <span aria-hidden />
          )}
        </nav>
      ) : null}
    </Section>
  );
}

function mapPriority(priority: string): "info" | "warning" | "urgent" | "security" {
  if (priority === "security") return "security";
  if (priority === "urgent") return "urgent";
  if (priority === "warning") return "warning";
  return "info";
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diffMs = Math.max(0, Date.now() - t);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
