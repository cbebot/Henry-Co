"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, UserCog, Sparkles, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getCareSupportExtraCopy } from "@henryco/i18n";
import { emitCareToast } from "@/components/feedback/CareToaster";
import {
  addSupportInternalNoteAction,
  assignSupportThreadAction,
  sendSupportReplyAction,
  updateSupportThreadStatusAction,
} from "@/app/(staff)/support/actions";
import { formatSupportThreadStatusLabel } from "@/lib/support/shared";

type AgentOption = {
  id: string;
  fullName: string;
  role: string;
};

type SupportThreadControlsProps = {
  threadId: string;
  currentStatus: string;
  currentAssigneeId: string | null;
  statuses: readonly string[];
  agents: AgentOption[];
  whatsappConfigured: boolean;
  whatsappReason: string;
};

function buttonCls(variant: "primary" | "secondary" = "primary") {
  if (variant === "secondary") {
    return "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "care-button-primary inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";
}

function inputCls(extra = "") {
  return [
    "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

export default function SupportThreadControls({
  threadId,
  currentStatus,
  currentAssigneeId,
  statuses,
  agents,
  whatsappConfigured,
  whatsappReason,
}: SupportThreadControlsProps) {
  const router = useRouter();
  const locale = useHenryCoLocale();
  const copy = getCareSupportExtraCopy(locale).controls;
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("pending_customer");
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [assignment, setAssignment] = useState(currentAssigneeId || "unassigned");
  const [status, setStatus] = useState(currentStatus);
  const [statusNote, setStatusNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [replyPending, startReply] = useTransition();
  const [assignPending, startAssign] = useTransition();
  const [statusPending, startStatus] = useTransition();
  const [notePending, startNote] = useTransition();

  async function finalizeToast(result: Awaited<ReturnType<typeof sendSupportReplyAction>>) {
    emitCareToast({
      tone:
        result.tone === "warning"
          ? "warning"
          : result.tone === "success"
            ? "success"
            : "error",
      title: result.message,
    });
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="care-card rounded-[2rem] p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          {copy.composerEyebrow}
        </div>
        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white">
          {copy.composerHeading}
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/65">
          {copy.composerIntro}
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
              {copy.replyMessageLabel}
            </span>
            <textarea
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              rows={8}
              className={textareaCls}
              placeholder={copy.replyMessagePlaceholder}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[0.92fr_1.08fr]">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                {copy.statusAfterSending}
              </span>
              <select
                value={replyStatus}
                onChange={(event) => setReplyStatus(event.target.value)}
                className={inputCls()}
              >
                {statuses.map((option) => (
                  <option key={option} value={option}>
                    {formatSupportThreadStatusLabel(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(event) => setSendWhatsApp(event.target.checked)}
                  disabled={!whatsappConfigured}
                  className="mt-1 h-4 w-4 rounded border-black/15 text-[color:var(--accent)] focus:ring-[color:var(--accent)] disabled:opacity-50"
                />
                <div>
                  <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                    {copy.attemptWhatsappTitle}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/65">
                    {whatsappConfigured ? copy.whatsappConfiguredText : whatsappReason}
                  </div>
                </div>
              </div>
            </label>
          </div>

          <button
            type="button"
            disabled={replyPending}
            className={buttonCls()}
            onClick={() =>
              startReply(async () => {
                const action = await sendSupportReplyAction({
                  threadId,
                  message: replyMessage,
                  nextStatus: replyStatus,
                  sendWhatsApp,
                });
                if (action.ok) {
                  setReplyMessage("");
                }
                await finalizeToast(action);
              })
            }
          >
            {replyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {replyPending ? copy.sendingReply : copy.sendReply}
          </button>
        </div>
      </section>

      <div className="grid gap-6">
        <section className="care-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <UserCog className="h-4 w-4 text-[color:var(--accent)]" />
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              {copy.assignmentLabel}
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <select
              value={assignment}
              onChange={(event) => setAssignment(event.target.value)}
              className={inputCls()}
            >
              <option value="unassigned">{copy.unassigned}</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.fullName} • {agent.role}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={assignPending}
              className={buttonCls("secondary")}
              onClick={() =>
                startAssign(async () => {
                  await finalizeToast(
                    await assignSupportThreadAction({
                      threadId,
                      assigneeId: assignment,
                    })
                  );
                })
              }
            >
              {assignPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
              {assignPending ? copy.updatingAssignment : copy.updateAssignment}
            </button>
          </div>
        </section>

        <section className="care-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              {copy.threadStatusLabel}
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputCls()}
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {formatSupportThreadStatusLabel(option)}
                </option>
              ))}
            </select>
            <textarea
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              rows={4}
              placeholder={copy.statusNotePlaceholder}
              className={textareaCls}
            />
            <button
              type="button"
              disabled={statusPending}
              className={buttonCls("secondary")}
              onClick={() =>
                startStatus(async () => {
                  const action = await updateSupportThreadStatusAction({
                    threadId,
                    status,
                    note: statusNote,
                  });
                  if (action.ok) {
                    setStatusNote("");
                  }
                  await finalizeToast(action);
                })
              }
            >
              {statusPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {statusPending ? copy.updatingStatus : copy.updateStatus}
            </button>
          </div>
        </section>

        <section className="care-card rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <StickyNote className="h-4 w-4 text-[color:var(--accent)]" />
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              {copy.internalNoteLabel}
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <textarea
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
              rows={5}
              placeholder={copy.internalNotePlaceholder}
              className={textareaCls}
            />
            <button
              type="button"
              disabled={notePending}
              className={buttonCls("secondary")}
              onClick={() =>
                startNote(async () => {
                  const action = await addSupportInternalNoteAction({
                    threadId,
                    note: internalNote,
                  });
                  if (action.ok) {
                    setInternalNote("");
                  }
                  await finalizeToast(action);
                })
              }
            >
              {notePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
              {notePending ? copy.savingNote : copy.saveInternalNote}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
