"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ArenaCopy } from "@henryco/i18n";
import type { GameId } from "@henryco/gaming-arena";

type GameChoice = { id: GameId; name: string; description: string; skillWeight: number };

export function LobbyClient({
  copy,
  games,
  accent,
}: {
  copy: ArenaCopy;
  games: ReadonlyArray<GameChoice>;
  accent: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyGame, setBusyGame] = useState<GameId | null>(null);
  const [error, setError] = useState(false);

  function quickMatch(gameId: GameId) {
    setBusyGame(gameId);
    setError(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/play/quick-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        });
        if (!res.ok) {
          setError(true);
          setBusyGame(null);
          return;
        }
        const data = (await res.json()) as { matchId?: string };
        if (data.matchId) router.push(`/play/${data.matchId}`);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setBusyGame(null);
      }
    });
  }

  return (
    <div>
      <p style={{ color: "var(--acct-muted)", margin: "0 0 10px", fontSize: 14 }}>{copy.lobby.quickMatchBody}</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {games.map((game) => (
          <div
            key={game.id}
            style={{
              background: "var(--acct-surface)",
              border: "1px solid var(--acct-line)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <strong style={{ color: "var(--acct-ink)" }}>{game.name}</strong>
            <span style={{ color: "var(--acct-muted)", fontSize: 13, flex: 1 }}>{game.description}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => quickMatch(game.id)}
              style={{
                background: accent,
                color: "var(--hc-text-on-accent)",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 600,
                cursor: pending ? "wait" : "pointer",
                opacity: pending && busyGame !== game.id ? 0.6 : 1,
              }}
            >
              {busyGame === game.id ? copy.lobby.searching : copy.lobby.findMatch}
            </button>
          </div>
        ))}
      </div>
      {error ? (
        <p role="alert" style={{ color: "var(--acct-red)", marginTop: 10, fontSize: 13 }}>
          {copy.match.abandoned}
        </p>
      ) : null}
    </div>
  );
}
