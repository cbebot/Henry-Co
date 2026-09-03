"use client";

/**
 * Micro-Commitment Engine — `<CommitmentGate>` (doctrine Engine 2).
 *
 * Renders its children (the ask UI for ONE rung) only when the tested
 * ladder logic permits that exact ask right now. Mounting the visible ask
 * records the offer + emits `commitment_rung_offered` exactly once.
 *
 *   <CommitmentGate rung="identified" state={commitment} surfaceId="care_browse" trigger="post_save">
 *     <EmailCaptureRow onDone={() => commitment.markAccepted("care_browse")} />
 *   </CommitmentGate>
 */

import { useEffect, useRef, type ReactNode } from "react";
import type { CommitmentTier } from "./commitment.logic";
import type { CommitmentState } from "./useCommitmentTier";

export interface CommitmentGateProps {
  rung: CommitmentTier;
  state: CommitmentState;
  surfaceId: string;
  /** What surfaced the ask, e.g. "post_save", "scroll_70", "post_success". */
  trigger: string;
  children: ReactNode;
}

export function CommitmentGate({ rung, state, surfaceId, trigger, children }: CommitmentGateProps) {
  const show = state.offer?.toTier === rung;
  const recordedRef = useRef(false);

  useEffect(() => {
    if (!show || recordedRef.current) return;
    recordedRef.current = true;
    state.markOffered(surfaceId, trigger);
  }, [show, state, surfaceId, trigger]);

  if (!show) return null;
  return <>{children}</>;
}
