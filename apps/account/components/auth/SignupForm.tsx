"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="acct-card p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--acct-green-soft)]">
          <svg className="h-6 w-6 text-[var(--acct-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-[var(--acct-muted)]">
          We&apos;ve sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="acct-button-secondary mt-4"
        >
          Back to sign in
        </button>
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

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="acct-input"
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
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
          <label className="mb-1.5 block text-sm font-medium">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="acct-input pr-10"
              placeholder="Min. 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
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
        {loading ? <Loader2 size={18} className="animate-spin" /> : "Create account"}
      </button>
    </form>
  );
}
