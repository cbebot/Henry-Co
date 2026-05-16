import Link from "next/link";
import { ArrowRight, BadgeCheck, KeySquare, ShieldCheck } from "lucide-react";
import { getLearnTrustCopy } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const copy = getLearnTrustCopy(locale);
  return { title: copy.meta.title };
}

export default async function TrustPage() {
  const locale = await getLearnPublicLocale();
  const copy = getLearnTrustCopy(locale);

  const pillars = [
    {
      icon: ShieldCheck,
      title: copy.pillars.enrollmentTitle,
      body: copy.pillars.enrollmentBody,
    },
    {
      icon: KeySquare,
      title: copy.pillars.internalTitle,
      body: copy.pillars.internalBody,
    },
    {
      icon: BadgeCheck,
      title: copy.pillars.certificatesTitle,
      body: copy.pillars.certificatesBody,
    },
  ] as const;

  const asideItems = [
    { label: copy.hero.asideRecordsLabel, value: copy.hero.asideRecordsValue },
    { label: copy.hero.asideAccessLabel, value: copy.hero.asideAccessValue },
    { label: copy.hero.asideCredentialsLabel, value: copy.hero.asideCredentialsValue },
  ];

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {copy.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              {copy.hero.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="learn-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {copy.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/certifications/verify"
                className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {copy.hero.ctaSecondary}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {asideItems.map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3 last:border-b-0"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {item.label}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
          {copy.pillars.sectionEyebrow}
        </p>
        <ul className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--learn-line)]">
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                <Icon className="h-5 w-5 text-[var(--learn-copper)]" aria-hidden />
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-16 border-t border-[var(--learn-line)] pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
              {copy.footer.eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
              {copy.footer.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--learn-ink-soft)]">
              {copy.footer.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/certifications/verify"
              className="learn-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {copy.footer.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/certifications"
              className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              {copy.footer.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
