"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function StudioLoginForm({ nextPath = "/client" }: { nextPath?: string }) {
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
      const supabase = getBrowserSupabase();

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}${nextPath}`,
          },
        });

        if (error) throw error;
        setMessage("Magic link sent. Check your inbox and continue into the Studio workspace.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="studio-panel rounded-[2rem] p-6 sm:p-8">
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
                ? "bg-[var(--studio-mint)] text-[#031117]"
                : "border border-[var(--studio-line)] text-[var(--studio-ink-soft)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--studio-ink)]">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            className="studio-input mt-2 rounded-2xl px-4 py-3"
            placeholder="you@company.com"
          />
        </div>

        {mode === "password" ? (
          <div>
            <label className="block text-sm font-medium text-[var(--studio-ink)]">Password</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="studio-input mt-2 rounded-2xl px-4 py-3"
              placeholder="Enter your password"
            />
          </div>
        ) : null}

        {message ? <div className="rounded-2xl border border-[var(--studio-line)] px-4 py-3 text-sm text-[var(--studio-ink-soft)]">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="studio-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
        >
          {loading ? "Continuing..." : mode === "magic" ? "Send magic link" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
