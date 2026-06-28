import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { ArrowRight } from "lucide-react";
import { formatRating, ordinalRank } from "../format";
import type { PlayLeaderboardEntry } from "../data";

/**
 * LeaderboardCard — the public ranked leaderboard (top players by
 * rating, from the `get_gaming_leaderboard` RPC). Renders ONLY when the
 * arena is enabled and the RPC returned rows; the module manifest gates
 * it behind `hasRankedContent` so it never shows an empty shell.
 */
export function LeaderboardCard({
  leaderboard,
}: {
  leaderboard: ReadonlyArray<PlayLeaderboardEntry>;
}) {
  const gaming = getDivisionConfig("gaming");
  const rows = leaderboard.slice(0, 5);

  return (
    <Panel tone="raised">
      <Section
        kicker="Leaderboard"
        headline="Top of the arena"
        action={
          <ActionButton
            href="/play"
            tone="ghost"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            View all
          </ActionButton>
        }
      >
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {rows.map((row, index) => (
            <li key={`${row.handle}-${index}`}>
              <Link
                href="/play"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  borderRadius: "0.625rem",
                  border: `1px solid var(${CSS_VARS.hairline})`,
                  backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
                  color: `var(${CSS_VARS.ink})`,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    minWidth: 0,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: `var(${CSS_VARS.inkMuted})`,
                      width: "1.75rem",
                    }}
                  >
                    {ordinalRank(index)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.handle}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: gaming.accentText,
                  }}
                >
                  {formatRating(row.rating)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>
    </Panel>
  );
}
