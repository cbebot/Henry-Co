"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Mail, Clock3, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import type { HubHomeCopy } from "@henryco/i18n";
import { PublicCTA } from "@henryco/ui/public-design";
import {
  submitContactMessage,
  type ContactSubmitState,
} from "../(site)/contact/actions";

const INITIAL_STATE: ContactSubmitState = { status: "idle", message: "" };

type ReasonValue =
  | "general"
  | "partnerships"
  | "media"
  | "supplier"
  | "investor"
  | "complaint"
  | "other";

const FIELD_CLASS =
  "h-12 rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3.5 text-base text-[color:var(--home-ink)] outline-none placeholder:text-[color:var(--home-ink-35)] focus:border-[color:var(--home-accent)] focus:ring-2 focus:ring-[color:var(--home-accent-ring)]";
const LABEL_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)]";

function SubmitButton({ sendingLabel, sendLabel }: { sendingLabel: string; sendLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <PublicCTA
      type="submit"
      variant="primary"
      size="lg"
      disabled={pending}
      trailingIcon={<ArrowRight className="h-4 w-4" />}
    >
      {pending ? sendingLabel : sendLabel}
    </PublicCTA>
  );
}

/**
 * ContactHeroForm — primary above-fold form on the /contact page (CHROME-01B FIX 3).
 * Surfaces a real response-time line and the configured group support email.
 * V3-PUBLIC-DESIGN-01 moved it onto the theme-aware `--home-*` system + PublicCTA.
 */
export default function ContactHeroForm({
  supportEmail,
  responseTime,
  initialReason = "general",
  planContext = null,
  copy,
}: {
  supportEmail: string;
  responseTime?: string;
  initialReason?: string;
  planContext?: string | null;
  copy: HubHomeCopy["contactHeroForm"];
}) {
  const [state, formAction] = useFormState(submitContactMessage, INITIAL_STATE);
  const displayResponseTime = responseTime ?? copy.defaultResponseTime;

  const reasons: Array<{ value: ReasonValue; label: string }> = [
    { value: "general", label: copy.reasons.general },
    { value: "partnerships", label: copy.reasons.partnerships },
    { value: "media", label: copy.reasons.media },
    { value: "supplier", label: copy.reasons.supplier },
    { value: "investor", label: copy.reasons.investor },
    { value: "complaint", label: copy.reasons.complaint },
    { value: "other", label: copy.reasons.other },
  ];

  return (
    <form
      action={formAction}
      className="rounded-[1.6rem] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-6 sm:p-8"
      noValidate
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="home-eyebrow text-[color:var(--home-accent-text)]">{copy.formEyebrow}</p>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--home-ink-50)]">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {displayResponseTime}
        </span>
      </div>

      <h2 className="home-headline mt-3">{copy.formTitle}</h2>
      <p className="mt-2 inline-flex flex-wrap items-center gap-2 text-sm text-[color:var(--home-ink-65)]">
        <Mail className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" aria-hidden />
        <span>{copy.orEmail} </span>
        <a
          href={`mailto:${supportEmail}`}
          className="home-focus font-semibold text-[color:var(--home-ink)] underline underline-offset-4 transition hover:text-[color:var(--home-accent-text)]"
        >
          {supportEmail}
        </a>
        <span>{copy.orEmailDirect}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>{copy.nameLabel}</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder={copy.namePlaceholder}
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>{copy.emailLabel}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={copy.emailPlaceholder}
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>{copy.reasonLabel}</span>
        <select name="reason" defaultValue={initialReason} className={`${FIELD_CLASS} px-3`}>
          {reasons.map((item) => (
            <option
              key={item.value}
              value={item.value}
              className="bg-[color:var(--home-sheet)] text-[color:var(--home-ink)]"
            >
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {planContext ? <input type="hidden" name="planContext" value={planContext} /> : null}

      <label className="mt-4 flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>{copy.messageLabel}</span>
        <textarea
          name="message"
          required
          rows={5}
          defaultValue={planContext === "partner" ? copy.partnerPlanContext : ""}
          placeholder={copy.messagePlaceholder}
          className="rounded-xl border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-04)] px-3.5 py-3 text-base leading-7 text-[color:var(--home-ink)] outline-none placeholder:text-[color:var(--home-ink-35)] focus:border-[color:var(--home-accent)] focus:ring-2 focus:ring-[color:var(--home-accent-ring)]"
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <SubmitButton sendingLabel={copy.sendingLabel} sendLabel={copy.sendLabel} />
        {state.status === "success" ? (
          <p
            role="status"
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--hc-status-success-text)]"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {state.message}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p
            role="alert"
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--hc-status-danger-text)]"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
