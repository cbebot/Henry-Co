import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { sendSupportReplyNotification } from "@/lib/studio/email/send";
import { appendSupportMessage } from "@/lib/studio/shared-account";

export const runtime = "nodejs";

type PreUploadedAttachment = {
  url: string;
  name: string;
  type: string;
  size: number | null;
};

/**
 * PASS 24 — dual-mode support reply.
 *
 * Multipart form data (legacy + studio /support form): redirects to the
 * configured `redirectTo` URL on success so progressive-enhancement
 * submits work without JS.
 *
 * JSON (MessageThread engine path): returns `{ message_id }` so the
 * engine can replace its optimistic bubble in place. The engine pre-
 * uploads attachments via /api/support/upload and passes their URLs
 * here as `attachments: [{ url, name, type, size }]`.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const isJson =
    contentType.includes("application/json") && !contentType.includes("multipart/");

  let threadId = "";
  let body = "";
  let redirectTo = "/support";
  let preUploadedAttachments: PreUploadedAttachment[] = [];

  if (isJson) {
    const payload = (await request.json().catch(() => ({}))) as {
      threadId?: unknown;
      thread_id?: unknown;
      body?: unknown;
      attachments?: unknown;
    };
    threadId = String(payload.threadId || payload.thread_id || "").trim();
    body = String(payload.body || "").trim();
    if (Array.isArray(payload.attachments)) {
      preUploadedAttachments = payload.attachments
        .filter(
          (a): a is Record<string, unknown> =>
            typeof a === "object" &&
            a !== null &&
            typeof (a as { url?: unknown }).url === "string",
        )
        .map((a) => ({
          url: String(a.url),
          name: String(a.name || "attachment"),
          type: String(a.type || "application/octet-stream"),
          size: typeof a.size === "number" ? a.size : null,
        }))
        .slice(0, 4);
    }
  } else {
    const formData = await request.formData();
    redirectTo = String(formData.get("redirectTo") || "/support");
    threadId = String(formData.get("threadId") || "").trim();
    body = String(formData.get("body") || "").trim();
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isJson) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!threadId || (!body && preUploadedAttachments.length === 0)) {
    if (isJson) {
      return NextResponse.json(
        { ok: false, error: "Thread ID and body required" },
        { status: 400 },
      );
    }
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  const admin = createAdminSupabase();
  const { data: thread } = await admin
    .from("support_threads")
    .select("id, user_id, subject")
    .eq("id", threadId)
    .maybeSingle<{ id: string; user_id: string | null; subject: string | null }>();

  if (!thread) {
    if (isJson) {
      return NextResponse.json(
        { ok: false, error: "Thread not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Thread not found" },
      { status: 404 },
    );
  }

  const { data: memberships } = await admin
    .from("studio_role_memberships")
    .select("role")
    .eq("is_active", true)
    .eq("user_id", user.id);
  const staffRoles = new Set(
    (memberships ?? []).map((row) => String((row as { role?: string }).role || "")),
  );
  const hasSupportRole =
    staffRoles.has("studio_owner") || staffRoles.has("client_success");

  const isThreadOwner = thread.user_id === user.id;
  if (!isThreadOwner && !hasSupportRole) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const senderType = isThreadOwner ? "customer" : "staff";
  const threadUserId: string | null = thread.user_id || null;
  const threadSubject = thread.subject || "Studio support";

  const attachmentRecords = preUploadedAttachments.map((attachment) => ({
    name: attachment.name,
    url: attachment.url,
    mime_type: attachment.type,
    size: attachment.size,
  }));

  // The append helper inserts into support_messages and stamps the
  // thread's updated_at + status. Returns the resulting message_id so the
  // engine can replace its optimistic bubble in place.
  const inserted = await appendSupportMessage({
    threadId,
    senderId: user.id,
    senderType,
    body,
    attachments: attachmentRecords,
  });

  if (senderType !== "customer" && threadUserId) {
    const { data: profile } = await admin
      .from("customer_profiles")
      .select("email, phone")
      .eq("id", threadUserId)
      .maybeSingle<{ email: string | null; phone: string | null }>();

    try {
      await sendSupportReplyNotification({
        threadId,
        email: profile?.email || null,
        phone: profile?.phone || null,
        subject: threadSubject,
        body,
      });
    } catch {
      // Best-effort notification — never blocks the reply.
    }
  }

  if (isJson) {
    return NextResponse.json({
      ok: true,
      message_id: inserted?.messageId ?? null,
    });
  }
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
