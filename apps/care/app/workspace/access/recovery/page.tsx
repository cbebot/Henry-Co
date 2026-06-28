import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { BRAND_EMAIL_PLACEHOLDERS, getDivisionConfig } from "@henryco/config";
import { getCareSupportExtraCopy } from "@henryco/i18n";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { getCarePublicLocale } from "@/lib/locale-server";
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
  const locale = await getCarePublicLocale();
  const copy = getCareSupportExtraCopy(locale).recovery;
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
            {copy.badge}
          </div>

          <div>
            <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.05em] text-zinc-950 dark:text-white sm:text-6xl">
              {isSetupMode ? copy.titleSetup : copy.titleRecover}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-white/68">
              {isSetupMode ? copy.introSetup : copy.introRecover}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={KeyRound}
              title={intent === "invite" ? copy.cardSetupTitle : copy.cardRecoverTitle}
              text={intent === "invite" ? copy.cardSetupText : copy.cardRecoverText}
            />
            <InfoCard
              icon={LifeBuoy}
              title={copy.securityTitle}
              text={copy.securityText}
            />
          </div>

          <Link
            href={STAFF_LOGIN_ROUTE}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 dark:text-white/70 dark:hover:text-white"
          >
            {copy.backLink}
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
                  {auth?.user?.email || copy.fallbackAccount}
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                  {copy.createPasswordPrefix}{" "}
                  {intent === "invite" ? copy.createPasswordSetup : copy.createPasswordRecovery}.
                </div>
              </div>

              <input type="hidden" name="intent" value={intent || "recovery"} />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  {copy.newPasswordLabel}
                </span>
                <input
                  name="password"
                  type="password"
                  minLength={10}
                  required
                  autoComplete="new-password"
                  placeholder={copy.newPasswordPlaceholder}
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  {copy.confirmPasswordLabel}
                </span>
                <input
                  name="confirm_password"
                  type="password"
                  minLength={10}
                  required
                  autoComplete="new-password"
                  placeholder={copy.confirmPasswordPlaceholder}
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </label>

              <PendingSubmitButton
                label={copy.saveLabel}
                pendingLabel={copy.savePendingLabel}
                icon={<ArrowRight className="h-4 w-4" />}
                className="mt-2 h-14 rounded-2xl px-6"
              />
            </form>
          ) : (
            <form action={sendRecoveryLinkAction} className="grid gap-4">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)] dark:border-white/10 dark:bg-white/[0.05]">
                <Mail className="h-4 w-4" />
                {copy.emailBadge}
              </div>

              <div className="text-3xl font-bold tracking-[-0.03em] text-zinc-950 dark:text-white">
                {copy.sendHeading}
              </div>
              <p className="text-sm leading-7 text-zinc-600 dark:text-white/65">
                {copy.sendIntro}
              </p>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800 dark:text-white/85">
                  {copy.staffEmailLabel}
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={BRAND_EMAIL_PLACEHOLDERS.staff}
                  className="h-14 rounded-2xl border border-black/10 bg-white px-4 text-base font-medium text-zinc-900 shadow-sm outline-none transition focus:border-[color:var(--accent)]/50 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white md:text-sm"
                />
              </label>

              <PendingSubmitButton
                label={copy.sendLabel}
                pendingLabel={copy.sendPendingLabel}
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
