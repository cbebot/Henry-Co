import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { homeForRole, isStaffRole } from "@/lib/auth/roles";
import { STAFF_RECOVERY_ROUTE } from "@/lib/auth/routes";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { loginAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const care = getDivisionConfig("care");
const ACCENT = CARE_ACCENT;

export const metadata: Metadata = {
  title: `Staff Access | ${care.name}`,
  description:
    "Secure internal access for HenryCo Care owner, manager, rider, support, and staff dashboards.",
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

export default async function StaffAccessPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
    reason?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const auth = await getAuthenticatedProfile();

  const authRole = String(auth?.profile?.role || "").toLowerCase();
  const isFrozen = Boolean(auth?.profile?.is_frozen);
  const isDisabled = Boolean(auth?.profile?.deleted_at);

  if (isStaffRole(authRole) && !isFrozen && !isDisabled) {
    redirect(homeForRole(authRole));
  }

  const reason = String(params.reason || "").trim();
  const error = decodeText(params.error);
  const message = decodeText(params.message);
  const nextPath = String(params.next || "").trim();
  const systemMessage =
    reason === "reauth"
      ? "Your access role changed and the workspace needs a fresh sign-in."
      : reason === "frozen"
      ? "This account is currently frozen. Contact an owner for access review."
      : reason === "disabled"
      ? "This account has been deactivated. Contact an owner if access should be restored."
      : "";

  return (
    <main
      className="care-shell-bg min-h-screen overflow-hidden px-6 py-10 text-white"
      style={
        {
          "--accent": ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto grid min-h-[85vh] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05] dark:text-white/75">
            <ShieldCheck className="h-5 w-5 text-[color:var(--accent)]" />
            Internal workspace access
          </div>

          <div>
            <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-[84px]">
              Sign in to the
              <br />
              service operations workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/68 sm:text-xl">
              One restricted entry point for owners, managers, riders, support, and field staff,
              with role-aware routing, stronger session discipline, and cleaner internal separation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Owner command",
                text: "Pricing, finance, staff access, brand settings, reviews, and security oversight.",
              },
              {
                title: "Manager and support",
                text: "Daily queue control, booking supervision, support visibility, and service continuity handling.",
              },
              {
                title: "Rider and field staff",
                text: "Route-ready garment movement, service execution, and mobile-first operational clarity.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="text-lg font-semibold">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              Access note
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
              Dashboard access follows the live auth role metadata first. If an account has not
              been provisioned with a valid staff role yet, the workspace stops access instead of
              sending that user into the wrong dashboard.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white"
          >
            Back to public website
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="relative overflow-hidden rounded-[38px] border border-black/10 bg-white/80 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[color:var(--accent)]/12 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.05]">
              <Lock className="h-4 w-4" />
              Restricted staff access
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/65">
              Use your approved staff email and password to enter the correct role-based dashboard.
            </p>

            {systemMessage ? (
              <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-100">
                {systemMessage}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
                {error}
              </div>
            ) : null}

            <form action={loginAction} className="mt-6 grid gap-4">
              <input type="hidden" name="next" value={nextPath} />

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  Email address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="staff@henrycogroup.com"
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </div>

              <PendingSubmitButton
                label="Sign in"
                pendingLabel="Signing in..."
                icon={<ArrowRight className="h-4 w-4" />}
                className="mt-2 h-14 rounded-2xl px-6"
              />
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
              <span>Protected actions and dashboard access may be logged for accountability.</span>
              <Link
                href={STAFF_RECOVERY_ROUTE}
                className="font-semibold text-[color:var(--accent)] transition hover:opacity-80"
              >
                Recover account access
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
