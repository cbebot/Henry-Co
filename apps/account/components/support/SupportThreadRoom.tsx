"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Headphones, User } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import SupportReplyForm from "@/components/support/SupportReplyForm";

type SupportMessage = Record<string, string | Array<Record<string, unknown>>>;

function SenderIcon({ senderType }: { senderType: string }) {
  if (senderType === "agent") return <Headphones size={15} />;
  if (senderType === "system") return <Bot size={15} />;
  return <User size={15} />;
}

function messageTone(senderType: string) {
  if (senderType === "customer") {
    return {
      bubble: "bg-[var(--acct-gold)] text-white",
      meta: "text-white/65",
      badge: "bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]",
    };
  }

  if (senderType === "system") {
    return {
      bubble: "border border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-ink)]",
      meta: "text-[var(--acct-muted)]",
      badge: "bg-[var(--acct-purple-soft)] text-[var(--acct-purple)]",
    };
  }

  return {
    bubble: "bg-[var(--acct-surface)] text-[var(--acct-ink)]",
    meta: "text-[var(--acct-muted)]",
    badge: "bg-[var(--acct-blue-soft)] text-[var(--acct-blue)]",
  };
}

export default function SupportThreadRoom({
  threadId,
  messages,
  threadStatus,
}: {
  threadId: string;
  messages: SupportMessage[];
  threadStatus: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [roomHeight, setRoomHeight] = useState<number | null>(null);

  const scrollToLatest = (behavior: ScrollBehavior) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    });
  };

  useEffect(() => {
    scrollToLatest("smooth");
  }, [messages.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const syncViewport = () => {
      setRoomHeight(Math.max(Math.round(viewport.height), 420));
      window.requestAnimationFrame(() => scrollToLatest("auto"));
    };

    syncViewport();
    viewport.addEventListener("resize", syncViewport);
    viewport.addEventListener("scroll", syncViewport);

    return () => {
      viewport.removeEventListener("resize", syncViewport);
      viewport.removeEventListener("scroll", syncViewport);
    };
  }, []);

  return (
    <div
      className="flex min-h-[calc(100dvh-9.5rem)] flex-col overflow-hidden rounded-[2rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] shadow-[0_14px_50px_rgba(15,23,42,0.08)]"
      style={
        roomHeight
          ? {
              minHeight: `${Math.max(roomHeight - 152, 420)}px`,
            }
          : undefined
      }
    >
      <div className="border-b border-[var(--acct-line)] bg-[linear-gradient(135deg,rgba(201,162,39,0.14),rgba(255,255,255,0.9))] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--acct-blue-soft)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-blue)]">
            Support room
          </span>
          <span className="rounded-full bg-[var(--acct-surface)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            {threadStatus.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--acct-muted)]">
          This room keeps your support conversation attached to the correct account, service context, and attachment history across devices.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="acct-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        style={{ scrollPaddingBottom: "8rem" }}
      >
        <div className="space-y-4">
          {messages.map((msg) => {
            const senderType = String(msg.sender_type || "customer");
            const isCustomer = senderType === "customer";
            const tone = messageTone(senderType);
            const attachments = Array.isArray(msg.attachments)
              ? (msg.attachments as Array<Record<string, unknown>>)
              : [];

            return (
              <div key={String(msg.id)} className={`flex gap-3 ${isCustomer ? "justify-end" : "justify-start"}`}>
                {!isCustomer ? (
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${tone.badge}`}>
                    <SenderIcon senderType={senderType} />
                  </div>
                ) : null}
                <div className={`max-w-[min(100%,42rem)] ${isCustomer ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-[1.5rem] px-4 py-3 ${tone.bubble}`}>
                    <p className="text-sm leading-7">{String(msg.body || "")}</p>
                    {attachments.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attachments.map((attachment, index) => (
                          <a
                            key={`${msg.id}-${index}`}
                            href={typeof attachment.url === "string" ? attachment.url : "#"}
                            target="_blank"
                            rel="noreferrer"
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              isCustomer
                                ? "bg-white/12 text-white"
                                : "bg-[var(--acct-bg)] text-[var(--acct-ink)]"
                            }`}
                          >
                            {String(attachment.name || `Attachment ${index + 1}`)}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className={`mt-2 px-1 text-[0.7rem] font-medium ${tone.meta}`}>
                    {formatDateTime(String(msg.created_at || ""))}
                  </p>
                </div>
                {isCustomer ? (
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${tone.badge}`}>
                    <SenderIcon senderType={senderType} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {threadStatus !== "closed" ? (
        <div className="border-t border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] sm:px-4">
          <SupportReplyForm threadId={threadId} />
        </div>
      ) : null}
    </div>
  );
}
