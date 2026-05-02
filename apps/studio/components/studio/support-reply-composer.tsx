"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatComposer } from "@henryco/chat-composer";
import type { ComposerSendPayload } from "@henryco/chat-composer";

type Props = {
  threadId: string;
  redirectTo: string;
};

export function StudioSupportReplyComposer({ threadId, redirectTo }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(
    async ({ text }: ComposerSendPayload) => {
      setError(null);
      const formData = new FormData();
      formData.set("threadId", threadId);
      formData.set("body", text);
      formData.set("redirectTo", redirectTo);
      const res = await fetch("/api/support/reply", {
        method: "POST",
        body: formData,
        redirect: "manual",
      });
      // The endpoint redirects on success (opaqueredirect for manual mode).
      // Anything other than a redirect or 2xx is an error.
      const ok =
        res.type === "opaqueredirect" ||
        (res.status >= 200 && res.status < 400);
      if (!ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Unable to send reply.");
      }
      router.refresh();
    },
    [threadId, redirectTo, router]
  );

  return (
    <div className="space-y-3">
      <ChatComposer
        threadId={`studio-support:${threadId}`}
        tone="neutral"
        ariaLabel="Studio support reply"
        placeholder="Reply with the next action, clarification, or resolution."
        enableAttachments={false}
        labels={{
          sendLabel: "Send reply",
          sendingLabel: "Sending reply…",
          draftSavedLabel: "Draft saved",
          discardDraftLabel: "Discard",
          expandLabel: "Open full-screen reply",
          collapseLabel: "Collapse reply",
          fullScreenTitleLabel: "Reply",
        }}
        onSend={handleSend}
        onSendError={(err: Error) => setError(err.message)}
      />
      {error ? (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
