"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UserCog } from "lucide-react";
import Link from "next/link";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { assignSupportThreadAction } from "@/app/(staff)/support/actions";

type Agent = {
  id: string;
  fullName: string;
  role: string;
};

type AssignFormProps = {
  threadId: string;
  currentAssigneeId: string | null;
  agents: Agent[];
  backHref: string;
};

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

export default function AssignForm({
  threadId,
  currentAssigneeId,
  agents,
  backHref,
}: AssignFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId || "unassigned");

  function handleAssign() {
    startTransition(async () => {
      const res = await assignSupportThreadAction({
        threadId,
        assigneeId,
      });
      emitCareToast({ tone: res.tone, title: res.message });
      if (res.ok) {
        router.push(backHref);
        router.refresh();
      }
    });
  }

  return (
    <div className="care-card rounded-[2rem] p-6 space-y-4">
      <label className="grid gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
          Assign to
        </span>
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={inputCls}
        >
          <option value="unassigned">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.fullName} ({agent.role})
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAssign}
          disabled={isPending}
          className="care-button-primary inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCog className="h-4 w-4" />
          )}
          Assign
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
