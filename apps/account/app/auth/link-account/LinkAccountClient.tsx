"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { emitEvent } from "@henryco/observability/events";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import PasswordField from "@/components/auth/PasswordField";
import AuthSubmit from "@/components/auth/AuthSubmit";
import AuthErrorNotice from "@/components/auth/AuthErrorNotice";

/**
 * Client island for /auth/link-account. Owns the password input
 * + sign-in submission. On success emits `oauth.linked` and lets
 * the upstream router decide the destination.
 *
 * Presentation runs through the shared auth primitives (PasswordField /
 * AuthSubmit / AuthErrorNotice); the security spine is verbatim — the email
 * comes from the signed intent (a prop, never user input) and drives
 * signInWithPassword; cancel remains the /api/auth/logout GET.
 */

export type LinkAccountCopy = {
  passwordLabel: string;
  submitLabel: string;
  submitBusyLabel: string;
  cancelLabel: string;
  incorrectMessage: string;
  genericMessage: string;
  showPassword: string;
  hidePassword: string;
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
    <form onSubmit={onSubmit} className="auth-stagger" noValidate>
      <AuthErrorNotice message={error} />

      <div className="auth-fieldset">
        <PasswordField
          label={copy.passwordLabel}
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          invalid={Boolean(error)}
          showLabel={copy.showPassword}
          hideLabel={copy.hidePassword}
        />
      </div>

      <AuthSubmit
        label={copy.submitLabel}
        pendingLabel={copy.submitBusyLabel}
        pending={pending}
        disabled={password.length === 0}
      />

      <p className="auth-alt">
        <a href="/api/auth/logout?next=/auth/choose">{copy.cancelLabel}</a>
      </p>
    </form>
  );
}
