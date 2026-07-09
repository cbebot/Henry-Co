import Link from "next/link";
import { ArrowUpRight, Clock, AlertOctagon, Sparkles } from "lucide-react";
import {
  LIFECYCLE_PILLAR_LABEL,
  LIFECYCLE_STAGE_LABEL,
  groupSnapshotForUi,
  type LifecycleSnapshot,
  type LifecycleSnapshotEntry,
} from "@henryco/lifecycle";
import { toBrandName } from "@henryco/config";
import { LinkActivity } from "@henryco/dashboard-shell";

type Props = {
  snapshot: LifecycleSnapshot;
};

type CohortKey = "attention" | "inflight" | "reengage";

type CohortBlock = {
  key: CohortKey;
  title: string;
  entries: LifecycleSnapshotEntry[];
  icon: typeof Clock;
};

function cohortBlocks(snapshot: LifecycleSnapshot): CohortBlock[] {
  const grouped = groupSnapshotForUi(snapshot);
  const all: CohortBlock[] = [
    { key: "attention", title: "Needs attention", entries: grouped.blocking, icon: AlertOctagon },
    { key: "inflight", title: "Continue where you left off", entries: grouped.inFlight, icon: Clock },
    { key: "reengage", title: "Worth a second look", entries: grouped.reengage, icon: Sparkles },
  ];
  return all.filter((block) => block.entries.length > 0);
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

/**
 * LifecycleContinuePanel — the "pick up where you left off" surface.
 *
 * Editorial resume board on the account `--acct-*` token system (styles
 * in globals.css `.acct-lifecycle*`): three priority cohorts, each a set
 * of resume rows with a tone-accent rail, pillar + stage chips, the
 * next-action as the serif lead, the live status, last-active, and a
 * Resume affordance that lifts on hover + presses on tap. Real data only
 * — no invented progress. Theme-aware (cream→onyx), AA, reduced-motion.
 */
export default function LifecycleContinuePanel({ snapshot }: Props) {
  const blocks = cohortBlocks(snapshot);
  if (blocks.length === 0) return null;

  return (
    <section className="acct-lifecycle" aria-label="Continue where you left off">
      <header className="acct-lifecycle__head">
        <p className="acct-lifecycle__kicker">Lifecycle</p>
        <h2 className="acct-lifecycle__title">Pick up where you left off</h2>
        <p className="acct-lifecycle__sub">
          Your open journeys across {toBrandName("Henry Onyx")} divisions, ranked by what needs you first.
        </p>
      </header>

      <div className="acct-lifecycle__cohorts">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <div key={block.key} className="acct-lifecycle__cohort" data-tone={block.key}>
              <div className="acct-lifecycle__cohort-head">
                <span className="acct-lifecycle__cohort-icon">
                  <Icon size={15} aria-hidden />
                </span>
                <span className="acct-lifecycle__cohort-label">{block.title}</span>
                <span className="acct-lifecycle__cohort-count">{block.entries.length}</span>
              </div>

              <ul className="acct-lifecycle__rows">
                {block.entries.slice(0, 4).map((entry) => {
                  const href = entry.nextActionUrl || null;
                  const isExternal = href?.startsWith("http") ?? false;
                  const lastActive = formatLastActive(entry.lastActiveAt);
                  const key = `${entry.pillar}-${entry.stage}`;
                  const inner = (
                    <>
                      <span className="acct-lifecycle__body">
                        <span className="acct-lifecycle__chips">
                          <span className="acct-lifecycle__chip">
                            {LIFECYCLE_PILLAR_LABEL[entry.pillar]}
                          </span>
                          <span className="acct-lifecycle__stage">
                            {LIFECYCLE_STAGE_LABEL[entry.stage]}
                          </span>
                        </span>
                        <span className="acct-lifecycle__action">
                          {entry.nextActionLabel || entry.status}
                        </span>
                        <span className="acct-lifecycle__status">{entry.status}</span>
                        {lastActive ? (
                          <span className="acct-lifecycle__meta">Last active {lastActive}</span>
                        ) : null}
                      </span>
                      {href ? (
                        <span className="acct-lifecycle__cta">
                          Resume <ArrowUpRight size={14} aria-hidden />
                        </span>
                      ) : null}
                    </>
                  );

                  if (!href) {
                    return (
                      <li key={key}>
                        <div className="acct-lifecycle__row">{inner}</div>
                      </li>
                    );
                  }
                  return (
                    <li key={key}>
                      {isExternal ? (
                        <a
                          className="acct-lifecycle__row"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {inner}
                        </a>
                      ) : (
                        <Link className="acct-lifecycle__row" href={href}>
                          {inner}
                          <LinkActivity />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
