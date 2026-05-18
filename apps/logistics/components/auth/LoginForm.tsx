"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = getBrowserSupabase();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(t(authError.message));
        return;
      }

      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch {
      setError(t("Something went wrong. Please try again."));
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
          <label className="mb-1.5 block text-sm font-medium">{t("Email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="acct-input"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium">{t("Password")}</label>
            <Link href="/forgot-password" className="text-xs text-[var(--acct-gold)] hover:underline">
              {t("Forgot password?")}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder={t("Your password")}
              required
              autoComplete="current-password"
              aria-label={t("Password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--acct-muted)]"
              aria-label={showPassword ? t("Hide password") : t("Show password")}
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
        {loading ? <Loader2 size={18} className="animate-spin" /> : t("Sign in")}
      </button>
    </form>
  );
}
