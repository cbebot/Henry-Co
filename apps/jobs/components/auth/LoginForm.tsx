"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"password" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/candidate";

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLinkSent(false);
    setLoading("password");

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setLinkSent(false);
    setLoading("link");

    try {
      const supabase = createSupabaseBrowser();
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectTo,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setLinkSent(true);
    } catch {
      setError("We could not send a secure link right now. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <form onSubmit={handlePasswordSubmit} className="jobs-panel rounded-[2rem] p-6 sm:p-8">
      {error ? (
        <div className="mb-4 rounded-2xl bg-[var(--jobs-danger-soft)] px-4 py-3 text-sm text-[var(--jobs-danger)]">
          {error}
        </div>
      ) : null}

      {linkSent ? (
        <div className="mb-4 rounded-2xl bg-[var(--jobs-success-soft)] px-4 py-3 text-sm text-[var(--jobs-success)]">
          A secure sign-in link was sent to {email}. Use it to continue directly into HenryCo Jobs.
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="jobs-input"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="jobs-input pr-10"
              placeholder="Your password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--jobs-muted)]"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading !== null}
        className="jobs-button-primary mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold"
      >
        {loading === "password" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Sign in with password"}
      </button>

      <button
        type="button"
        disabled={!email.trim() || loading !== null}
        onClick={handleMagicLink}
        className="jobs-button-secondary mt-3 w-full rounded-full px-5 py-3 text-sm font-semibold"
      >
        {loading === "link" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Email me a secure sign-in link"}
      </button>
    </form>
  );
}
