"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PublicField, PublicInput } from "@henryco/ui/public-shell";
import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";

type Step = "password" | "mfa";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function LoginForm({
  initialError,
  next,
}: {
  initialError: string | null;
  next?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const dest = next && next.startsWith("/") ? next : "/dashboard";

  async function onPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createCmsSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (signInError) {
        setError("That email or password didn't match. Please try again.");
        setBusy(false);
        return;
      }

      // If an authenticator is enrolled, the session is aal1 and must be
      // elevated to aal2 with a TOTP code before reaching the dashboard.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp =
          factors?.totp?.find((f: { id: string; status: string }) => f.status === "verified") ??
          factors?.totp?.[0] ??
          null;
        if (totp) {
          setFactorId(totp.id);
          setStep("mfa");
          setBusy(false);
          return;
        }
      }

      router.replace(dest);
      router.refresh();
    } catch {
      setError("Something went wrong signing in. Please try again.");
      setBusy(false);
    }
  }

  async function onMfa(event: FormEvent) {
    event.preventDefault();
    if (!factorId) return;
    setError(null);
    const trimmed = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createCmsSupabaseBrowser();
      const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: trimmed,
      });
      if (mfaError) {
        setError("That code didn't match. Try the current one.");
        setBusy(false);
        return;
      }
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    setError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter your email above first, then request a link.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, next }),
      });
      setLinkSent(res.ok);
      if (!res.ok) setError("Couldn't send a link right now — use your password.");
    } catch {
      setError("Couldn't send a link right now — use your password.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "mfa") {
    return (
      <form onSubmit={onMfa} noValidate className="space-y-4">
        <p className="text-sm leading-6 text-[var(--hc-ink-muted)]">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </p>
        <PublicField label="Authenticator code" htmlFor="cms-mfa" error={error ?? undefined}>
          <PublicInput
            id="cms-mfa"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            invalid={Boolean(error)}
            required
            autoFocus
          />
        </PublicField>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--hc-accent)] px-5 text-sm font-semibold text-[#1a1408] shadow-sm transition-colors hover:bg-[var(--hc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Verifying…" : "Verify & sign in"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onPassword} noValidate className="space-y-4">
      <PublicField label="Owner email" htmlFor="cms-email">
        <PublicInput
          id="cms-email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="you@henrycogroup.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </PublicField>
      <PublicField label="Password" htmlFor="cms-password" error={error ?? undefined}>
        <PublicInput
          id="cms-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={Boolean(error)}
          required
        />
      </PublicField>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--hc-accent)] px-5 text-sm font-semibold text-[#1a1408] shadow-sm transition-colors hover:bg-[var(--hc-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {linkSent ? (
        <p className="text-center text-xs text-[var(--hc-accent-text)]">
          If a link can be delivered it&apos;s on its way — but your password works right now.
        </p>
      ) : (
        <button
          type="button"
          onClick={sendMagicLink}
          disabled={busy}
          className="block w-full text-center text-xs font-medium text-[var(--hc-ink-muted)] underline-offset-2 hover:text-[var(--hc-accent-text)] hover:underline disabled:opacity-60"
        >
          Email me a sign-in link instead
        </button>
      )}
    </form>
  );
}
