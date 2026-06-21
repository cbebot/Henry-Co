import Link from "next/link";
import { getArenaCopy } from "@henryco/i18n";
import { getDivisionConfig } from "@henryco/config";
import { GAME_IDS, getGame } from "@henryco/gaming-arena";
import { EmptyStateCard } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { TimeoutError, withTimeout } from "@/lib/with-timeout";
import { isGamingArenaReady } from "@/lib/gaming/arena-flag";
import { getPlayModuleData, type PlayModuleData } from "@/lib/gaming/play-module";
import { LobbyClient } from "./_components/LobbyClient";

export const dynamic = "force-dynamic";

const READ_TIMEOUT_MS = 4_000;

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getArenaCopy(locale);
  return { title: copy.metadata.title, description: copy.metadata.description };
}

export default async function PlayPage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getArenaCopy(locale);
  const division = getDivisionConfig("gaming");

  if (!isGamingArenaReady()) {
    return (
      <div className="acct-play" style={{ maxWidth: 720, margin: "0 auto" }}>
        <EmptyStateCard
          kicker={division.name}
          title={copy.lobby.noLiveTitle}
          body={copy.hero.body}
        />
      </div>
    );
  }

  let data: PlayModuleData | null = null;
  try {
    data = await withTimeout(getPlayModuleData(user.id), READ_TIMEOUT_MS);
  } catch (error) {
    if (!(error instanceof TimeoutError)) data = null;
    data = null;
  }

  const profile = data?.profile ?? null;
  const leaderboard = data?.leaderboard ?? [];
  const games = GAME_IDS.map((id) => {
    const def = getGame(id);
    return { id, name: copy.games[id].name, description: copy.games[id].description, skillWeight: def.skillWeight };
  });

  return (
    <div className="acct-play acct-fade-in" style={{ display: "grid", gap: 24, maxWidth: 920, margin: "0 auto" }}>
      {/* Hero */}
      <header
        style={{
          background: "var(--acct-bg-elevated)",
          border: "1px solid var(--acct-line)",
          borderRadius: 16,
          padding: "28px 24px",
        }}
      >
        <p style={{ color: "var(--acct-div-gaming)", fontWeight: 600, letterSpacing: ".02em", margin: 0 }}>
          {copy.hero.eyebrow}
        </p>
        <h1 style={{ fontSize: 28, margin: "8px 0 6px", color: "var(--acct-ink)" }}>{copy.hero.title}</h1>
        <p style={{ color: "var(--acct-muted)", maxWidth: 620, margin: 0 }}>{copy.hero.body}</p>
        <div style={{ marginTop: 18 }}>
          <LobbyClient copy={copy} games={games} accent={division.accent} />
        </div>
      </header>

      {/* Player stats */}
      {profile ? (
        <section
          aria-label={copy.lobby.ratingLabel}
          style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
        >
          <StatTile label={copy.lobby.ratingLabel} value={String(profile.rating)} />
          <StatTile label={copy.lobby.winsLabel} value={String(profile.wins)} />
          <StatTile label={copy.leaderboard.record} value={`${profile.wins} / ${profile.losses} / ${profile.ties}`} />
        </section>
      ) : null}

      {/* Leaderboard */}
      <section aria-label={copy.leaderboard.title}>
        <h2 style={{ fontSize: 18, color: "var(--acct-ink)", marginBottom: 12 }}>{copy.leaderboard.title}</h2>
        {leaderboard.length === 0 ? (
          <EmptyStateCard
            kicker={division.name}
            title={copy.leaderboard.emptyTitle}
            body={copy.leaderboard.emptyBody}
          />
        ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {leaderboard.map((row, i) => (
              <li
                key={`${row.handle}-${i}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--acct-surface)",
                  border: "1px solid var(--acct-line)",
                  borderRadius: 10,
                }}
              >
                <span style={{ color: "var(--acct-ink)" }}>
                  <strong style={{ color: "var(--acct-muted)", marginRight: 10 }}>{i + 1}</strong>
                  {row.handle}
                </span>
                <span style={{ color: "var(--acct-div-gaming)", fontWeight: 600 }}>{row.rating}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer>
        <Link href="/play/fair-play" style={{ color: "var(--acct-div-gaming)", fontWeight: 600 }}>
          {copy.hero.ctaFairness}
        </Link>
      </footer>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: "1 1 140px",
        background: "var(--acct-surface)",
        border: "1px solid var(--acct-line)",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <p style={{ color: "var(--acct-muted)", fontSize: 13, margin: 0 }}>{label}</p>
      <p style={{ color: "var(--acct-ink)", fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>{value}</p>
    </div>
  );
}
