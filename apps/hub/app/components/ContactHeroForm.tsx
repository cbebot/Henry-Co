"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Mail, Clock3, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  submitContactMessage,
  type ContactSubmitState,
} from "../(site)/contact/actions";

const INITIAL_STATE: ContactSubmitState = { status: "idle", message: "" };

const REASONS: Array<{ value: string; label: string }> = [
  { value: "general", label: "General enquiry" },
  { value: "partnerships", label: "Partnership" },
  { value: "media", label: "Media / press" },
  { value: "supplier", label: "Supplier introduction" },
  { value: "investor", label: "Investor / advisor" },
  { value: "complaint", label: "Complaint or concern" },
  { value: "other", label: "Something else" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d6a851] px-6 py-3.5 text-sm font-semibold text-[#0a0807] transition hover:bg-[#e3b966] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

/**
 * ContactHeroForm — primary above-fold form on the /contact page (CHROME-01B
 * FIX 3). Surfaces a real response-time line and the configured group
 * support email, so users see how to reach the company before the form
 * even loads.
 */
export default function ContactHeroForm({
  supportEmail,
  responseTime = "Replies within 1 business day",
  initialReason = "general",
  planContext = null,
}: {
  supportEmail: string;
  responseTime?: string;
  initialReason?: string;
  planContext?: string | null;
}) {
  const [state, formAction] = useFormState(submitContactMessage, INITIAL_STATE);

  return (
    <form
      action={formAction}
      className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8"
      noValidate
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
          Reach the company
        </p>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/65">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {responseTime}
        </span>
      </div>

      <h2 className="mt-3 text-[1.4rem] font-semibold leading-[1.2] tracking-[-0.012em] text-white sm:text-[1.7rem]">
        Send the company a note
      </h2>
      <p className="mt-2 inline-flex flex-wrap items-center gap-2 text-sm text-white/68">
        <Mail className="h-3.5 w-3.5 text-[#d6a851]" aria-hidden />
        <span>Or email </span>
        <a
          href={`mailto:${supportEmail}`}
          className="font-semibold text-white underline underline-offset-4 transition hover:text-[#d6a851]"
        >
          {supportEmail}
        </a>
        <span>directly.</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Your name
          </span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            className="h-12 rounded-xl border border-white/12 bg-black/30 px-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#d6a851]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            className="h-12 rounded-xl border border-white/12 bg-black/30 px-3.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#d6a851]"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Reason
        </span>
        <select
          name="reason"
          defaultValue={initialReason}
          className="h-12 rounded-xl border border-white/12 bg-black/30 px-3 text-base text-white outline-none focus:border-[#d6a851]"
        >
          {REASONS.map((item) => (
            <option key={item.value} value={item.value} className="bg-[#0a0807] text-white">
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {planContext ? (
        <input type="hidden" name="planContext" value={planContext} />
      ) : null}

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          defaultValue={
            planContext === "partner"
              ? "I'd like to discuss the marketplace Partner tier — custom inventory terms and direct placement controls. Here is what I'm working with: "
              : ""
          }
          placeholder="A short note about why you are reaching out."
          className="rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-base leading-7 text-white outline-none placeholder:text-white/30 focus:border-[#d6a851]"
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status === "success" ? (
          <p
            role="status"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {state.message}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p
            role="alert"
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-300"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
