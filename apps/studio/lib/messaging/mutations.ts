"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { createSupabaseServer } from "@/lib/supabase/server";
import { resolveViewerContext } from "./queries";
import { isReactionEmoji } from "./constants";
import { classifyAttachment } from "./utils";
import type {
  EditMessageInput,
  MarkReadInput,
  MessageAttachment,
  SendMessageInput,
  SendMessageResult,
  SetTypingInput,
  SoftDeleteMessageInput,
  ToggleReactionInput,
} from "./types";

function clipBody(value: string): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, 8000);
}

function sanitiseFilenameSegment(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 32);
}

/**
 * Send a message into a project thread. The server enforces RLS via
 * the auth-aware Supabase client, so a client cannot post into a
 * project they don't belong to even if they craft the request manually.
 */
export async function sendMessage(
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);

  if (!viewer.userId) {
    return { ok: false, error: "Sign in to send a message." };
  }

  const projectId = String(input.projectId || "").trim();
  if (!projectId) {
    return { ok: false, error: "Missing project." };
  }

  const body = clipBody(input.body || "");
  const attachments = Array.isArray(input.attachments) ? input.attachments : [];
  if (!body && attachments.length === 0) {
    return { ok: false, error: "Write a message or attach a file." };
  }

  const messageType =
    input.messageType ||
    (body.length === 0 && attachments.length > 0 ? "file" : "text");

  const senderName = viewer.displayName || "You";
  const senderRole = viewer.role;

  const attachmentJson: MessageAttachment[] = attachments.map((a) => ({
    id: a.publicId || a.url,
    label: a.label,
    url: a.url,
    publicId: a.publicId,
    mimeType: a.mimeType,
    size: a.size,
    kind: a.kind,
  }));

  const insertResult = await supabase
    .from("studio_project_messages")
    .insert({
      project_id: projectId,
      sender: senderName,
      sender_id: viewer.userId,
      sender_role: senderRole,
      body,
      is_internal: false,
      message_type: messageType,
      metadata: input.metadata || {},
      attachments: attachmentJson,
      reply_to_id: input.replyToId || null,
    })
    .select("id")
    .single();

  if (insertResult.error || !insertResult.data) {
    return {
      ok: false,
      error: insertResult.error?.message || "Could not send message.",
    };
  }

  // Mark our own message as read by us so unread counts elsewhere
  // remain accurate (sending implies reading).
  await supabase
    .from("studio_message_read_receipts")
    .upsert(
      {
        message_id: insertResult.data.id,
        user_id: viewer.userId,
      },
      { onConflict: "message_id,user_id" },
    );

  // Clear typing indicator for this user on send.
  await supabase
    .from("studio_typing_indicators")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", viewer.userId);

  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath(`/client/projects/${projectId}/messages`);
  revalidatePath("/client/messages");

  return { ok: true, messageId: insertResult.data.id };
}

/**
 * Toggle a reaction on a message. Idempotent — calling with the same
 * emoji twice removes the reaction. Server enforces the curated set
 * via DB CHECK constraint and via this guard.
 */
export async function toggleReaction(
  input: ToggleReactionInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isReactionEmoji(input.emoji)) {
    return { ok: false, error: "Unsupported reaction." };
  }

  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) {
    return { ok: false, error: "Sign in to react." };
  }

  const existingResult = await supabase
    .from("studio_message_reactions")
    .select("id")
    .eq("message_id", input.messageId)
    .eq("user_id", viewer.userId)
    .eq("emoji", input.emoji)
    .maybeSingle();

  if (existingResult.data?.id) {
    const deleteResult = await supabase
      .from("studio_message_reactions")
      .delete()
      .eq("id", existingResult.data.id);
    if (deleteResult.error) {
      return { ok: false, error: deleteResult.error.message };
    }
    return { ok: true };
  }

  const insertResult = await supabase
    .from("studio_message_reactions")
    .insert({
      message_id: input.messageId,
      user_id: viewer.userId,
      emoji: input.emoji,
    });
  if (insertResult.error) {
    return { ok: false, error: insertResult.error.message };
  }
  return { ok: true };
}

/**
 * Mark a batch of messages as read by the current viewer. Used by
 * the message-list as the user scrolls a message into view, and on
 * thread mount for any messages already in view.
 */
