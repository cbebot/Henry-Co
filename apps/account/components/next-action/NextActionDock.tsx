import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { NextActionChipAction } from "@henryco/ui/next-action";
import { ACCOUNT_CHROME_MOBILE_LIFT } from "@/lib/chrome";
import { resolveAccountNextAction } from "@/lib/next-action/resolve";
import { AccountNextActionChip } from "./AccountNextActionChip";

/**
 * V3-39 — the ONE next-action chrome affordance for the account division
 * (single shared host; mounted once in the (account) shell layout).
 *
 * Flag-dark by default: with `personalization_next_action` unset this renders
 * null before any read. When live, the server resolves the chip (deterministic,
 * viewer-scoped, consent-gated stitch) and ships ONLY the client-safe
 * projection below — the catalog, scores, confidence tiers, and reason codes
 * never leave the server.
 *
 * Corner arbitration: the chip shares `ACCOUNT_CHROME_MOBILE_LIFT` with the
 * IntelligenceLauncher mount in the root layout, and its stylesheet reserves
 * the launcher clearance + a lower z-index (`@henryco/ui/next-action`
 * arbitration contract) — chip above, launcher below, no overlap, no z-fight.
 */
export async function NextActionDock({
  viewer,
  preferences,
}: {
  viewer: UnifiedViewer;
  preferences: Record<string, unknown> | null;
}) {
  const resolved = await resolveAccountNextAction({ viewer, preferences });
  if (!resolved) return null;

  // Client-safe projection — exactly the fields the chip renders.
  const action: NextActionChipAction = {
    id: resolved.action.id,
    contextKind: resolved.action.contextKind,
    division: resolved.action.division,
    title: resolved.action.title,
    ctaHref: resolved.action.ctaHref,
    ctaLabel: resolved.action.ctaLabel,
    placement: resolved.action.placement,
    sensitive: resolved.action.sensitive,
    stitched: resolved.action.stitched,
  };

  return (
    <AccountNextActionChip
      action={action}
      labels={resolved.labels}
      bottomOffset={ACCOUNT_CHROME_MOBILE_LIFT}
    />
  );
}
