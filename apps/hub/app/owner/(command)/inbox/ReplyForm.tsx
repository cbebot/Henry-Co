"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { sendReplyAction, type ReplyState } from "./actions";

const INITIAL: ReplyState = { ok: false, message: "" };

export default function ReplyForm({ id, to }: { id: string; to: string }) {
  const [state, formAction, pending] = useActionState(sendReplyAction, INITIAL);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="body"
        rows={6}
        required
        placeholder={`Reply to ${to}…`}
        className="w-full rounded-[var(--acct-radius)] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2.5 text-sm text-[var(--acct-ink)] outline-none transition-colors focus:border-[var(--owner-accent)]"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="acct-button-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Send size={15} />
          {pending ? "Sending…" : "Send reply"}
        </button>
        {state.message ? (
          <span
            className={`text-sm ${
              state.ok ? "text-[var(--acct-green)]" : "text-[var(--acct-red)]"
            }`}
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
