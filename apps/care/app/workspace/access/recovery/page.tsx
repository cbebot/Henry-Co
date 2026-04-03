import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { STAFF_LOGIN_ROUTE } from "@/lib/auth/routes";
import {
  completeRecoveryPasswordAction,
  sendRecoveryLinkAction,
} from "@/app/login/actions";

export const dynamic = "force-dynamic";

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: `Account Recovery | ${care.name}`,
  description: "Recover or finish setting up restricted HenryCo Care workspace access.",
  robots: {
    index: false,
    follow: false,
  },
};

function decodeText(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function StaffRecoveryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    mode?: string;
    intent?: string;
    message?: string;
    error?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const auth = await getAuthenticatedProfile();
  const mode = String(params.mode || "").trim().toLowerCase();
  const intent = String(params.intent || "").trim().toLowerCase();
  const message = decodeText(params.message);
  const error = decodeText(params.error);
  const isSetupMode = mode === "set-password" && Boolean(auth?.user);

  return (
    <main className="care-shell-bg min-h-screen px-6 py-10 text-white">
      <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75">
            <ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" />
            Restricted access recovery
          </div>

          <div>
            <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.05em] text-zinc-950 dark:text-white sm:text-6xl">
              {isSetupMode ? "Set a secure workspace password." : "Recover staff account access."}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-white/68">
              {isSetupMode
                ? "The verification link is active. Set a new password now and the workspace will route you into the correct role dashboard."
                : "Use your approved staff email to receive a secure recovery link. Owners can also generate setup links directly from staff management."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={KeyRound}
              title={intent === "invite" ? "First-time setup" : "Password recovery"}
              text={
                intent === "invite"
                  ? "New staff accounts are activated through a secure setup link and land inside the correct dashboard after password creation."
                  : "Recovery links re-establish the session first, then allow a direct password update without sending users through the wrong workspace."
              }
            />
            <InfoCard
              icon={LifeBuoy}
              title="Security posture"
              text="Access checks remain role-aware and protected by live auth metadata, not by a public route alone."
            />
          </div>

          <Link
            href={STAFF_LOGIN_ROUTE}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white"
          >
            Back to staff access
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="rounded-[38px] border border-black/10 bg-white/80 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] sm:p-8">
          {message ? (
            <div className="mb-5 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
              {error}
            </div>
          ) : null}

          {isSetupMode ? (
            <form action={completeRecoveryPasswordAction} className="grid gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {auth?.user?.email || "Staff account"}
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                  Create a new password to finish {intent === "invite" ? "staff setup" : "account recovery"}.
                </div>
              </div>

              <input type="hidden" name="intent" value={intent || "recovery"} />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  New password
                </span>
                <input
                  name="password"
                  type="password"
                  minLength={10}
                  required
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  Confirm password
                </span>
                <input
                  name="confirm_password"
                  type="password"
                  minLength={10}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat the new password"
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </label>

              <PendingSubmitButton
                label="Save password and continue"
                pendingLabel="Saving password"
                icon={<ArrowRight className="h-4 w-4" />}
                className="mt-2 h-14 rounded-2xl px-6"
              />
            </form>
          ) : (
            <form action={sendRecoveryLinkAction} className="grid gap-4">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.05]">
                <Mail className="h-4 w-4" />
                Recovery email
              </div>

              <div className="text-3xl font-bold tracking-[-0.03em] text-zinc-950 dark:text-white">
                Send a secure recovery link
              </div>
              <p className="text-sm leading-7 text-zinc-600 dark:text-white/65">
                If the email belongs to a provisioned staff account, HenryCo Care will prepare a recovery message and queue it for dispatch.
              </p>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  Staff email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="staff@henrycogroup.com"
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </label>

              <PendingSubmitButton
                label="Send recovery link"
                pendingLabel="Sending recovery link"
                icon={<ArrowRight className="h-4 w-4" />}
                className="mt-2 h-14 rounded-2xl px-6"
              />
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-5 w-5 text-[color:var(--accent)]" />
      </div>
      <div className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">{text}</p>
    </div>
  );
}
