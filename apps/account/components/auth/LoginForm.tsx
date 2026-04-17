"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthCopy, getSurfaceCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { ButtonPendingContent } from "@henryco/ui";
import { normalizeTrustedRedirect } from "@henryco/config";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { mapAccountAuthMessage } from "@/lib/auth-copy";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const locale = useHenryCoLocale();
  const authCopy = getAuthCopy(locale);
  const surfaceCopy = getSurfaceCopy(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={handleSubmit} className="acct-card p-6 sm:p-8">
      {error && (
        <div className="mb-4 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{authCopy.login.emailLabel}</label>
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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium">{authCopy.login.passwordLabel}</label>
            <a
              href="/forgot-password"
              className="text-xs text-[var(--acct-gold)] hover:underline"
            >
              {authCopy.login.forgotPassword}
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder={surfaceCopy.accountForms.passwordPlaceholder}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--acct-muted)]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="acct-button-primary mt-6 w-full rounded-xl py-3"
      >
        <ButtonPendingContent pending={loading} pendingLabel={surfaceCopy.accountForms.signInBusy} spinnerLabel={authCopy.login.submitButton}>
          {authCopy.login.submitButton}
        </ButtonPendingContent>
      </button>
    </form>
  );
}
