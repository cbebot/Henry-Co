"use client";

/**
 * Micro-Commitment Engine — `useCommitmentTier` (doctrine Engine 2).
 *
 * The persistence lives behind an injected adapter (the app supplies the
 * server-backed anonymous-session implementation — the V3-01 pattern). The
 * hook resolves the user's tier + the one permissible offer via the tested
 * `nextOffer`, and emits the Part-VI ladder telemetry.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInteractionTelemetry } from "../../context";
import {
  nextOffer,
  type CommitmentOffer,
  type CommitmentTier,
  type OfferRecord,
} from "./commitment.logic";

export interface CommitmentAdapter {
  /** Opaque id for the CURRENT session (rotates per visit). */
  sessionId: string;
  getTier(): CommitmentTier | Promise<CommitmentTier>;
  getOfferHistory(): OfferRecord[] | Promise<OfferRecord[]>;
  recordOffer(record: OfferRecord): void | Promise<void>;
}

export interface CommitmentState {
  tier: CommitmentTier;
  /** The single offer permitted right now, or null. */
  offer: CommitmentOffer | null;
  /** Call when the offer UI is actually shown (records + emits telemetry). */
  markOffered(surfaceId: string, trigger: string): void;
  /** Call when the user accepts the rung (emits telemetry; app performs the upgrade). */
  markAccepted(surfaceId: string): void;
}

export function useCommitmentTier(adapter: CommitmentAdapter): CommitmentState {
  const telemetry = useInteractionTelemetry();
  const [tier, setTier] = useState<CommitmentTier>("anonymous");
  const [history, setHistory] = useState<OfferRecord[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [t, h] = await Promise.all([adapter.getTier(), adapter.getOfferHistory()]);
      if (!alive) return;
      setTier(t);
      setHistory(h);
    })();
    return () => {
      alive = false;
    };
  }, [adapter]);

  const offer = useMemo(
    () => nextOffer(tier, history, Date.now(), adapter.sessionId),
    [tier, history, adapter.sessionId],
  );

  const markOffered = useCallback(
    (surfaceId: string, trigger: string) => {
      if (!offer) return;
      const record: OfferRecord = { toTier: offer.toTier, at: Date.now(), sessionId: adapter.sessionId };
      setHistory((h) => [...h, record]);
      void adapter.recordOffer(record);
      telemetry.emit({
        name: "commitment_rung_offered",
        props: { from_tier: offer.fromTier, to_tier: offer.toTier, surface_id: surfaceId, trigger },
      });
    },
    [offer, adapter, telemetry],
  );

  const markAccepted = useCallback(
    (surfaceId: string) => {
      if (!offer) return;
      telemetry.emit({
        name: "commitment_rung_accepted",
        props: { from_tier: offer.fromTier, to_tier: offer.toTier, surface_id: surfaceId },
      });
    },
    [offer, telemetry],
  );

  return { tier, offer, markOffered, markAccepted };
}
