import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { sendSupportReplyNotification } from "@/lib/studio/email/send";
import { appendSupportMessage } from "@/lib/studio/shared-account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") || "/support");
  const threadId = String(formData.get("threadId") || "").trim();
  const body = String(formData.get("body") || "").trim();

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!threadId || !body) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data: thread } = await admin
    .from("support_threads")
    .select("id, user_id, subject")
    .eq("id", threadId)
    .maybeSingle<{ id: string; user_id: string | null; subject: string | null }>();

  if (!thread) {
    return NextResponse.json({ ok: false, error: "Thread not found" }, { status: 404 });
  }

  const { data: memberships } = await admin
    .from("studio_role_memberships")
    .select("role")
    .eq("is_active", true)
    .eq("user_id", user.id);
  const staffRoles = new Set((memberships ?? []).map((row) => String((row as { role?: string }).role || "")));
  const hasSupportRole = staffRoles.has("studio_owner") || staffRoles.has("client_success");

  const isThreadOwner = thread.user_id === user.id;
  if (!isThreadOwner && !hasSupportRole) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const senderId = user.id;
  const senderType = isThreadOwner ? "customer" : "staff";
  const threadUserId: string | null = thread.user_id || null;
  const threadSubject = thread.subject || "Studio support";

  await appendSupportMessage({
    threadId,
    senderId,
    senderType,
    body,
  });

  if (senderType !== "customer" && threadUserId) {
    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from("customer_profiles")
      .select("email, phone")
      .eq("id", threadUserId)
      .maybeSingle<{ email: string | null; phone: string | null }>();

    await sendSupportReplyNotification({
      threadId,
      email: profile?.email || null,
      phone: profile?.phone || null,
      subject: threadSubject,
      body,
    });
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
