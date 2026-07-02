"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { buildChatThreadLabels, translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  ChatThread,
  type ChatSendPayload,
  type ChatSendResult,
  type ChatThreadMessage,
} from "@henryco/chat-thread";
import type { AttachmentUploader } from "@henryco/chat-composer/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const HARNESS_CSS = `
.dev-chat-stage {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  background: var(--hc-bg, #0a0a0b);
  color: var(--hc-ink, #f5f1e8);
  --ct-bg: var(--hc-bg, #0a0a0b);
  --ct-ink: var(--hc-ink, #f5f1e8);
  --ct-line: var(--hc-line, rgba(245, 241, 232, 0.14));
  --ct-accent: var(--hc-accent, #c9a227);
  --ct-accent-contrast: #0a0a0a;
}
body:has(.dev-chat-stage) { overflow: hidden; }
.dev-chat-stage .ct-viewport { flex: 1 1 auto; }
.dev-chat-stage__ctl {
  border: 1px solid var(--ct-line);
  background: transparent;
  color: inherit;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.55rem;
  cursor: pointer;
  white-space: nowrap;
}
`;

function seedMessages(now: number): ChatThreadMessage[] {
  const at = (offsetMs: number) => new Date(now - offsetMs).toISOString();
  return [
    {
      id: "seed-1",
      authorId: "agent-1",
      authorName: "Support",
      authorRole: "other",
      body: "Welcome — this is an older message from two days ago.",
      createdAt: at(2 * 86_400_000),
    },
    {
      id: "seed-2",
      authorId: "me",
      authorRole: "viewer",
      body: "And this one is mine, from yesterday.",
      createdAt: at(86_400_000),
      deliveryState: "read",
    },
    {
      id: "seed-3",
      authorId: "agent-1",
      authorName: "Support",
      authorRole: "other",
      body: "Here is a reply from earlier today with a long unbroken string: Supercalifragilisticexpialidocious-Donaudampfschifffahrtsgesellschaftskapitän-0123456789",
      createdAt: at(3_600_000),
    },
  ];
}

export default function HarnessClient() {
  const locale = useHenryCoLocale();
  const t = useCallback(
    (text: string) => translateSurfaceLabel(locale, text),
    [locale],
  );
  const labels = useMemo(() => buildChatThreadLabels(t), [t]);

  const counter = useRef(0);
  const failedOnce = useRef(new Set<string>());
  const [messages, setMessages] = useState<ChatThreadMessage[]>(() =>
    seedMessages(Date.now()),
  );

  const pushIncoming = useCallback(
    (body: string, attachments?: ChatThreadMessage["attachments"]) => {
      counter.current += 1;
      const id = `srv-in-${counter.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          authorId: "agent-1",
          authorName: "Support",
          authorRole: "other",
          body,
          createdAt: new Date().toISOString(),
          attachments,
        },
      ]);
    },
    [],
  );

  const sendMessage = useCallback(
    async ({ body, attachments }: ChatSendPayload): Promise<ChatSendResult> => {
      await sleep(/slow/i.test(body) ? 3000 : 500);
      if (/fail/i.test(body) && !failedOnce.current.has(body)) {
        // Deterministic first-attempt failure so the inline retry path is
        // exercisable: the retry of the same body succeeds.
        failedOnce.current.add(body);
        return { ok: false, reason: t("Simulated failure") };
      }
      counter.current += 1;
      const confirmed: ChatThreadMessage = {
        id: `srv-out-${counter.current}`,
        authorId: "me",
        authorRole: "viewer",
        body,
        createdAt: new Date().toISOString(),
        attachments,
        deliveryState: "sent",
      };
      setMessages((prev) => [...prev, confirmed]);
      return { ok: true, message: confirmed };
    },
    [t],
  );

  const uploader = useMemo<AttachmentUploader>(
    () => async (file, onProgress) => {
      onProgress(30);
      await sleep(600);
      onProgress(100);
      return { url: URL.createObjectURL(file), width: 800, height: 600 };
    },
    [],
  );

  return (
    <div className="dev-chat-stage">
      <style dangerouslySetInnerHTML={{ __html: HARNESS_CSS }} />
      <ChatThread
        variant="support"
        threadId="dev-chat-harness"
        viewer={{ id: "me", name: "Dev Viewer" }}
        messages={messages}
        onSendMessage={sendMessage}
        header={{
          title: t("Harness thread with a deliberately long subject to prove truncation"),
          status: t("Open · Harness"),
          live: "live",
          onBack: () => window.history.back(),
          actions: (
            <>
              <button
                type="button"
                className="dev-chat-stage__ctl"
                onClick={() => {
                  counter.current += 1;
                  pushIncoming(`${t("Incoming message")} #${counter.current}`);
                }}
              >
                +1
              </button>
              <button
                type="button"
                className="dev-chat-stage__ctl"
                onClick={() => {
                  counter.current += 1;
                  pushIncoming(t("Here is an image for you"), [
                    {
                      url: `https://picsum.photos/seed/hc${counter.current}/800/600`,
                      name: "photo.jpg",
                      type: "image/jpeg",
                      width: 800,
                      height: 600,
                    },
                  ]);
                }}
              >
                {t("Img")}
              </button>
              <button
                type="button"
                className="dev-chat-stage__ctl"
                onClick={() => {
                  let sent = 0;
                  const timer = setInterval(() => {
                    sent += 1;
                    pushIncoming(`${t("Burst")} ${sent}/10`);
                    if (sent >= 10) clearInterval(timer);
                  }, 120);
                }}
              >
                ×10
              </button>
              <button
                type="button"
                className="dev-chat-stage__ctl"
                onClick={() =>
                  document.documentElement.classList.toggle("dark")
                }
                aria-label={t("Toggle theme")}
              >
                ◐
              </button>
            </>
          ),
        }}
        labels={labels}
        locale={locale}
        fillViewport
        composer={{
          placeholder: t("Type here — include 'fail' to simulate a failure"),
          tone: "account",
          enableAttachments: true,
          uploader,
          enterKeyBehavior: "send",
        }}
      />
    </div>
  );
}
