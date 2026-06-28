import Link from "next/link";
import { Panel, Section, ActionButton } from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { getDivisionConfig } from "@henryco/config";
import { GAME_IDS } from "@henryco/gaming-arena";
import { Gamepad2, ArrowRight } from "lucide-react";

/**
 * ArenaEntryCard — the calm, honest entry-point widget for Henry Onyx
 * Live.
 *
 * The free-play arena is flag-dark in production (no ranked metrics to
 * show), so the home grid surfaces a single calm entry point rather than
 * fabricated zeros. This mirrors the live page's foyer
 * (`apps/account/app/(account)/play/page.tsx`) which offers
 * practice-vs-AI and the rules walkthrough immediately — both need no
 * server — while live multiplayer stays dark.
 *
 * NO metrics: there is deliberately no rating / win count / leaderboard
 * here. Those only render once the arena is enabled and the viewer has a
 * ranked profile (see `ArenaStatsCard` / `LeaderboardCard`).
 */
export function ArenaEntryCard() {
  const gaming = getDivisionConfig("gaming");
  // Real catalog size from the gaming-arena package — never a hardcoded
  // count. Currently the two flagship games (Onyx Lines, Onyx Cards).
  const gameCount = GAME_IDS.length;

  return (
    <Panel tone="raised">
      <Section
        kicker={gaming.name}
        headline="Practice, learn, and play"
        description="A free, provably-fair arena for skill-based head-to-head matches."
        action={
          <ActionButton
            href="/play"
            tone="primary"
            icon={<ArrowRight size={14} />}
            iconPosition="trailing"
          >
            Enter the arena
          </ActionButton>
        }
      >
        <Link
          href="/play"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            border: `1px solid var(${CSS_VARS.hairline})`,
            backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
            color: `var(${CSS_VARS.ink})`,
            textDecoration: "none",
          }}
        >
          <span
            aria-hidden
            style={{
              color: gaming.accentText,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2rem",
              height: "2rem",
              borderRadius: "0.5rem",
              backgroundColor: `var(${CSS_VARS.accentSoft})`,
              flexShrink: 0,
            }}
          >
            <Gamepad2 size={16} />
          </span>
          <span
            style={{
              fontSize: "0.8125rem",
              color: `var(${CSS_VARS.inkSoft})`,
              lineHeight: 1.4,
            }}
          >
            {gameCount} free games — train against the AI, learn the rules,
            then climb the ranked leaderboard. No stake, every match verifiable.
          </span>
        </Link>
      </Section>
    </Panel>
  );
}
