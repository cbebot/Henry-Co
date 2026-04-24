import { NextResponse } from "next/server";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { approveDraft } from "@/lib/newsletter/service";

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
  const payload = (await request.json().catch(() => ({}))) as { note?: string } | null;
  const result = await approveDraft({
    id,
    actorId: viewer.user.id,
    note: payload?.note ?? null,
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
