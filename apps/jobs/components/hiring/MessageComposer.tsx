"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ChatComposer } from "@henryco/chat-composer";
import type { ComposerSendPayload } from "@henryco/chat-composer";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getJobsCandidateSurfaceCopy } from "@henryco/i18n";

type ContactTypeKey =
  | "emailAddress"
  | "phoneNumber"
  | "socialHandle"
  | "messagingApp"
  | "socialLink";

const CONTACT_PATTERNS: Array<{ regex: RegExp; key: ContactTypeKey }> = [
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, key: "emailAddress" },
  {
    regex: /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
    key: "phoneNumber",
  },
  { regex: /@[a-zA-Z0-9_]{2,30}/g, key: "socialHandle" },
  {
    regex: /(?:whatsapp|telegram|signal|viber)\s*[:\-]?\s*[\w.+@]/i,
    key: "messagingApp",
  },
  {
    regex: /(?:instagram|facebook|twitter|linkedin)\.com\/[\w.-]+/i,
    key: "socialLink",
  },
];

function checkOffPlatform(text: string) {
  const found: ContactTypeKey[] = [];
  for (const { regex, key } of CONTACT_PATTERNS) {
    regex.lastIndex = 0;
    if (regex.test(text) && !found.includes(key)) found.push(key);
  }
  return found;
}

export function MessageComposer({
  conversationId,
  senderId,
  senderType,
}: {
  conversationId: string;
  senderId: string;
  senderType: string;
}) {
  const router = useRouter();
  const locale = useHenryCoLocale();
  const copy = getJobsCandidateSurfaceCopy(locale).messageComposer;
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTyping = useCallback(() => {
    /* hook for future typing indicator broadcast */
  }, []);

  const handleSend = useCallback(
    async ({ text }: ComposerSendPayload) => {
      setError(null);
      const detected = checkOffPlatform(text);
      if (detected.length > 0) {
        const detectedLabels = detected
          .map((key) => copy.contactTypes[key])
          .join(", ");
        setWarning(copy.offPlatformWarning.replace("{items}", detectedLabels));
        throw new Error(copy.offPlatformError);
      }
      setWarning(null);

      const res = await fetch("/api/hiring/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          senderId,
          senderType,
          body: text,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || copy.sendFailedError);
      }
      router.refresh();
    },
    [conversationId, senderId, senderType, router, copy]
  );

  const labels = useMemo(
    () => ({
      sendLabel: copy.sendLabel,
      sendingLabel: copy.sendingLabel,
      attachLabel: copy.attachLabel,
      draftSavedLabel: copy.draftSavedLabel,
      discardDraftLabel: copy.discardDraftLabel,
      expandLabel: copy.expandLabel,
      collapseLabel: copy.collapseLabel,
      fullScreenTitleLabel: copy.fullScreenTitleLabel,
      removeAttachmentLabel: copy.removeAttachmentLabel,
      retryUploadLabel: copy.retryUploadLabel,
    }),
    [copy]
  );

  return (
    <div className="space-y-2">
      {warning && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{warning}</span>
        </div>
      )}

      <ChatComposer
        threadId={conversationId}
        tone="jobs"
        ariaLabel={copy.ariaLabel}
        placeholder={copy.placeholder}
        enableAttachments={false}
        edgeToEdgeMobile
        labels={labels}
        onSend={handleSend}
        onTyping={handleTyping}
        onSendError={(err) => setError(err.message)}
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
