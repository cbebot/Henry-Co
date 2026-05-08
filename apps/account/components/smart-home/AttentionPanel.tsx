import { AlertOctagon, Clock } from "lucide-react";
import { Panel, SignalCard } from "@henryco/dashboard-shell";
import type { SignalFeedItem } from "@henryco/data";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import LifecycleContinuePanel from "@/components/lifecycle/LifecycleContinuePanel";
import { divisionColor, divisionLabel } from "@/lib/format";

/**
 * AttentionPanel — the highest-priority cluster on the Smart Home.
 *
 * Two compositions stacked vertically inside one Panel:
 *
 *   1. Top-of-attention signals — the small set of `getSignalFeed`
 *      items where `priority ∈ {'security','urgent'}`, the SQL
 *      function's strongest two priority strings (the spec calls
 *      these `'blocking'` + `'high'` — see recon §3 D-2 for the
 *      mapping).
 *
 *   2. LifecycleContinuePanel — promoted inline as the "continue
 *      where you left off" surface. The lifecycle panel renders
 *      nothing when the snapshot has zero qualifying entries, so
 *      this Panel collapses cleanly when nothing is wanted.
 *
 * If both compositions render zero rows, the panel itself returns
 * null so the layout shifts up to the next Smart Home block instead
 * of leaving a visible empty Panel.
 */
export type AttentionPanelProps = {
  /** Already filtered to security/urgent signals by the caller. */
  attentionSignals: ReadonlyArray<SignalFeedItem>;
  /** Pre-fetched lifecycle snapshot — null when collector failed. */
  lifecycle: LifecycleSnapshot | null;
};

export function AttentionPanel({ attentionSignals, lifecycle }: AttentionPanelProps) {
  const hasSignals = attentionSignals.length > 0;
  const hasLifecycle = (lifecycle?.actionables.length ?? 0) > 0;
  if (!hasSignals && !hasLifecycle) return null;

  return (
    <Panel tone="raised">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2rem",
              height: "2rem",
              borderRadius: "0.6rem",
              backgroundColor: "rgba(185, 28, 28, 0.10)",
              color: "#B91C1C",
            }}
          >
            <AlertOctagon size={16} aria-hidden />
          </span>
          <div>
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--acct-muted, #6B7280)",
                margin: 0,
              }}
            >
              Attention
            </p>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--acct-ink, #0F172A)",
                margin: 0,
                marginTop: "0.15rem",
              }}
            >
              Open threads ranked by what blocks first
            </h2>
          </div>
        </header>

        {hasSignals ? (
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))" }}>
            {attentionSignals.slice(0, 6).map((signal) => (
              <SignalCard
                key={signal.id}
                kicker={divisionLabel(signal.division)}
                title={signal.title}
                body={signal.body ?? undefined}
                priority={mapPriority(signal.priority)}
                accent={divisionColor(signal.division)}
                icon={<AlertOctagon size={14} aria-hidden />}
                timestamp={formatRelative(signal.createdAt)}
                href={signal.actionUrl ?? "/notifications"}
                read={signal.emailDispatched}
              />
            ))}
          </div>
        ) : null}

        {lifecycle && hasLifecycle ? (
          <div style={{ marginTop: hasSignals ? "0.5rem" : 0 }}>
            <header
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                color: "var(--acct-muted, #6B7280)",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              <Clock size={14} aria-hidden />
              <span>Continue where you left off</span>
            </header>
            <LifecycleContinuePanel snapshot={lifecycle} />
          </div>
        ) : null}
      </div>
    </Panel>
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
