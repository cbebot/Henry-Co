import { NextResponse } from "next/server";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { cancelDraft } from "@/lib/newsletter/service";

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
      "content_staff",
      "division_manager",
      "supervisor",
      "system_admin",
    ]) ||
    !viewerHasPermission(viewer, "division.write")
  ) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const payload = (await request.json().catch(() => ({}))) as { note?: string } | null;
  const result = await cancelDraft({
    id,
    actorId: viewer.user.id,
    note: payload?.note ?? null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.code === "not_found" ? 404 : 400 }
    );
  }
  return NextResponse.json({ ok: true, campaign: result.campaign });
}
