import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  MessageCircle,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { getJobsCopy } from "@henryco/i18n";
import { BRAND_EMAILS } from "@henryco/config";
import { PublicShell } from "@/components/public-shell";
import { getSharedAccountLoginUrl, getSharedAccountSignupUrl } from "@/lib/account";
import { getJobsViewer } from "@/lib/auth";
import { getJobsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getJobsPublicLocale();
  const copy = getJobsCopy(locale).hirePage;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
  };
}

export default async function HirePage() {
  const [viewer, locale] = await Promise.all([
    getJobsViewer(),
    getJobsPublicLocale(),
  ]);
  const copy = getJobsCopy(locale).hirePage;

  const startUrl = viewer.user
    ? "/employer/company"
    : getSharedAccountSignupUrl("/employer/company");
  const loginUrl = getSharedAccountLoginUrl("/employer/company");

  const flow = [
    {
      step: "01",
      title: copy.step01Title,
      body: copy.step01Body,
      icon: Building2,
    },
    {
      step: "02",
      title: copy.step02Title,
      body: copy.step02Body,
      icon: ClipboardCheck,
    },
    {
      step: "03",
      title: copy.step03Title,
      body: copy.step03Body,
      icon: Users,
    },
  ] as const;

  const features = [
    {
      icon: Shield,
      label: copy.featureVerificationLabel,
      value: copy.featureVerificationValue,
    },
    {
      icon: MessageCircle,
      label: copy.featurePostReviewLabel,
      value: copy.featurePostReviewValue,
    },
    {
      icon: Sparkles,
      label: copy.featurePipelineLabel,
      value: copy.featurePipelineValue,
    },
  ];

  return (
    <PublicShell
      primaryCta={{
        label: viewer.user ? "Open employer workspace" : "Create employer account",
        href: startUrl,
      }}
      secondaryCta={{ label: copy.ctaBrowseCandidates, href: "/talent" }}
    >
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="jobs-kicker">{copy.eyebrow}</p>
              <h1 className="mt-4 jobs-display max-w-3xl text-balance">
                {copy.heroTitle}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--jobs-muted)]">
                {copy.heroBody}
              </p>
              <p className="mt-4 inline-flex max-w-2xl items-start gap-2 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-[13.5px] leading-7 text-[var(--jobs-muted)] dark:border-white/10 dark:bg-white/[0.03]">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[var(--jobs-accent)]" aria-hidden />
                <span>{copy.shieldNotice}</span>
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={startUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
                >
                  {viewer.user ? copy.ctaSignedIn : copy.ctaSignedOut}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!viewer.user ? (
                  <Link
                    href={loginUrl}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                  >
                    {copy.ctaLogin}
                  </Link>
                ) : null}
              </div>
            </div>
            <ul className="grid gap-3 text-sm">
              {features.map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-3 border-b border-black/10 py-3 last:border-b-0 dark:border-white/10"
                >
                  <Icon className="h-3.5 w-3.5 text-[var(--jobs-accent)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-muted)]">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <p className="jobs-kicker">{copy.howKicker}</p>
          <ol className="mt-6 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
            {flow.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className="grid gap-3 py-6 sm:grid-cols-[auto,1fr,auto] sm:items-start sm:gap-8"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--jobs-accent)]">
                    {copy.stepPrefix} {item.step}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                      {item.body}
                    </p>
                  </div>
                  <Icon className="hidden h-5 w-5 text-[var(--jobs-muted)] sm:block" aria-hidden />
                </li>
              );
            })}
          </ol>
        </section>

        <section className="grid gap-12 lg:grid-cols-2 lg:divide-x lg:divide-black/10 dark:lg:divide-white/10">
          <div>
            <p className="jobs-kicker">{copy.verificationKicker}</p>
            <h2 className="mt-3 jobs-heading max-w-xl text-balance">
              {copy.verificationTitle}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--jobs-muted)]">
              {copy.verificationBody}
            </p>
          </div>
          <div className="lg:pl-12">
            <p className="jobs-kicker">{copy.moderationKicker}</p>
            <h2 className="mt-3 jobs-heading max-w-xl text-balance">
              {copy.moderationTitle}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--jobs-muted)]">
              {copy.moderationBody}
            </p>
          </div>
        </section>

        <section className="border-t border-black/10 pt-10 dark:border-white/10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="jobs-kicker">{copy.qualityKicker}</p>
              <h2 className="mt-3 jobs-heading max-w-2xl text-balance">
                {copy.qualityTitle}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">
                {copy.qualityBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={startUrl}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--jobs-brass)] px-6 py-3 text-sm font-semibold text-[var(--jobs-paper)] transition hover:-translate-y-0.5"
              >
                {viewer.user ? copy.ctaWorkspace : copy.ctaGetStarted}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trust"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-[var(--jobs-accent)]/40 dark:border-white/15 dark:text-white"
              >
                {copy.ctaTrustLink}
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
              >
                {copy.ctaFaqLink}
              </Link>
            </div>
          </div>
          <p className="mt-8 text-sm text-[var(--jobs-muted)]">
            {copy.questionsPrefix}{" "}
            <a
              href={`mailto:${BRAND_EMAILS.jobs}`}
              className="font-semibold text-[var(--jobs-accent)] underline-offset-4 hover:underline"
            >
              {BRAND_EMAILS.jobs}
            </a>
          </p>
        </section>
      </div>
    </PublicShell>
  );
}
