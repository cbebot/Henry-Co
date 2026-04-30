import Link from "next/link";
import { ArrowRight, BadgeCheck, Compass, GraduationCap } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return { title: t("How HenryCo Learn works") };
}

export default async function AcademyPage() {
  const [locale, academy] = await Promise.all([
    getLearnPublicLocale(),
    getPublicAcademyData(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const flow = [
    {
      icon: Compass,
      step: "01",
      title: t("Discover"),
      body: t(
        "Browse the catalog or a learning path. Each course page lists duration, difficulty, whether there’s a final quiz, and the score you need to pass.",
      ),
    },
    {
      icon: GraduationCap,
      step: "02",
      title: t("Enroll & learn"),
      body: t(
        "Free courses open immediately; paid ones follow our checkout flow. Lessons unlock in sequence so you always know what comes next.",
      ),
    },
    {
      icon: BadgeCheck,
      step: "03",
      title: t("Prove & keep"),
      body: t(
        "Finish lessons and any required quiz to earn a certificate where offered. Download a copy anytime; share your verification code so others can confirm it’s real.",
      ),
    },
  ] as const;

  const stats = [
    { label: t("Categories"), value: String(academy.categories.length) },
    { label: t("Courses"), value: String(academy.courses.length) },
    { label: t("Paths"), value: String(academy.paths.length) },
    { label: t("Instructors"), value: String(academy.instructors.length) },
  ];

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              {t("How HenryCo Learn works")}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {t("From interested to finished, in plain steps.")}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              {t(
                "Choose a program, sign in, learn in order, and (where the course includes it) pass a short assessment to unlock your certificate. Assigned training from managers appears in the same place.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={getSharedAuthUrl("signup", "/courses")}
                className="learn-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {t("Create account")}
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/courses"
                className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {t("Browse courses")}
              </Link>
              <Link
                href="/paths"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
              >
                {t("Explore paths")}
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--learn-line)] py-5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {stat.label}
                </dt>
                <dd className="text-2xl font-semibold tracking-tight text-[var(--learn-ink)] sm:text-[1.7rem]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
          {t("Three steps")}
        </p>
        <ol className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--learn-line)]">
          {flow.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.step} className={i > 0 ? "lg:pl-10" : ""}>
                <div className="flex items-baseline gap-3">
                  <Icon className="h-5 w-5 text-[var(--learn-copper)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-14 grid gap-12 xl:grid-cols-[1.05fr,0.95fr] xl:divide-x xl:divide-[var(--learn-line)]">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
            {t("Your dashboard")}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
            {t("Keep learning and admin in the right place.")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t(
              "The course room on HenryCo Learn is where you read lessons, submit quizzes, and download certificates. Your HenryCo account shows the big picture — active courses, saved picks, assignments, billing, and teaching status — in one calm overview.",
            )}
          </p>
          <a
            href={getAccountLearnUrl()}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
          >
            {t("Open Learn in account")}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="xl:pl-12">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
            {t("Want to teach?")}
          </p>
          <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.85rem]">
            {t("We take instructor applications seriously.")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t(
              "Share your background and a concrete course proposal. Our team reviews every submission; we may request changes or decline politely. Commercial terms, including any revenue share, are discussed only after approval.",
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/teach"
              className="learn-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {t("Apply to teach")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/certifications"
              className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
            >
              {t("Certificate programs")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
