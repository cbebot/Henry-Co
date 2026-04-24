import { NextResponse } from "next/server";
import type {
  NewsletterCampaignClass,
  NewsletterCampaignContent,
  NewsletterDivision,
} from "@henryco/newsletter";
import { getStaffViewer } from "@/lib/staff-auth";
import { viewerHasAnyFamily, viewerHasPermission } from "@/lib/roles";
import { createDraft } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
  if (!payload?.content || !payload.campaignClass || !payload.division) {
    return NextResponse.json(
      { ok: false, message: "Missing content, campaignClass, or division." },
      { status: 400 }
    );
  }

  const result = await createDraft({
    content: payload.content,
    campaignClass: payload.campaignClass,
    division: payload.division,
    topicKeys: Array.isArray(payload.topicKeys) ? payload.topicKeys : [],
    authorId: viewer.user.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.code === "validation_failed" ? 400 : 500 }
    );
  }
  return NextResponse.json({ ok: true, campaign: result.campaign });
}
