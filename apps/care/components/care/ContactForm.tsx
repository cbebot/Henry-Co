"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Mail,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";
import {
  SUPPORT_CONTACT_METHODS,
  SUPPORT_SERVICE_CATEGORIES,
  SUPPORT_URGENCY_LEVELS,
  formatSupportContactMethodLabel,
  formatSupportServiceCategoryLabel,
  formatSupportUrgencyLabel,
} from "@/lib/support/shared";

type ContactFormState = {
  full_name: string;
  email: string;
  phone: string;
  preferred_contact_method: string;
  service_category: string;
  urgency: string;
  subject: string;
  message: string;
  tracking_code: string;
};

const INITIAL_STATE: ContactFormState = {
  full_name: "",
  email: "",
  phone: "",
  preferred_contact_method: "email",
  service_category: "general",
  urgency: "routine",
  subject: "",
  message: "",
  tracking_code: "",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const needsPhone = useMemo(
    () =>
      form.preferred_contact_method === "phone" ||
      form.preferred_contact_method === "whatsapp",
    [form.preferred_contact_method]
  );

  function updateField<Key extends keyof ContactFormState>(key: Key, value: ContactFormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validate() {
    if (form.full_name.trim().length < 2) {
      return "Please enter your full name.";
    }

    if (!isValidEmail(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (needsPhone && form.phone.trim().length < 7) {
      return "Please add a phone number for the selected contact method.";
    }

    if (form.subject.trim().length < 4) {
      return "Please add a clear subject so the team can respond quickly.";
    }

    if (form.message.trim().length < 16) {
      return "Please include a little more detail so the team can respond accurately.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      emitCareToast({
        tone: "warning",
        title: "Check the contact details",
        description: validationError,
      });
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessRef(null);

    try {
      const response = await fetch("/api/care/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            threadRef?: string;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        const message = payload?.error || "The Care desk could not receive the message just now.";
        setError(message);
        emitCareToast({
          tone: "error",
          title: "Message not sent",
          description: message,
        });
        return;
      }

      setForm(INITIAL_STATE);
      setSuccessRef(payload.threadRef || null);
      emitCareToast({
        tone: "success",
        title: "Message sent",
        description: payload.threadRef
          ? `Support reference ${payload.threadRef} is now active.`
          : "The Care desk has received the message.",
      });
    } catch {
      const message = "Network error. Please try again in a moment.";
      setError(message);
      emitCareToast({
        tone: "error",
        title: "Network error",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="care-card rounded-[2.4rem] p-7 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/18 bg-[color:var(--accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] care-accent-text">
        <ShieldCheck className="h-4 w-4" />
        Contact HenryCo Care
      </div>

      <h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-zinc-950 dark:text-white">
        Send a message and expect a clear follow-up.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/68">
        Use this form for booking questions, support follow-up, delivery coordination, recurring
        plan changes, billing clarification, or any service concern that needs a thoughtful reply.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" required>
            <input
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              placeholder="Your full name"
              className="care-input care-ring h-14 rounded-2xl px-4 py-3 text-base md:text-sm"
              autoComplete="name"
              required
            />
          </Field>

          <Field label="Email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                className="care-input care-ring h-14 w-full rounded-2xl px-12 py-3 text-base md:text-sm"
                autoComplete="email"
                required
              />
            </div>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Phone number">
            <div className="relative">
              <PhoneCall className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Phone or WhatsApp number"
                className="care-input care-ring h-14 w-full rounded-2xl px-12 py-3 text-base md:text-sm"
                autoComplete="tel"
              />
            </div>
          </Field>

          <Field label="Preferred contact route" required>
            <select
              value={form.preferred_contact_method}
              onChange={(event) => updateField("preferred_contact_method", event.target.value)}
              className="care-input care-ring h-14 rounded-2xl px-4 py-3 text-base md:text-sm"
            >
              {SUPPORT_CONTACT_METHODS.map((option) => (
                <option key={option} value={option}>
                  {formatSupportContactMethodLabel(option)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.92fr]">
          <Field label="Service category" required>
            <select
              value={form.service_category}
              onChange={(event) => updateField("service_category", event.target.value)}
              className="care-input care-ring h-14 rounded-2xl px-4 py-3 text-base md:text-sm"
            >
              {SUPPORT_SERVICE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {formatSupportServiceCategoryLabel(option)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject" required>
            <input
              value={form.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Briefly describe the request"
              className="care-input care-ring h-14 rounded-2xl px-4 py-3 text-base md:text-sm"
              maxLength={120}
              required
            />
          </Field>

          <Field label="Urgency" required>
            <select
              value={form.urgency}
              onChange={(event) => updateField("urgency", event.target.value)}
              className="care-input care-ring h-14 rounded-2xl px-4 py-3 text-base md:text-sm"
            >
              {SUPPORT_URGENCY_LEVELS.map((option) => (
                <option key={option} value={option}>
                  {formatSupportUrgencyLabel(option)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Tracking code">
          <input
            value={form.tracking_code}
            onChange={(event) => updateField("tracking_code", event.target.value.toUpperCase())}
            placeholder="Optional, if the request relates to an existing booking"
            className="care-input care-ring h-14 rounded-2xl px-4 py-3 text-base uppercase md:text-sm"
          />
        </Field>

        <Field label="Message" required>
          <div className="relative">
            <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-zinc-400 dark:text-white/35" />
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Share the context, timing, address or access details, tracking reference, and the specific help you need."
              className="care-input care-ring min-h-[180px] rounded-2xl px-12 py-3 text-base md:text-sm"
              required
            />
          </div>
        </Field>

        <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-sm font-semibold text-zinc-950 dark:text-white">
            What happens next
          </div>
          <div className="mt-2 grid gap-2 text-sm leading-6 text-zinc-600 dark:text-white/65">
            <div>Your message is kept under one clear reference.</div>
            <div>The team replies by email, and by WhatsApp as well when that channel is available.</div>
            <div>Urgent requests stay visible until the issue has been resolved properly.</div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-6 py-3.5 text-sm font-semibold text-[#07111F] shadow-[0_16px_40px_rgba(92,108,255,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(92,108,255,0.28)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <CareLoadingGlyph size="sm" className="text-[#07111F]" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {submitting ? "Sending message..." : "Send to HenryCo Care"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {successRef ? (
        <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
          Message received. Your reference is <span className="font-semibold">{successRef}</span>.
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
        {required ? " • Required" : ""}
      </span>
      {children}
    </label>
  );
}
