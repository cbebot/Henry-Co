"use client";

import { useState, type FormEvent } from "react";
import { PublicField, PublicInput } from "@henryco/ui/public-shell";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LoginForm({
  initialError,
  next,
}: {
  initialError: string | null;
  next?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(initialError);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, next }),
      });
      if (res.status === 429) {
        setError("Too many attempts. Please wait a few minutes and try again.");
        setStatus("idle");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] p-5 text-center">
        <p className="text-sm font-semibold text-[var(--hc-ink)]">Check your email</p>
        <p className="mt-1.5 text-sm leading-6 text-[var(--hc-ink-muted)]">
          If <span className="font-medium text-[var(--hc-ink)]">{email.trim()}</span> is an owner
          account, a secure sign-in link is on its way. The link expires shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs font-medium text-[var(--hc-accent-text)] underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PublicField label="Owner email" htmlFor="cms-email" error={error ?? undefined}>
        <PublicInput
          id="cms-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@henrycogroup.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          invalid={Boolean(error)}
          required
          autoFocus
        />
      </PublicField>
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--hc-accent)] px-5 text-sm font-semibold text-[#1a1408] shadow-sm transition-colors hover:bg-[var(--hc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "sending" ? "Sending link…" : "Send sign-in link"}
      </button>
    </form>
  );
}
