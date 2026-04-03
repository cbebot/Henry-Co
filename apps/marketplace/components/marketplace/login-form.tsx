"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") || "/account", [searchParams]);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="market-paper mx-auto max-w-lg rounded-[2rem] p-8"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");
        const fullName = String(formData.get("full_name") || "").trim();

        startTransition(async () => {
          setError(null);
          const supabase = getBrowserSupabase();
          const result =
            mode === "sign-in"
              ? await supabase.auth.signInWithPassword({ email, password })
              : await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      full_name: fullName || email.split("@")[0],
                    },
                  },
                });

          if (result.error) {
            setError(result.error.message);
            return;
          }

          router.push(next);
          router.refresh();
        });
      }}
    >
      <p className="market-kicker">{mode === "sign-in" ? "Sign in" : "Create account"}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
        Continue to HenryCo Marketplace
      </h1>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
        Buyers get premium order history, tracked payments, disputes, notifications, and seller applications inside one shared HenryCo account.
      </p>

      <div className="mt-6 space-y-4">
        {mode === "sign-up" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--market-ink)]">Full name</span>
            <input
              name="full_name"
              className="market-input rounded-2xl px-4 py-3"
              placeholder="Onah Chukwuemeka Henry"
            />
          </label>
        ) : null}
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--market-ink)]">Email</span>
          <input
            name="email"
            type="email"
            required
            className="market-input rounded-2xl px-4 py-3"
            placeholder="buyer@henrycogroup.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--market-ink)]">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="market-input rounded-2xl px-4 py-3"
            placeholder="********"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3 text-sm text-[var(--market-claret)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="market-button-primary mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => setMode((value) => (value === "sign-in" ? "sign-up" : "sign-in"))}
        className="mt-4 w-full text-sm font-semibold text-[var(--market-brass)]"
      >
        {mode === "sign-in" ? "Need a new account? Create one" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
