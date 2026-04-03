import { NextResponse } from "next/server";
import { getLearnViewer } from "@/lib/learn/auth";
import { publishAcademyAnnouncement } from "@/lib/learn/workflows";

export async function POST(request: Request) {
  const viewer = await getLearnViewer();
  if (!viewer.user || !viewer.roles.some((role) => ["academy_owner", "academy_admin", "support"].includes(role))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { title?: string; body?: string; audience?: "all_active_learners" | "internal_learners" }
    | null;

  if (!body?.title || !body?.body) {
    return NextResponse.json({ ok: false, error: "Title and body are required." }, { status: 400 });
  }

  const result = await publishAcademyAnnouncement({
    actor: viewer,
    title: body.title,
    body: body.body,
    audience: body.audience || "all_active_learners",
  });

  return NextResponse.json({ ok: true, result });
}
