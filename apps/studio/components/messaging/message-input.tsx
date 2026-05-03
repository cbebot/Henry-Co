"use client";

import { useCallback, useMemo } from "react";
import {
  ChatComposer,
  type AttachmentUploader,
  type ComposerSendPayload,
} from "@henryco/chat-composer";
import {
  ACCEPTED_ATTACHMENT_MIME_TYPES,
  INPUT_PLACEHOLDERS,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/messaging/constants";
import {
  uploadMessageAttachment,
} from "@/lib/messaging/mutations";
import type { ReplyPreview, SendMessageInput } from "@/lib/messaging/types";
import { classifyAttachment } from "@/lib/messaging/utils";
import { ReplyComposerPreview } from "./message-reply-preview";

type Props = {
  projectId: string;
  projectName: string;
  /** True when the composer should hint at replying (last message was team). */
  awaitingReply?: boolean;
  /** True when no messages exist yet — uses the empty placeholder. */
  isEmpty?: boolean;
  reply?: ReplyPreview | null;
  onCancelReply?: () => void;
  onSend: (
    payload: SendMessageInput,
  ) => Promise<{ ok: boolean; error?: string }>;
  onTyping?: () => void;
  /** True when the network is unavailable; UI nudges to "queued". */
  offline?: boolean;
};

/**
 * The studio-tone wrapper around @henryco/chat-composer. Handles:
 *   - dynamic placeholder text per the spec (empty / awaiting-reply / default)
 *   - reply-quote chip above the composer when replying
 *   - server-action attachment upload via uploadMessageAttachment
 *   - mapping ChatComposer's send payload to our sendMessage shape
 *
 * The composer's chrome (autosize, drag/drop, paste, attachment chips,
 * draft persistence, full-screen mobile, send button states, keyboard
 * shortcuts, reduced-motion) is delivered by the shared package.
 */
export function MessageInput({
  projectId,
  projectName,
  awaitingReply,
  isEmpty,
  reply,
  onCancelReply,
  onSend,
  onTyping,
  offline,
}: Props) {
  const placeholder = isEmpty
    ? INPUT_PLACEHOLDERS.empty(projectName)
    : awaitingReply
      ? INPUT_PLACEHOLDERS.awaitingReply
      : INPUT_PLACEHOLDERS.default;

  const uploader: AttachmentUploader = useCallback(
    async (file, onProgress) => {
      // Server actions don't expose granular upload progress. Send a
      // synthetic "midway" tick so the chip shows movement, then the
      // final 100 on resolution.
      onProgress(15);
      const fd = new FormData();
      fd.set("projectId", projectId);
      fd.set("file", file, file.name);
      const result = await uploadMessageAttachment(fd);
      onProgress(100);
      if (!result.ok) {
        throw new Error(result.error || "Upload failed.");
      }
      return {
        url: result.attachment.url,
        publicId: result.attachment.publicId,
        bytes: result.attachment.size,
        format: result.attachment.mimeType,
        resourceType: result.attachment.kind === "image" ? "image" : "raw",
      };
    },
    [projectId],
  );

  const handleSend = useCallback(
    async (payload: ComposerSendPayload) => {
      const attachments = payload.attachments
        .filter((a) => a.status === "uploaded" && a.remote?.url)
        .map((a) => ({
          label: a.name,
          url: a.remote!.url,
          publicId: a.remote?.publicId,
          mimeType: a.mimeType,
          size: a.size,
          kind: classifyAttachment(a.mimeType, a.name),
        }));

      const result = await onSend({
        projectId,
        body: payload.text,
        attachments: attachments.length > 0 ? attachments : undefined,
        replyToId: reply?.id ?? null,
      });

      if (!result.ok) {
        throw new Error(result.error || "Could not send message.");
      }
      onCancelReply?.();
    },
    [onSend, projectId, reply?.id, onCancelReply],
  );

  const labels = useMemo(
    () => ({
      placeholder,
      sendLabel: "Send",
      sendingLabel: "Sending…",
      attachLabel: "Attach",
      removeAttachmentLabel: "Remove attachment",
      retryUploadLabel: "Retry upload",
      draftSavedLabel: "Draft saved",
      discardDraftLabel: "Discard draft",
      failedSendLabel: "Some attachments failed — retry or remove them first.",
    }),
    [placeholder],
  );

  return (
    <div className="flex flex-col gap-2 border-t border-white/[0.06] bg-[#0A0E1A] px-3 pb-3 pt-2 sm:px-4">
      {reply ? (
        <ReplyComposerPreview
          preview={reply}
          onCancel={() => onCancelReply?.()}
        />
      ) : null}
      {offline ? (
        <div
          className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[11px] font-medium text-amber-200"
          role="status"
        >
          You're offline — your next message will be queued and sent
          automatically once the connection returns.
        </div>
      ) : null}
      <div className="studio-msg-composer">
        <ChatComposer
          threadId={`studio:${projectId}`}
          tone="studio"
          onSend={handleSend}
          onTyping={onTyping}
          uploadAttachment={uploader}
          enableAttachments
          enableDraft
          enableFullScreenOnMobile
          maxAttachments={MAX_ATTACHMENTS_PER_MESSAGE}
          maxFileBytes={MAX_ATTACHMENT_BYTES}
          acceptedMimeTypes={[...ACCEPTED_ATTACHMENT_MIME_TYPES]}
          ariaLabel="Message the Studio team"
          labels={labels}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
