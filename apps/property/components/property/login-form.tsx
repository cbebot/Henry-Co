"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function PropertyLoginForm({ nextPath = "/account" }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "magic">("sign-in");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("full_name") || "").trim();

    try {
      const supabase = getBrowserSupabase();

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) throw error;
        setMessage("Magic link sent. Check your inbox to continue into HenryCo Property.");
      } else if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
              role: "browser",
            },
          },
        });

        if (error) throw error;
        setMessage("Account created. Check your inbox if email confirmation is enabled, then continue.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Property login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="property-panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-wrap gap-3">
        {[
          ["sign-in", "Password"],
          ["sign-up", "Create account"],
          ["magic", "Magic link"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value as "sign-in" | "sign-up" | "magic")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === value
                ? "bg-[var(--property-accent)] text-white"
                : "border border-[var(--property-line)] text-[var(--property-ink-soft)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "sign-up" ? (
          <div>
            <label className="block text-sm font-medium text-[var(--property-ink)]">Full name</label>
            <input
              name="full_name"
              required
              className="property-input mt-2 rounded-2xl px-4 py-3"
              placeholder="Adaeze Okonkwo"
            />
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-[var(--property-ink)]">Email</label>
          <input
            name="email"
            type="email"
            required
            className="property-input mt-2 rounded-2xl px-4 py-3"
            placeholder="you@henrycogroup.com"
          />
        </div>

        {mode !== "magic" ? (
          <div>
            <label className="block text-sm font-medium text-[var(--property-ink)]">Password</label>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="property-input mt-2 rounded-2xl px-4 py-3"
              placeholder="Enter a strong password"
            />
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-[var(--property-line)] px-4 py-3 text-sm text-[var(--property-ink-soft)]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
        >
          {loading
            ? "Working..."
            : mode === "magic"
              ? "Send magic link"
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
        </button>
      </form>
    </div>
  );
}
