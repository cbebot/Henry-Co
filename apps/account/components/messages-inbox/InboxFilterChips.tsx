import Link from "next/link";
import type { InboxAggregate, InboxDivision } from "@henryco/data";
import type { AccountCopy } from "@henryco/i18n/server";
import { DIVISION_ACCENT_VAR } from "./helpers";

type MessagesCopy = AccountCopy["messages"];

type Props = {
  aggregate: InboxAggregate;
  /** Currently selected division (or "all"). */
  active: InboxDivision | "all";
  copy: MessagesCopy;
};

/**
 * V3 Wave A1 D3 — division filter chip row.
 *
 * Pure-link navigation — no client state. Each chip is an anchor to
 * `/messages?filter=<division>` so deep-links work and the SSR result
 * is cacheable per filter. The active chip flips to ink fill, inactive
 * chips wear the division accent dot.
 */
export function InboxFilterChips({ aggregate, active, copy }: Props) {
  const divisions = Object.keys(aggregate.counts) as InboxDivision[];

  return (
    <nav className="acct-inbox__chips" aria-label={copy.chips.ariaLabel}>
      <Link
        href="/messages"
        className="acct-inbox__chip"
        data-active={active === "all"}
        aria-current={active === "all" ? "page" : undefined}
      >
        <span>{copy.chips.allThreads}</span>
        <span className="acct-inbox__chip-count">{aggregate.threads.length}</span>
      </Link>
      {divisions
        .filter((d) => aggregate.counts[d] > 0)
        .sort((a, b) => aggregate.counts[b] - aggregate.counts[a])
        .map((division) => (
          <Link
            key={division}
            href={`/messages?filter=${division}`}
            className="acct-inbox__chip"
            data-active={active === division}
            aria-current={active === division ? "page" : undefined}
          >
            <span
              className="acct-inbox__chip-dot"
              aria-hidden
              style={{ color: `var(${DIVISION_ACCENT_VAR[division]})` }}
            />
            <span>{copy.divisionLabels[division]}</span>
            <span className="acct-inbox__chip-count">
              {aggregate.counts[division]}
            </span>
          </Link>
        ))}
    </nav>
  );
}
