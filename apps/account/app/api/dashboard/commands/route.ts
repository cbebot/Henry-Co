/**
 * V2-DASH-05 — /api/dashboard/commands
 *
 * Returns the cross-module palette commands the requesting user is
 * eligible to invoke. Walks every registered dashboard module via
 * `collectModuleCommands(viewer)`; each module's
 * `getCommandPaletteEntries(viewer)` is invoked server-side so role
 * gating runs through the same `getEligibleModules` walk the
 * WorkspaceRail uses.
 *
 * Anti-pattern #11: this is a NEW read-only endpoint. No state
 * changes; no migration of an existing route.
 *
 * Cache discipline: every response is `private, max-age=0,
 * must-revalidate` because the command set is per-viewer and depends
 * on per-module live snapshots (vendor flag, lifecycle state, etc.).
 */

import { NextResponse } from "next/server";
import { collectModuleCommands, toWirePayload } from "@henryco/dashboard-shell";
import { buildUnifiedViewer } from "@henryco/auth/server";

import { requireAccountUser } from "@/lib/auth";

// Side-effect import — registers every module so `getEligibleModules`
// has a populated registry to walk. Same import the @rail/default and
// home page consume.
import "@/app/(account)/_modules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const result = await collectModuleCommands(viewer);
  const payload = toWirePayload(result);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
