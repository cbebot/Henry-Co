import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  INTERNAL_COMMS_UNAVAILABLE,
  isInternalCommsStorageError,
  logInternalCommsError,
} from "@/app/lib/internal-comms-errors";
import {
  assertThreadReadable,
  assertThreadWritable,
  loadThreadAccessContext,
  upsertThreadMemberActivity,
} from "@/app/lib/internal-comms-access";
import {
  HQ_IC_STORAGE_BUCKET,
  normalizeUploadKind,
  sanitizeStorageFileName,
  validateUploadDescriptor,
} from "@/app/lib/internal-comms-upload-rules";

export const runtime = "nodejs";

function cleanBody(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 8000 ? text.slice(0, 8000) : text;
}

type AttachmentIn = {
  attachmentId?: string;
  storagePath?: string;
  kind?: string;
  mimeType?: string;
  byteSize?: number;
  durationSeconds?: number | null;
  fileName?: string | null;
};

async function verifyStorageObject(
  admin: ReturnType<typeof createAdminSupabase>,
  path: string,
  expectedBytes: number
) {
  const dir = path.split("/").slice(0, -1).join("/");
  const leaf = path.split("/").pop() || "";
  const { data: listed, error } = await admin.storage.from(HQ_IC_STORAGE_BUCKET).list(dir, {
    limit: 100,
  });
  if (error) return { ok: false as const, message: "Could not verify upload." };
  const hit = (listed || []).find((o) => o.name === leaf);
  if (!hit) return { ok: false as const, message: "Upload was not found in storage. Try uploading again." };
  const size = Number(hit.metadata?.size ?? hit.metadata?.contentLength ?? 0);
  if (size > 0 && expectedBytes > 0 && Math.abs(size - expectedBytes) > 512) {
    return { ok: false as const, message: "Uploaded file size does not match the declared size." };
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "40")));

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const gate = await assertThreadReadable(admin, auth.user.id, threadId);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const { data, error } = await admin
    .from("hq_internal_comm_messages")
    .select(
      `
      id,
      thread_id,
      author_id,
      author_label,
      body,
      parent_id,
      created_at,
      delivery_state,
      client_nonce,
      hq_internal_comm_attachments (
        id,
        kind,
        mime_type,
        byte_size,
        duration_seconds,
        file_name,
        storage_path,
        storage_bucket
      )
    `
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logInternalCommsError("messages/list", error);
    if (isInternalCommsStorageError(error)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE, messages: [] }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not load messages.", messages: [] }, { status: 400 });
  }

  const messages = Array.isArray(data) ? [...data].reverse() : [];

  const { thread } = gate;
  const readError = await upsertThreadMemberActivity(admin, {
    threadId,
    userId: auth.user.id,
    defaultRole: thread.kind === "dm" ? "member" : "owner",
    lastReadAt: new Date().toISOString(),
  });

  if (readError && process.env.NODE_ENV === "development") {
    console.warn("[internal-comms] read receipt upsert:", readError.message);
  }

  const { error: presenceErr } = await admin.from("hq_internal_comm_presence").upsert(
    { user_id: auth.user.id, thread_id: threadId, last_seen_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (presenceErr && process.env.NODE_ENV === "development") {
    console.warn("[internal-comms] presence upsert:", presenceErr.message);
  }

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  let body: {
    threadId?: string;
    body?: string;
    parentId?: string | null;
    clientNonce?: string | null;
    attachments?: AttachmentIn[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const threadId = String(body.threadId || "").trim();
  const text = cleanBody(body.body);
  const parentId = body.parentId ? String(body.parentId).trim() : null;
  const clientNonceRaw = body.clientNonce ? String(body.clientNonce).trim() : "";
  const clientNonce = /^[0-9a-f-]{36}$/i.test(clientNonceRaw) ? clientNonceRaw : null;
  const attachmentsIn = Array.isArray(body.attachments) ? body.attachments : [];

  if (!threadId) {
    return NextResponse.json({ error: "threadId is required." }, { status: 400 });
  }

  if (!text && attachmentsIn.length === 0) {
    return NextResponse.json({ error: "Message text or at least one attachment is required." }, { status: 400 });
  }

  if (attachmentsIn.length > 12) {
    return NextResponse.json({ error: "Too many attachments in one message." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const ctx = await loadThreadAccessContext(admin, auth.user.id);
  const gate = await assertThreadWritable(admin, auth.user.id, threadId, ctx);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const email = auth.user.email?.trim() || "Owner";

  if (clientNonce) {
    const { data: existing } = await admin
      .from("hq_internal_comm_messages")
      .select(
        `
        id,
        thread_id,
        author_id,
        author_label,
        body,
        parent_id,
        created_at,
        delivery_state,
        client_nonce,
        hq_internal_comm_attachments (
          id,
          kind,
          mime_type,
          byte_size,
          duration_seconds,
          file_name,
          storage_path,
          storage_bucket
        )
      `
      )
      .eq("thread_id", threadId)
      .eq("author_id", auth.user.id)
      .eq("client_nonce", clientNonce)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: existing, deduped: true });
    }
  }

  for (const raw of attachmentsIn) {
    const kind = normalizeUploadKind(String(raw.kind || ""));
    if (!kind) {
      return NextResponse.json({ error: "Invalid attachment kind." }, { status: 400 });
    }
    const v = validateUploadDescriptor({
      kind,
      mimeType: String(raw.mimeType || ""),
      byteSize: Number(raw.byteSize || 0),
    });
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: 400 });
    }
    const attachmentId = String(raw.attachmentId || "").trim();
    const path = String(raw.storagePath || "").trim();
    const prefix = `${threadId}/${auth.user.id}/${attachmentId}/`;
    if (!attachmentId || !/^[0-9a-f-]{36}$/i.test(attachmentId) || !path.startsWith(prefix)) {
      return NextResponse.json({ error: "Invalid attachment path." }, { status: 400 });
    }
    const verified = await verifyStorageObject(admin, path, Number(raw.byteSize || 0));
    if (!verified.ok) {
      return NextResponse.json({ error: verified.message }, { status: 400 });
    }
  }

  const insertPayload: Record<string, unknown> = {
    thread_id: threadId,
    author_id: auth.user.id,
    author_label: email,
    body: text || "",
    parent_id: parentId,
    delivery_state: "sent",
  };
  if (clientNonce) insertPayload.client_nonce = clientNonce;

  const { data: inserted, error } = await admin
    .from("hq_internal_comm_messages")
    .insert(insertPayload)
    .select(
      `
      id,
      thread_id,
      author_id,
      author_label,
      body,
      parent_id,
      created_at,
      delivery_state,
      client_nonce,
      hq_internal_comm_attachments (
        id,
        kind,
        mime_type,
        byte_size,
        duration_seconds,
        file_name,
        storage_path,
        storage_bucket
      )
    `
    )
    .maybeSingle();

  if (error) {
    logInternalCommsError("messages/send", error);
    if (isInternalCommsStorageError(error)) {
      return NextResponse.json({ error: INTERNAL_COMMS_UNAVAILABLE }, { status: 503 });
    }
    if (String(error.code || "") === "23505") {
      return NextResponse.json({ error: "Duplicate message submission." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not send message." }, { status: 400 });
  }

  if (!inserted) {
    return NextResponse.json({ error: "Could not send message." }, { status: 400 });
  }

  for (const raw of attachmentsIn) {
    const kind = normalizeUploadKind(String(raw.kind || ""))!;
    const v = validateUploadDescriptor({
      kind,
      mimeType: String(raw.mimeType || ""),
      byteSize: Number(raw.byteSize || 0),
    });
    if (!v.ok) continue;
    const path = String(raw.storagePath || "").trim();
    const { error: attErr } = await admin.from("hq_internal_comm_attachments").insert({
      message_id: inserted.id,
      thread_id: threadId,
      uploader_id: auth.user.id,
      kind,
      storage_bucket: HQ_IC_STORAGE_BUCKET,
      storage_path: path,
      file_name: sanitizeStorageFileName(String(raw.fileName || "file")),
      mime_type: v.mime,
      byte_size: Number(raw.byteSize || 0),
      duration_seconds:
        raw.durationSeconds != null && Number.isFinite(Number(raw.durationSeconds))
          ? Number(raw.durationSeconds)
          : null,
      upload_status: "complete",
    });
    if (attErr) {
      logInternalCommsError("messages/attachment-row", attErr);
      await admin.from("hq_internal_comm_messages").delete().eq("id", inserted.id);
      return NextResponse.json({ error: "Could not finalize attachments." }, { status: 400 });
    }
  }

  let messageRow = inserted;
  if (attachmentsIn.length > 0) {
    const { data: withAtt } = await admin
      .from("hq_internal_comm_messages")
      .select(
        `
        id,
        thread_id,
        author_id,
        author_label,
        body,
        parent_id,
        created_at,
        delivery_state,
        client_nonce,
        hq_internal_comm_attachments (
          id,
          kind,
          mime_type,
          byte_size,
          duration_seconds,
          file_name,
          storage_path,
          storage_bucket
        )
      `
      )
      .eq("id", inserted.id)
      .maybeSingle();
    if (withAtt) messageRow = withAtt;
  }

  await admin
    .from("hq_internal_comm_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  await upsertThreadMemberActivity(admin, {
    threadId,
    userId: auth.user.id,
    defaultRole: gate.thread.kind === "dm" ? "member" : "owner",
    lastReadAt: new Date().toISOString(),
  });

  return NextResponse.json({ message: messageRow });
}
