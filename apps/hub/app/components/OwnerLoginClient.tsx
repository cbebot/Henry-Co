"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";
import { LockKeyhole, Mail } from "lucide-react";

export default function OwnerLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) return null;

    const cookieDomain =
      typeof window === "undefined" ? undefined : getSharedCookieDomain(window.location.hostname);

    return createBrowserClient(
      url,
      anon,
      cookieDomain
        ? {
            cookieOptions: {
              domain: cookieDomain,
              path: "/",
              sameSite: "lax",
              secure: true,
            },
          }
        : undefined
    );
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error("Supabase environment variables are missing.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      await supabase.auth.getSession();

      router.refresh();
      window.location.assign("/owner");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-md rounded-[32px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="text-xs uppercase tracking-[0.2em] text-white/45">
          Owner access
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Sign in to the Henry &amp; Co. owner dashboard
        </h1>

        <p className="mt-3 text-sm leading-7 text-white/64">
          This area manages company settings, pages, leadership records, and divisions.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <div className="mb-2 text-sm text-white/80">Email</div>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4">
              <Mail className="h-4 w-4 text-white/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                placeholder="owner@yourcompany.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="block">
            <div className="mb-2 text-sm text-white/80">Password</div>
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4">
              <LockKeyhole className="h-4 w-4 text-white/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#C9A227] text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
