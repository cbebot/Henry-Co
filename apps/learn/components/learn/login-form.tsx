"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function LearnLoginForm({ nextPath = "/learner" }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowser();

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) throw error;
        setMessage("Check your inbox for your sign-in link. Your academy session will open as soon as you confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn't sign you in just now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="learn-panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex gap-3">
        {[
          ["magic", "Magic link"],
          ["password", "Password"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value as "magic" | "password")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === value
                ? "bg-[var(--learn-mint)] text-[#041915]"
                : "border border-[var(--learn-line)] text-[var(--learn-ink-soft)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        {mode === "password" ? (
          <div>
            <label className="block text-sm font-medium text-[var(--learn-ink)]">Password</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="learn-input mt-2 rounded-2xl px-4 py-3"
              placeholder="Enter your password"
            />
          </div>
        ) : null}

        {message ? <div className="rounded-2xl border border-[var(--learn-line)] bg-white/5 px-4 py-3 text-sm text-[var(--learn-ink-soft)]">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="learn-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? "Opening your academy..." : mode === "magic" ? "Email my sign-in link" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
