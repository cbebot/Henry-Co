"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function LearnSignupForm({ nextPath = "/learner" }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "learner",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) throw error;
      setMessage("Account created. Check your inbox to verify the academy account.");
      router.push("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="learn-panel rounded-[2rem] p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--learn-ink)]">Full name</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            type="text"
            required
            className="learn-input mt-2 rounded-2xl px-4 py-3"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--learn-ink)]">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            className="learn-input mt-2 rounded-2xl px-4 py-3"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--learn-ink)]">Password</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={8}
            className="learn-input mt-2 rounded-2xl px-4 py-3"
            placeholder="At least 8 characters"
          />
        </div>

        {message ? <div className="rounded-2xl border border-[var(--learn-line)] px-4 py-3 text-sm text-[var(--learn-ink-soft)]">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="learn-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create academy account"}
        </button>
      </form>
    </div>
  );
}