export async function markMessagesRead(
  input: MarkReadInput,
): Promise<{ ok: boolean; error?: string }> {
  const ids = Array.from(
    new Set(
      (Array.isArray(input.messageIds) ? input.messageIds : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  );
  if (ids.length === 0) return { ok: true };

  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) return { ok: true };

  const rows = ids.map((message_id) => ({
    message_id,
    user_id: viewer.userId!,
  }));

  const result = await supabase
    .from("studio_message_read_receipts")
    .upsert(rows, { onConflict: "message_id,user_id" });

  // Mirror to the legacy read_by jsonb on studio_project_messages so
  // the existing portal data layer (which reads read_by) stays in
  // sync until we deprecate the column.
  await supabase.rpc("studio_messages_read_by_append", {
    message_ids: ids,
    appended_user_id: viewer.userId,
  }).then(
    () => undefined,
    () => undefined, // RPC may not exist yet — non-fatal.
  );

  if (result.error) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

/**
 * Edit a message body. Permitted only by the original sender (RLS
 * enforces this — clients can only update their own non-internal
 * messages). Sets edited_at to now via trigger? No — we set it here
 * explicitly so the SQL stays simple.
 */
export async function editMessage(
  input: EditMessageInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) {
    return { ok: false, error: "Sign in to edit messages." };
  }

  const body = clipBody(input.body || "");
  if (!body) {
    return { ok: false, error: "Message cannot be empty." };
  }

  const result = await supabase
    .from("studio_project_messages")
    .update({
      body,
      edited_at: new Date().toISOString(),
    })
    .eq("id", input.messageId)
    .eq("sender_id", viewer.userId);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

/**
 * Soft-delete a message. The row stays in the table; deleted_at is
 * stamped. UI renders deleted messages as "This message was removed."
 */
export async function softDeleteMessage(
  input: SoftDeleteMessageInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) {
    return { ok: false, error: "Sign in to delete messages." };
  }

  const result = await supabase
    .from("studio_project_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.messageId)
    .eq("sender_id", viewer.userId);

  if (result.error) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true };
}

/**
 * Begin or refresh a typing indicator for the current viewer on a
 * project. Pass isTyping=false to immediately clear it (e.g. on send,
 * blur, or unmount). A cron-less TTL is enforced by clients calling
 * the studio_prune_stale_typing helper on subscribe.
 */
export async function setTyping(
  input: SetTypingInput,
): Promise<{ ok: boolean }> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) return { ok: true };

  if (!input.isTyping) {
    await supabase
      .from("studio_typing_indicators")
      .delete()
      .eq("project_id", input.projectId)
      .eq("user_id", viewer.userId);
    return { ok: true };
  }

  await supabase
    .from("studio_typing_indicators")
    .upsert(
      {
        project_id: input.projectId,
        user_id: viewer.userId,
        started_at: new Date().toISOString(),
      },
      { onConflict: "project_id,user_id" },
    );
  return { ok: true };
}

export type AttachmentUploadResult =
  | {
      ok: true;
      attachment: {
        url: string;
        publicId: string;
        label: string;
        mimeType: string;
        size: number;
        kind: MessageAttachment["kind"];
      };
    }
  | { ok: false; error: string };

/**
 * Upload a single attachment to Cloudinary and return a record the
 * messaging UI can attach to the eventual message row. Called by the
 * chat-composer's AttachmentUploader on the client.
 *
 * Uses the same env vars as the existing studio file uploader so a
 * single Cloudinary account / preset can serve every studio surface.
 */
export async function uploadMessageAttachment(
  formData: FormData,
): Promise<AttachmentUploadResult> {
  const supabase = await createSupabaseServer();
  const viewer = await resolveViewerContext(supabase);
  if (!viewer.userId) {
    return { ok: false, error: "Sign in to attach files." };
  }

  const projectId = String(formData.get("projectId") || "").trim();
  if (!projectId) {
    return { ok: false, error: "Missing project." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return { ok: false, error: "No file provided." };
  }

  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = String(
    process.env.CLOUDINARY_FOLDER || "henryco/studio",
  ).trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return { ok: false, error: "File uploads are not configured." };
  }

  const filenameSlug = sanitiseFilenameSegment(file.name).slice(0, 32);
  const folder = [baseFolder, "messages", sanitiseFilenameSegment(projectId)]
    .filter(Boolean)
    .join("/");
  const publicId = `studio-msg-${Date.now()}-${filenameSlug || "file"}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1")
    .update(signaturePayload)
    .digest("hex");

  const isImage = String(file.type || "").toLowerCase().startsWith("image/");
  const resourcePath = isImage ? "image/upload" : "raw/upload";

  const cloudForm = new FormData();
  cloudForm.set("file", file, file.name);
  cloudForm.set("api_key", apiKey);
  cloudForm.set("timestamp", String(timestamp));
  cloudForm.set("signature", signature);
  cloudForm.set("folder", folder);
  cloudForm.set("public_id", publicId);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourcePath}`,
      { method: "POST", body: cloudForm },
    );
    const payload = (await response.json().catch(() => null)) as
      | {
          secure_url?: string;
          public_id?: string;
          error?: { message?: string };
        }
      | null;

    if (!response.ok || !payload?.secure_url || !payload?.public_id) {
      return {
        ok: false,
        error:
          payload?.error?.message || "Upload failed. Try again in a moment.",
      };
    }

    return {
      ok: true,
      attachment: {
        url: payload.secure_url,
        publicId: payload.public_id,
        label: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        kind: classifyAttachment(file.type, file.name),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Upload failed. Check your connection.",
    };
  }
}
