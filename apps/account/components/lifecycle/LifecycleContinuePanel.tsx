import Link from "next/link";
import { ArrowUpRight, Clock, AlertOctagon, Sparkles } from "lucide-react";
import {
  LIFECYCLE_PILLAR_LABEL,
  LIFECYCLE_STAGE_LABEL,
  groupSnapshotForUi,
  type LifecycleSnapshot,
  type LifecycleSnapshotEntry,
} from "@henryco/lifecycle";

type Props = {
  snapshot: LifecycleSnapshot;
};

type CohortBlock = {
  title: string;
  entries: LifecycleSnapshotEntry[];
  icon: typeof Clock;
  tone: string;
  toneSoft: string;
};

function cohortBlocks(snapshot: LifecycleSnapshot): CohortBlock[] {
  const grouped = groupSnapshotForUi(snapshot);
  return [
    {
      title: "Needs attention",
      entries: grouped.blocking,
      icon: AlertOctagon,
      tone: "var(--acct-red)",
      toneSoft: "var(--acct-red-soft)",
    },
    {
      title: "Continue where you left off",
      entries: grouped.inFlight,
      icon: Clock,
      tone: "var(--acct-blue)",
      toneSoft: "var(--acct-blue-soft, rgba(58, 130, 255, 0.12))",
    },
    {
      title: "Worth a second look",
      entries: grouped.reengage,
      icon: Sparkles,
      tone: "var(--acct-gold)",
      toneSoft: "var(--acct-gold-soft)",
    },
  ].filter((block) => block.entries.length > 0);
}

function formatLastActive(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LifecycleContinuePanel({ snapshot }: Props) {
  const blocks = cohortBlocks(snapshot);
  if (blocks.length === 0) return null;

  return (
    <section className="acct-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="acct-kicker">Lifecycle</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">
            Pick up where you left off
          </h2>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            Live view of your open threads across HenryCo divisions, ranked by priority.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {blocks.map((block) => {
          const entries = block.entries.slice(0, 4);
          return (
            <div key={block.title}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: block.toneSoft, color: block.tone }}
                >
                  <block.icon size={14} />
                </span>
                <span className="text-sm font-semibold text-[var(--acct-ink)]">{block.title}</span>
                <span className="text-xs text-[var(--acct-muted)]">
                  ({block.entries.length})
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {entries.map((entry) => {
                  const href = entry.nextActionUrl || "#";
                  const lastActive = formatLastActive(entry.lastActiveAt);
                  const isExternal = href.startsWith("http");
                  const Content = (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]"
                            style={{ backgroundColor: block.toneSoft, color: block.tone }}
                          >
                            {LIFECYCLE_PILLAR_LABEL[entry.pillar]}
                          </span>
                          <span className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                            {LIFECYCLE_STAGE_LABEL[entry.stage]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">
                          {entry.nextActionLabel || entry.status}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--acct-muted)] line-clamp-2">
                          {entry.status}
                        </p>
                        {lastActive ? (
                          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--acct-muted)]">
                            Last active {lastActive}
                          </p>
                        ) : null}
                      </div>
                      <ArrowUpRight size={16} className="shrink-0 text-[var(--acct-muted)]" />
                    </div>
                  );
                  if (!entry.nextActionUrl) {
                    return (
                      <div
                        key={`${entry.pillar}-${entry.stage}`}
                        className="block rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3"
                      >
                        {Content}
                      </div>
                    );
                  }
                  return isExternal ? (
                    <a
                      key={`${entry.pillar}-${entry.stage}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3 transition hover:border-[var(--acct-gold)]/35"
                    >
                      {Content}
                    </a>
                  ) : (
                    <Link
                      key={`${entry.pillar}-${entry.stage}`}
                      href={href}
                      className="block rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-3 transition hover:border-[var(--acct-gold)]/35"
                    >
                      {Content}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
