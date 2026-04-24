import { NextResponse } from "next/server";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { runCampaignSend } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewer = await getStaffViewer();
  if (!viewer?.user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (
    !viewerHasAnyFamily(viewer, [
      "division_manager",
      "supervisor",
      "system_admin",
    ]) ||
    !viewerHasPermission(viewer, "division.approve")
  ) {
    return NextResponse.json(
      { ok: false, message: "Approver role required to send." },
      { status: 403 }
    );
  }
  const payload = (await request.json().catch(() => ({}))) as
    | { dryRun?: boolean; maxPerRun?: number }
    | null;
  const result = await runCampaignSend({
    campaignId: id,
    actorId: viewer.user.id,
    dryRun: Boolean(payload?.dryRun),
    maxPerRun: payload?.maxPerRun,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
