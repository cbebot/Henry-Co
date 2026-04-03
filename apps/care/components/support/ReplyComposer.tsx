"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Mail,
  MessageSquare,
  Phone,
  Send,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";
import {
  sendSupportReplyAction,
  addSupportInternalNoteAction,
} from "@/app/(staff)/support/actions";
import { formatSupportThreadStatusLabel } from "@/lib/support/shared";

type DeliveryState = "idle" | "sending" | "queued" | "sent" | "delivered" | "failed";

type CallResult = "completed" | "no_answer" | "voicemail" | "busy" | "wrong_number";

const CALL_RESULT_LABELS: Record<CallResult, string> = {
  completed: "Completed",
  no_answer: "No answer",
  voicemail: "Voicemail",
  busy: "Busy",
  wrong_number: "Wrong number",
};

type ReplyComposerProps = {
  threadId: string;
  threadRef: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  backHref: string;
  statuses: readonly string[];
  whatsappConfigured: boolean;
  whatsappReason: string;
};

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

function deliveryColor(state: DeliveryState) {
  switch (state) {
    case "sent":
    case "delivered":
      return "text-emerald-600 dark:text-emerald-400";
    case "failed":
      return "text-red-600 dark:text-red-400";
    case "queued":
    case "sending":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-zinc-500 dark:text-white/50";
  }
}

function deliveryLabel(state: DeliveryState) {
  switch (state) {
    case "idle":
      return "Ready";
    case "sending":
      return "Sending...";
    case "queued":
      return "Queued";
    case "sent":
      return "Sent to provider";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Failed";
  }
}

export default function ReplyComposer({
  threadId,
  threadRef,
  customerName,
  customerEmail,
  customerPhone,
  backHref,
  statuses,
  whatsappConfigured,
  whatsappReason,
}: ReplyComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeMode, setActiveMode] = useState<"message" | "call_log">("message");
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [message, setMessage] = useState("");
  const [nextStatus, setNextStatus] = useState("pending_customer");
  const [showPreview, setShowPreview] = useState(false);

  // Call log state
  const [callOutcome, setCallOutcome] = useState("");
  const [callResult, setCallResult] = useState<CallResult>("completed");

  // Delivery state
  const [emailDelivery, setEmailDelivery] = useState<DeliveryState>("idle");
  const [whatsappDelivery, setWhatsappDelivery] = useState<DeliveryState>("idle");

  const canSendMessage = activeMode === "message" && message.trim().length > 0;
  const canLogCall = activeMode === "call_log" && callOutcome.trim().length > 0;
  const canSubmit = (canSendMessage || canLogCall) && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      if (activeMode === "call_log") {
        const noteText = `[Call Log] Result: ${CALL_RESULT_LABELS[callResult]}\n\n${callOutcome.trim()}`;
        const res = await addSupportInternalNoteAction({
          threadId,
          note: noteText,
        });
        emitCareToast({
          tone: res.tone,
          title: res.message,
        });
        if (res.ok) {
          router.push(backHref);
          router.refresh();
        }
        return;
      }

      // Message mode (email + optional whatsapp)
      setEmailDelivery("sending");
      if (sendWhatsApp) setWhatsappDelivery("sending");

      const res = await sendSupportReplyAction({
        threadId,
        message: message.trim(),
        nextStatus,
        sendWhatsApp,
      });

      if (res.ok) {
        setEmailDelivery("sent");
        if (sendWhatsApp) {
          setWhatsappDelivery(res.tone === "warning" ? "failed" : "sent");
        }
        emitCareToast({ tone: res.tone, title: res.message });
        setTimeout(() => {
          router.push(backHref);
          router.refresh();
        }, 1200);
      } else {
        setEmailDelivery("failed");
        if (sendWhatsApp) setWhatsappDelivery("failed");
        emitCareToast({ tone: "error", title: res.message });
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Channel selector */}
      <div className="care-card rounded-[2rem] p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
          Channel
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Email pill */}
          <button
            type="button"
            onClick={() => setActiveMode("message")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
              activeMode === "message"
                ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </button>

          {/* WhatsApp toggle (only in message mode) */}
          {activeMode === "message" && (
            <button
              type="button"
              onClick={() => {
                if (whatsappConfigured) setSendWhatsApp(!sendWhatsApp);
              }}
              title={whatsappConfigured ? "Toggle WhatsApp delivery" : whatsappReason}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                sendWhatsApp && whatsappConfigured
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
              } ${!whatsappConfigured ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp
              <span
                className={`h-2 w-2 rounded-full ${whatsappConfigured ? "bg-emerald-500" : "bg-zinc-400"}`}
                title={whatsappConfigured ? "Available" : whatsappReason}
              />
              {sendWhatsApp && whatsappConfigured && <Check className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Call Log pill */}
          <button
            type="button"
            onClick={() => setActiveMode("call_log")}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
              activeMode === "call_log"
                ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
            }`}
          >
            <Phone className="h-4 w-4" />
            Call Log
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </button>
        </div>
      </div>

      {/* Recipients */}
      {activeMode === "message" && (
        <div className="care-card rounded-[2rem] p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
            Recipients
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <Mail className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {customerEmail || "No email on file"}
            </div>
            {sendWhatsApp && customerPhone && (
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {customerPhone}
              </div>
            )}
          </div>

          {/* Delivery state feedback */}
          {emailDelivery !== "idle" && (
            <div className="mt-3 flex flex-wrap gap-4">
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${deliveryColor(emailDelivery)}`}>
                <Mail className="h-3 w-3" />
                Email: {deliveryLabel(emailDelivery)}
              </div>
              {sendWhatsApp && whatsappDelivery !== "idle" && (
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${deliveryColor(whatsappDelivery)}`}>
                  <MessageSquare className="h-3 w-3" />
                  WhatsApp: {deliveryLabel(whatsappDelivery)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Message composer or Call log */}
      <div className="care-card rounded-[2rem] p-6">
        {activeMode === "message" ? (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
              Message
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Write your reply to ${customerName}. Be clear, empathetic, and actionable.`}
              rows={6}
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium leading-7 text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            />

            {/* Status after sending */}
            <div className="mt-4">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Status after sending
                </span>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className={inputCls}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {formatSupportThreadStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Preview toggle */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-700 dark:text-white/45 dark:hover:text-white/70"
              >
                <Eye className="h-3.5 w-3.5" />
                {showPreview ? "Hide preview" : "Preview message"}
                {showPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showPreview && message.trim() && (
                <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-white/35">
                    Preview for {customerName}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-zinc-700 dark:text-white/68">
                    Dear {customerName},
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-white/68">
                    {message.trim()}
                  </div>
                  <div className="mt-3 text-xs text-zinc-400 dark:text-white/35">
                    Ref: {threadRef} | Henry &amp; Co. Fabric Care
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
              Call outcome
            </div>

            <div className="mt-3">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Call result
                </span>
                <select
                  value={callResult}
                  onChange={(e) => setCallResult(e.target.value as CallResult)}
                  className={inputCls}
                >
                  {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map((key) => (
                    <option key={key} value={key}>
                      {CALL_RESULT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              placeholder="Summarize the call outcome, key points discussed, and any follow-up actions..."
              rows={5}
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium leading-7 text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            />
          </>
        )}
      </div>

      {/* Send button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="care-button-primary inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <CareLoadingGlyph size="sm" className="text-[#07111F]" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {activeMode === "call_log" ? "Log call" : "Send reply"}
        </button>
        <Link
          href={backHref}
          className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>
      </div>
    </div>
  );
}
