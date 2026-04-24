import { NextResponse } from "next/server";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { sendTestDraft } from "@/lib/newsletter/service";

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
  const payload = (await request.json().catch(() => ({}))) as { to?: string } | null;
  if (!payload?.to) {
    return NextResponse.json({ ok: false, message: "`to` required." }, { status: 400 });
  }
  const result = await sendTestDraft({
    id,
    to: payload.to,
    actorId: viewer.user.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: 422 }
    );
  }
  return NextResponse.json({
    ok: true,
    provider: result.provider,
    messageId: result.messageId,
  });
}
