import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupportThread } from "@/lib/studio/shared-account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") || "/client");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const category = String(formData.get("category") || "general").trim();
  const priority = String(formData.get("priority") || "normal").trim();
  const referenceType = String(formData.get("referenceType") || "").trim() || null;
  const referenceId = String(formData.get("referenceId") || "").trim() || null;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !subject || !body) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  await createSupportThread({
    userId: user.id,
    subject,
    category,
    priority,
    referenceType,
    referenceId,
    initialMessage: body,
    senderId: user.id,
    senderType: "customer",
  });

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
