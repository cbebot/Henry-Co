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

  let senderId = user?.id || "studio-support";
  let senderType = "staff";
  let threadUserId: string | null = null;
  let threadSubject = "Studio support";

  if (!user) {
    const admin = createAdminSupabase();
    const { data: thread } = await admin
      .from("support_threads")
      .select("user_id, subject")
      .eq("id", threadId)
      .maybeSingle<{ user_id: string | null; subject: string | null }>();

    threadUserId = thread?.user_id || null;
    threadSubject = thread?.subject || threadSubject;
    senderId = threadUserId || senderId;
    senderType = "system";
  } else {
    const admin = createAdminSupabase();
    const { data: thread } = await admin
      .from("support_threads")
      .select("user_id, subject")
      .eq("id", threadId)
      .maybeSingle<{ user_id: string | null; subject: string | null }>();
    threadUserId = thread?.user_id || null;
    threadSubject = thread?.subject || threadSubject;
  }

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
