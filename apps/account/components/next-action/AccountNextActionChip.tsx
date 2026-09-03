"use client";

import {
  NextActionChip,
  type NextActionChipAction,
  type NextActionChipLabels,
} from "@henryco/ui/next-action";
import {
  dismissNextActionAction,
  recordNextActionClickAction,
} from "@/lib/next-action/actions";

/**
 * V3-39 — the account host's client seam for the shared chip: wires dismissal
 * persistence + click telemetry (fire-and-forget server actions) onto the
 * package component. Receives ONLY the final client-safe projection — no
 * reason codes, no confidence tier, no scores.
 */
export function AccountNextActionChip({
  action,
  labels,
  bottomOffset,
}: {
  action: NextActionChipAction;
  labels: NextActionChipLabels;
  bottomOffset?: string;
}) {
  return (
    <NextActionChip
      action={action}
      labels={labels}
      bottomOffset={bottomOffset}
      onDismiss={() =>
        void dismissNextActionAction({
          contextKind: action.contextKind,
          actionId: action.id,
        }).catch(() => undefined)
      }
      onActivate={() =>
        void recordNextActionClickAction({
          contextKind: action.contextKind,
          actionId: action.id,
          division: action.division,
          stitched: action.stitched,
        }).catch(() => undefined)
      }
    />
  );
}
