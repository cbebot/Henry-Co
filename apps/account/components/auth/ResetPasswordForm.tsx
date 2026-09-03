"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { getAuthCopy, getSurfaceCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import PasswordField from "./PasswordField";
import AuthSubmit from "./AuthSubmit";
import AuthErrorNotice from "./AuthErrorNotice";

/**
 * ResetPasswordForm — set a new password after following the reset link.
 *
 * Presentation runs through the shared auth primitives; the security spine is
 * verbatim from the prior form: the match + length>=8 checks, then client
 * updateUser({ password }) and router.push("/"). Both password inputs are now
 * the ONE canonical PasswordField (the confirm field previously lacked a reveal
 * toggle). Errors go through mapAccountAuthMessage (never the raw provider
 * string); one-off strings stay on translateSurfaceLabel, consistent with the
 * prior form.
 */
export default function ResetPasswordForm() {
  const locale = useHenryCoLocale();
  const authCopy = getAuthCopy(locale);
  const surfaceCopy = getSurfaceCopy(locale);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError(surfaceCopy.accountForms.passwordsDoNotMatch); return; }
    if (password.length < 8) { setError(authCopy.errors.passwordTooShort); return; }

    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) { setError(mapAccountAuthMessage(updateErr.message, "reset_password", locale)); return; }
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError(t("We couldn’t update your password right now. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-success" role="status">
        <span className="auth-success-icon">
          <CheckCircle size={22} aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold">{t("Password updated")}</h2>
          <p className="mt-1.5 text-sm">{t("Redirecting to your account...")}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-stagger" noValidate>
      <AuthErrorNotice message={error} />

      <div className="auth-fieldset">
        <PasswordField
          label={t("New password")}
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={surfaceCopy.accountForms.minPasswordPlaceholder}
          autoComplete="new-password"
          required
          minLength={8}
          invalid={Boolean(error)}
          showLabel={authCopy.scene.showPassword}
          hideLabel={authCopy.scene.hidePassword}
        />

        <PasswordField
          label={authCopy.signup.confirmPasswordLabel}
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("Repeat new password")}
          autoComplete="new-password"
          required
          invalid={Boolean(error)}
          showLabel={authCopy.scene.showPassword}
          hideLabel={authCopy.scene.hidePassword}
        />
      </div>

      <AuthSubmit
        label={t("Set new password")}
        pendingLabel={t("Updating password...")}
        pending={loading}
      />
    </form>
  );
}
