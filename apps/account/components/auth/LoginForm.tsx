"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthCopy, getSurfaceCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { normalizeTrustedRedirect } from "@henryco/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import AuthField from "./AuthField";
import PasswordField from "./PasswordField";
import AuthSubmit from "./AuthSubmit";
import AuthErrorNotice from "./AuthErrorNotice";

/**
 * LoginForm — password sign-in.
 *
 * Presentation runs through the shared auth primitives; the security spine is
 * verbatim from the prior form: client signInWithPassword → on success the
 * `next` param is passed through normalizeTrustedRedirect (open-redirect guard)
 * and the browser hands off to the /auth/resolve router, which re-validates the
 * live access snapshot before landing the user. Errors go through the stable
 * mapAccountAuthMessage vocabulary (never the raw provider string).
 */
export default function LoginForm() {
  const locale = useHenryCoLocale();
  const authCopy = getAuthCopy(locale);
  const surfaceCopy = getSurfaceCopy(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(mapAccountAuthMessage(authError.message, "sign_in", locale));
        return;
      }

      const next = normalizeTrustedRedirect(searchParams.get("next"));
      const resolveHref =
        next === "/" ? "/auth/resolve" : `/auth/resolve?next=${encodeURIComponent(next)}`;
      window.location.assign(resolveHref);
      return;
    } catch {
      setError(surfaceCopy.accountForms.signInUnavailable);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-stagger" noValidate>
      <AuthErrorNotice message={error} />

      <div className="auth-fieldset">
        <AuthField
          label={authCopy.login.emailLabel}
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

        <PasswordField
          label={authCopy.login.passwordLabel}
          link={{ href: "/forgot-password", label: authCopy.login.forgotPassword }}
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={surfaceCopy.accountForms.passwordPlaceholder}
          autoComplete="current-password"
          required
          invalid={Boolean(error)}
          showLabel={authCopy.scene.showPassword}
          hideLabel={authCopy.scene.hidePassword}
        />
      </div>

      <AuthSubmit
        label={authCopy.login.submitButton}
        pendingLabel={surfaceCopy.accountForms.signInBusy}
        pending={loading}
      />
    </form>
  );
}
