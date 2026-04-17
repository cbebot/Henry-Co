"use client";

import { useState } from "react";
import { getAuthCopy, getSurfaceCopy, formatSurfaceTemplate } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";

export default function ForgotPasswordForm() {
  const locale = useHenryCoLocale();
  const authCopy = getAuthCopy(locale);
  const surfaceCopy = getSurfaceCopy(locale);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (resetError) {
        setError(mapAccountAuthMessage(resetError.message, "forgot_password", locale));
        return;
      }
      setSent(true);
    } catch {
      setError(surfaceCopy.accountForms.resetUnavailable);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="acct-card p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--acct-green-soft)]">
          <svg className="h-6 w-6 text-[var(--acct-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">{surfaceCopy.accountForms.checkEmailTitle}</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          {formatSurfaceTemplate(surfaceCopy.accountForms.resetSent, { email })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="acct-card p-6 sm:p-8">
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium">{authCopy.reset.emailLabel}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="acct-input"
          placeholder={surfaceCopy.accountForms.emailPlaceholder}
          required
          autoComplete="email"
        />
      </div>
      <button type="submit" disabled={loading} className="acct-button-primary mt-4 w-full rounded-xl py-3">
        <ButtonPendingContent pending={loading} pendingLabel={surfaceCopy.accountForms.resetBusy} spinnerLabel={authCopy.reset.submitButton}>
          {authCopy.reset.submitButton}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
