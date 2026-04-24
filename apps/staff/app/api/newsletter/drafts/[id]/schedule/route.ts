import { NextResponse } from "next/server";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { scheduleDraft } from "@/lib/newsletter/service";

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
      { ok: false, message: "Approver role required." },
      { status: 403 }
    );
  }
  const payload = (await request.json().catch(() => ({}))) as
    | { scheduledFor?: string; note?: string }
    | null;
  if (!payload?.scheduledFor) {
    return NextResponse.json(
      { ok: false, message: "scheduledFor required." },
      { status: 400 }
    );
  }
  const result = await scheduleDraft({
    id,
    actorId: viewer.user.id,
    scheduledFor: payload.scheduledFor,
    note: payload.note ?? null,
  });
  if (!result.ok) {
    const code =
      result.code === "voice_guard_blocked"
        ? 422
        : result.code === "not_found"
          ? 404
          : 400;
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        code: result.code,
        blocks: result.blocks ?? [],
      },
      { status: code }
    );
  }
  return NextResponse.json({ ok: true, campaign: result.campaign });
}
