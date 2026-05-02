"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatSurfaceTemplate,
  translateSurfaceLabel,
  useHenryCoLocale,
} from "@henryco/i18n";
import { ChatComposer } from "@henryco/chat-composer";
import type { ComposerSendPayload } from "@henryco/chat-composer";

const ACCOUNT_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
] as const;

const ACCOUNT_MAX_ATTACHMENTS = 4;
const ACCOUNT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function SupportReplyForm({ threadId }: { threadId: string }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const localizeSupportReplyError = useCallback(
    (messageText: string) => {
      switch (messageText) {
        case "Unauthorized":
          return t("Please sign in to continue.");
        case "Thread ID and body required":
          return t("Thread and reply body are required.");
        case "Thread not found":
        case "Thread not found.":
          return t("Thread not found.");
        case "Upload JPG, PNG, WebP, PDF, or TXT attachments only.":
          return t("Upload JPG, PNG, WebP, PDF, or TXT attachments only.");
        case "Failed to add support reply":
        case "Failed to update support thread":
        case "Internal error":
        case "Unable to send your reply.":
          return t("Unable to send your reply.");
        default:
          return t(messageText);
      }
    },
    [t]
  );

  const handleSend = useCallback(
    async ({ text, attachments }: ComposerSendPayload) => {
      setFeedback(null);
      const formData = new FormData();
      formData.set("thread_id", threadId);
      formData.set("body", text);
      for (const attachment of attachments) {
        formData.append("attachments", attachment.file);
      }

      const response = await fetch("/api/support/reply", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          localizeSupportReplyError(data.error || "Unable to send your reply.")
        );
      }
      setFeedback({ type: "success", text: t("Reply sent.") });
      router.refresh();
    },
    [threadId, localizeSupportReplyError, router, t]
  );

  return (
    <div className="space-y-3" data-live-refresh-pause="true">
      {feedback ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <ChatComposer
        threadId={threadId}
        tone="account"
        ariaLabel={t("Support reply composer")}
        placeholder={t(
          "Reply with context, screenshots, or next steps. Drafts stay here while you type."
        )}
        maxAttachments={ACCOUNT_MAX_ATTACHMENTS}
        maxFileBytes={ACCOUNT_MAX_FILE_BYTES}
        acceptedMimeTypes={ACCOUNT_ACCEPTED_MIME_TYPES}
        labels={{
          sendLabel: t("Send reply"),
          sendingLabel: t("Sending reply..."),
          attachLabel: t("Attach"),
          draftSavedLabel: t("Draft saved"),
          discardDraftLabel: t("Discard"),
          expandLabel: t("Open full-screen reply"),
          collapseLabel: t("Collapse reply"),
          fullScreenTitleLabel: t("Reply"),
          removeAttachmentLabel: formatSurfaceTemplate(t("Remove {name}"), {
            name: t("file"),
          }),
          retryUploadLabel: t("Retry upload"),
          failedSendLabel: t(
            "One or more attachments failed to upload — retry or remove them first."
          ),
        }}
        onSend={handleSend}
        onSendError={(error) =>
          setFeedback({
            type: "error",
            text: localizeSupportReplyError(error.message),
          })
        }
      />
    </div>
  );
}
