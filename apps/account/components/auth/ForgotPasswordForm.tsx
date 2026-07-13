"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { getAuthCopy, getSurfaceCopy, formatSurfaceTemplate } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import AuthField from "./AuthField";
import AuthSubmit from "./AuthSubmit";
import AuthErrorNotice from "./AuthErrorNotice";

/**
 * ForgotPasswordForm — request a password-reset link.
 *
 * Presentation runs through the shared auth primitives; the security spine is
 * verbatim from the prior form: client resetPasswordForEmail with the reset-page
 * redirectTo, then a "check your email" success panel. Errors go through the
 * stable mapAccountAuthMessage vocabulary (never the raw provider string).
 */
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
      <div className="auth-success" role="status">
        <span className="auth-success-icon">
          <Mail size={22} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{surfaceCopy.accountForms.checkEmailTitle}</h2>
          <p className="mt-1.5 text-sm">
            {formatSurfaceTemplate(surfaceCopy.accountForms.resetSent, { email })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-stagger" noValidate>
      <AuthErrorNotice message={error} />

      <div className="auth-fieldset">
        <AuthField
          label={authCopy.reset.emailLabel}
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={surfaceCopy.accountForms.emailPlaceholder}
          autoComplete="email"
          required
          invalid={Boolean(error)}
        />
      </div>

      <AuthSubmit
        label={authCopy.reset.submitButton}
        pendingLabel={surfaceCopy.accountForms.resetBusy}
        pending={loading}
      />
    </form>
  );
}
