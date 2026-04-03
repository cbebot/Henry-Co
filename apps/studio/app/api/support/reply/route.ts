import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
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

  if (!user) {
    const admin = createAdminSupabase();
    const { data: thread } = await admin
      .from("support_threads")
      .select("user_id")
      .eq("id", threadId)
      .maybeSingle<{ user_id: string | null }>();

    senderId = thread?.user_id || senderId;
    senderType = "system";
  }

  await appendSupportMessage({
    threadId,
    senderId,
    senderType,
    body,
  });

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
