"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, StickyNote, RefreshCw } from "lucide-react";
import { emitCareToast } from "@/components/feedback/CareToaster";
import {
  updateSupportThreadStatusAction,
  addSupportInternalNoteAction,
} from "@/app/(staff)/support/actions";
import { formatSupportThreadStatusLabel } from "@/lib/support/shared";

type ThreadQuickActionsProps = {
  threadId: string;
  currentStatus: string;
  statuses: readonly string[];
};

const inputCls =
  "h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

export default function ThreadQuickActions({
  threadId,
  currentStatus,
  statuses,
}: ThreadQuickActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [note, setNote] = useState("");

  function handleStatusChange() {
    if (selectedStatus === currentStatus && !note.trim()) return;
    startTransition(async () => {
      if (selectedStatus !== currentStatus) {
        const res = await updateSupportThreadStatusAction({
          threadId,
          status: selectedStatus,
          note: note.trim() || null,
        });
        emitCareToast({ tone: res.tone, title: res.message });
      } else if (note.trim()) {
        const res = await addSupportInternalNoteAction({
          threadId,
          note: note.trim(),
        });
        emitCareToast({ tone: res.tone, title: res.message });
      }
      setNote("");
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
      >
        <RefreshCw className="h-4 w-4" />
        Quick actions
        <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#0F1A2C]">
          <div className="space-y-3">
            <label className="grid gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Status
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={inputCls}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {formatSupportThreadStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                Note (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Quick internal note..."
                rows={2}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
              />
            </label>

            <button
              type="button"
              onClick={handleStatusChange}
              disabled={isPending || (selectedStatus === currentStatus && !note.trim())}
              className="care-button-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StickyNote className="h-4 w-4" />
              )}
              {selectedStatus !== currentStatus ? "Update status" : "Add note"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
