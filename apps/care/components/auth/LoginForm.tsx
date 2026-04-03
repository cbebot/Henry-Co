"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  return (
    <div className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
        <ShieldCheck className="h-4 w-4 text-[color:var(--accent)]" />
        Staff access
      </div>

      <h2 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
        Sign in to Care operations
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
        Use your staff email and password. Your role controls which internal dashboard
        opens after login.
      </p>

      <form className="mt-7 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
            Email
          </span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
            <input
              type="email"
              placeholder="you@henrycogroup.com"
              autoComplete="email"
              required
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-12 pr-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            />
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
            Password
          </span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="h-14 w-full rounded-2xl border border-black/10 bg-white px-12 pr-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            />
          </div>
        </label>

        <button
          type="submit"
          className="care-button-primary mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/60">
        Live dashboard access follows the auth role metadata first. The profile row remains a
        mirror where the current database policy allows it.
      </div>
    </div>
  );
}
