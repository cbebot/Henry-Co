import { NextResponse } from "next/server";
import type {
  NewsletterCampaignClass,
  NewsletterCampaignContent,
  NewsletterDivision,
} from "@henryco/newsletter";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { getCampaign, updateDraft } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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
    !viewerHasPermission(viewer, "division.read")
  ) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const detail = await getCampaign(id);
  if (!detail.campaign) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...detail });
}

export async function PATCH(
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
  const payload = (await request.json().catch(() => null)) as
    | {
        content?: NewsletterCampaignContent;
        topicKeys?: string[];
        campaignClass?: NewsletterCampaignClass;
        division?: NewsletterDivision;
      }
    | null;
  if (!payload) {
    return NextResponse.json({ ok: false, message: "Missing body." }, { status: 400 });
  }
  const result = await updateDraft({
    id,
    actorId: viewer.user.id,
    content: payload.content,
    topicKeys: payload.topicKeys,
    campaignClass: payload.campaignClass,
    division: payload.division,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.code === "not_found" ? 404 : 400 }
    );
  }
  return NextResponse.json({ ok: true, campaign: result.campaign, voice: result.voice });
}
