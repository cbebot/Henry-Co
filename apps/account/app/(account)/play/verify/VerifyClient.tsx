"use client";

import { useEffect, useState } from "react";
import type { ArenaCopy } from "@henryco/i18n";
import { verifyReveal } from "@henryco/gaming-arena";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type VerifyStatus = "loading" | "verified" | "failed" | "notready" | "zerorng" | "error";

/**
 * Public fairness verifier. Reads a COMPLETED match's commitment + revealed seed
 * via the public RPC and recomputes sha256(revealedSeed) === commitment in the
 * browser using the PURE, client-safe verifier — the literal "provably fair"
 * promise: the player verifies it themselves, on their own device.
 */
export function VerifyClient({ copy, matchId }: { copy: ArenaCopy; matchId: string }) {
  const [status, setStatus] = useState<VerifyStatus>(matchId ? "loading" : "error");
  const [commitment, setCommitment] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return; // initial state is already "error"; no synchronous setState in effect
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowser();
        const { data, error } = await supabase.rpc("get_gaming_match_fairness", { p_match_id: matchId });
        if (cancelled) return;
        if (error || !data) {
          setStatus("error");
          return;
        }
        const d = data as {
          status?: string;
          commitment?: string | null;
          revealed_seed?: string | null;
        };
        if (d.status !== "completed") {
          setStatus("notready");
          return;
        }
        if (!d.commitment || !d.revealed_seed) {
          setStatus("zerorng"); // Onyx Lines — no RNG; fairness is the move log
          return;
        }
        setCommitment(d.commitment);
        setRevealed(d.revealed_seed);
        const ok = await verifyReveal(d.commitment, d.revealed_seed);
        if (!cancelled) setStatus(ok ? "verified" : "failed");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const headline =
    status === "verified"
      ? copy.fairness.verified
      : status === "failed"
        ? copy.fairness.failed
        : status === "zerorng"
          ? copy.fairness.zeroRngNote
          : status === "notready"
            ? copy.fairness.notReady
            : status === "loading"
              ? copy.lobby.searching
              : copy.fairness.failed;

  const tone =
    status === "verified" ? "var(--acct-green)" : status === "failed" || status === "error" ? "var(--acct-red)" : "var(--acct-muted)";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 24, color: "var(--acct-ink)", margin: 0 }}>{copy.fairness.title}</h1>
      <p role="status" style={{ color: tone, fontWeight: 700, fontSize: 18, margin: 0 }}>
        {headline}
      </p>
      {commitment ? (
        <dl style={{ display: "grid", gap: 8, margin: 0 }}>
          <div>
            <dt style={{ color: "var(--acct-muted)", fontSize: 13 }}>{copy.fairness.commitmentLabel}</dt>
            <dd style={{ color: "var(--acct-ink)", fontFamily: "monospace", wordBreak: "break-all", margin: 0 }}>
              {commitment}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--acct-muted)", fontSize: 13 }}>{copy.fairness.revealedLabel}</dt>
            <dd style={{ color: "var(--acct-ink)", fontFamily: "monospace", wordBreak: "break-all", margin: 0 }}>
              {revealed}
            </dd>
          </div>
        </dl>
      ) : null}
      <p style={{ color: "var(--acct-muted)", lineHeight: 1.6, fontSize: 14 }}>{copy.fairness.body}</p>
    </div>
  );
}
