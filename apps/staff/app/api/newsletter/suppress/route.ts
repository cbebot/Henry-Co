import { NextResponse } from "next/server";
import type {
  NewsletterSuppressionReason,
  NewsletterSuppressionScope,
} from "@henryco/newsletter";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { manuallySuppress } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const viewer = await getStaffViewer();
  if (!viewer?.user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (
    !viewerHasAnyFamily(viewer, [
      "support_staff",
      "moderation_staff",
      "division_manager",
      "supervisor",
      "system_admin",
    ]) ||
    !viewerHasPermission(viewer, "division.read")
  ) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const payload = (await request.json().catch(() => null)) as
    | {
        email?: string;
        reason?: NewsletterSuppressionReason;
        scope?: NewsletterSuppressionScope;
        note?: string;
        division?: string;
      }
    | null;
  if (!payload?.email || !payload.reason || !payload.scope) {
    return NextResponse.json(
      { ok: false, message: "email, reason, scope required." },
      { status: 400 }
    );
  }
  const result = await manuallySuppress({
    email: payload.email,
    reason: payload.reason,
    scope: payload.scope,
    note: payload.note,
    division: payload.division,
    actorId: viewer.user.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.error },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
