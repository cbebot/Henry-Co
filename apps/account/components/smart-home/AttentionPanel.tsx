import { AlertOctagon, Clock } from "lucide-react";
import { Panel, SignalCard } from "@henryco/dashboard-shell";
import { getAccountHeroesCopy } from "@henryco/i18n";
import type { SignalFeedItem } from "@henryco/data";
import { getAccountAppLocale } from "@/lib/locale-server";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import LifecycleContinuePanel from "@/components/lifecycle/LifecycleContinuePanel";
import { divisionColor, divisionLabel } from "@/lib/format";
import { formatRelative, mapSignalPriority } from "@/lib/smart-home/format";

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

export async function AttentionPanel({ attentionSignals, lifecycle }: AttentionPanelProps) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale).attentionPanel;
  const hasSignals = attentionSignals.length > 0;
  const hasLifecycle = (lifecycle?.actionables.length ?? 0) > 0;
  if (!hasSignals && !hasLifecycle) return null;

  const securityCount = attentionSignals.filter((s) => s.priority === "security").length;
  const urgentCount = attentionSignals.filter((s) => s.priority === "urgent").length;
  const lifecycleBlocking = lifecycle
    ? lifecycle.actionables.filter((a) => a.priority === "critical").length
    : 0;

  return (
    <Panel tone="raised">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2rem",
                height: "2rem",
                borderRadius: "0.6rem",
                backgroundColor: "var(--hc-status-danger-bg)",
                color: "var(--hc-status-danger-text)",
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
                {copy.kicker}
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
                {copy.title}
              </h2>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {securityCount > 0 ? (
              <PriorityChip
                count={securityCount}
                label={copy.chipSecurity}
                background="rgba(185, 28, 28, 0.10)"
                color="#B91C1C"
              />
            ) : null}
            {urgentCount > 0 ? (
              <PriorityChip
                count={urgentCount}
                label={copy.chipUrgent}
                background="rgba(217, 119, 6, 0.12)"
                color="#B45309"
              />
            ) : null}
            {lifecycleBlocking > 0 ? (
              <PriorityChip
                count={lifecycleBlocking}
                label={copy.chipBlocking}
                background="rgba(124, 58, 237, 0.12)"
                color="#6D28D9"
              />
            ) : null}
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
                priority={mapSignalPriority(signal.priority)}
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
              <span>{copy.continueLabel}</span>
            </header>
            <LifecycleContinuePanel snapshot={lifecycle} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function PriorityChip({
  count,
  label,
  background,
  color,
}: {
  count: number;
  label: string;
  background: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.25rem 0.6rem",
        borderRadius: "999px",
        backgroundColor: background,
        color,
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
      <span>{label}</span>
    </span>
  );
}

