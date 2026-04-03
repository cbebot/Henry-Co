"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

function mapSignupError(message?: string | null) {
  const clean = String(message || "").trim();
  if (/database error|saving new user|creating new user/i.test(clean)) {
    return "Account creation is temporarily routed through HenryCo support while shared auth provisioning is repaired. Use an existing HenryCo account to sign in, or email jobs@henrycogroup.com for manual activation.";
  }

  return clean || "Something went wrong. Please try again.";
}

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        setError(mapSignupError(authError.message));
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
      <div className="jobs-panel rounded-[2rem] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--jobs-success-soft)] text-[var(--jobs-success)]">
          ✓
        </div>
        <h2 className="mt-4 text-xl font-semibold">Check your inbox</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--jobs-muted)]">
          Your HenryCo Jobs account is ready to verify. Use the email sent to <strong>{email}</strong> to activate it.
        </p>
        <button onClick={() => router.push("/login")} className="jobs-button-secondary mt-5 rounded-full px-5 py-3 text-sm font-semibold">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="jobs-panel rounded-[2rem] p-6 sm:p-8">
      {error ? (
        <div className="mb-4 rounded-2xl bg-[var(--jobs-danger-soft)] px-4 py-3 text-sm text-[var(--jobs-danger)]">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="jobs-input"
            placeholder="Your full name"
            required
          />
        </div>
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
              placeholder="Minimum 8 characters"
              required
              minLength={8}
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

      <button type="submit" disabled={loading} className="jobs-button-primary mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold">
        {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="jobs-button-secondary mt-3 w-full rounded-full px-5 py-3 text-sm font-semibold"
      >
        I already have a HenryCo account
      </button>
    </form>
  );
}
