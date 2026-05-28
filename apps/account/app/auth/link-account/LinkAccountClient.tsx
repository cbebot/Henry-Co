"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { emitEvent } from "@henryco/observability/events";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

/**
 * Client island for /auth/link-account. Owns the password input
 * + sign-in submission. On success emits `oauth.linked` and lets
 * the upstream router decide the destination.
 */

export type LinkAccountCopy = {
  passwordLabel: string;
  submitLabel: string;
  cancelLabel: string;
  incorrectMessage: string;
  genericMessage: string;
};

export type LinkAccountClientProps = {
  email: string;
  provider: string;
  next: string;
  copy: LinkAccountCopy;
};

export function LinkAccountClient({ email, provider, next, copy }: LinkAccountClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        const msg = signInError.message?.toLowerCase() ?? "";
        setError(
          msg.includes("invalid") || msg.includes("credential")
            ? copy.incorrectMessage
            : copy.genericMessage,
        );
        return;
      }
      emitEvent({
        name: "henry.auth.oauth.linked",
        classification: "user_action",
        outcome: "completed",
        payload: { provider },
      });
      router.replace(next === "/" ? "/auth/choose" : next);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-[var(--acct-ink)]">
        {copy.passwordLabel}
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)] focus:border-[var(--acct-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--acct-gold)]"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending || password.length === 0}
          className="acct-button-primary inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "…" : copy.submitLabel}
        </button>
        <a
          href="/api/auth/logout?next=/auth/choose"
          className="acct-button-ghost self-center text-xs"
        >
          {copy.cancelLabel}
        </a>
      </div>
    </form>
  );
}
