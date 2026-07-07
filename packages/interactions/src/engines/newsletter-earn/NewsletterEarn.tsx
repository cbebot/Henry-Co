"use client";

/**
 * Newsletter Earn Engine — `<NewsletterEarn>` (doctrine Engine 7).
 *
 * A single-field, named-value capture that renders only when the tested
 * predicate says a value moment happened. The ask names what the reader
 * GETS (injected, localized) — never "subscribe to updates". One click for
 * identified users (email prefilled upstream), one field for anonymous.
 */

import { useState, type FormEvent } from "react";
import { cn } from "@henryco/ui/cn";
import { CtaButton, type CtaLabels } from "../cta/CtaButton";

export interface NewsletterEarnLabels {
  /** The named value, e.g. "Weekly: the new verified providers in your city…". */
  valueStatement: string;
  /** Input placeholder, e.g. "you@example.com". */
  placeholder: string;
  /** Submit label, e.g. "Get the letter". */
  submit: string;
  cta: CtaLabels;
}

export interface NewsletterEarnProps {
  surfaceId: string;
  labels: NewsletterEarnLabels;
  /** Perform the subscription (server action / API call). */
  onSubscribe: (email: string) => Promise<void>;
  /** Prefilled for identified users → single-click subscribe. */
  defaultEmail?: string;
  className?: string;
}

export function NewsletterEarn({
  surfaceId,
  labels,
  onSubscribe,
  defaultEmail = "",
  className,
}: NewsletterEarnProps) {
  const [email, setEmail] = useState(defaultEmail);

  const submit = async () => {
    await onSubscribe(email.trim());
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={onFormSubmit}
      className={cn(
        "flex flex-col gap-3 rounded-[1.5rem] border border-zinc-200/70 bg-zinc-50/60 p-5",
        "dark:border-white/8 dark:bg-white/[0.03] sm:flex-row sm:items-center",
        className,
      )}
    >
      <p className="flex-1 text-sm leading-6 text-zinc-600 dark:text-white/70">{labels.valueStatement}</p>
      <div className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.placeholder}
          className={cn(
            "min-h-[44px] w-full rounded-full border border-zinc-300/80 bg-white px-4 text-sm text-zinc-900 outline-none",
            "placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-amber-500/55",
            "dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35 sm:w-56",
          )}
        />
        <CtaButton
          ctaId="newsletter_subscribe"
          surfaceId={surfaceId}
          variant="primary"
          onAction={submit}
          labels={labels.cta}
        >
          {labels.submit}
        </CtaButton>
      </div>
    </form>
  );
}
