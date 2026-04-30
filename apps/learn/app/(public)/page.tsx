import Link from "next/link";
import { ChartNoAxesCombined, Sparkles, UsersRound } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { PublicSpotlight } from "@henryco/ui/public-shell";
import { CourseCard, LearnPanel, LearnSectionIntro, PathCard, QuickMetricStrip } from "@/components/learn/ui";
import { getLearnViewer } from "@/lib/learn/auth";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

function learnHeroFirstName(viewer: Awaited<ReturnType<typeof getLearnViewer>>) {
  if (!viewer.user) return null;
  const full = viewer.user.fullName?.trim();
  if (full) return full.split(/\s+/)[0] ?? null;
  const local = viewer.user.email?.split("@")[0]?.trim();
  return local || null;
}

export default async function HomePage() {
  const [locale, academy, viewer] = await Promise.all([
    getLearnPublicLocale(),
    getPublicAcademyData(),
    getLearnViewer(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const heroFirstName = learnHeroFirstName(viewer);
  const featuredCourses = academy.courses.filter((item) => item.featured).slice(0, 4);
  const featuredPaths = academy.paths.filter((item) => item.featured).slice(0, 3);
  const pathItemCounts = new Map(
    academy.paths.map((path) => [
      path.id,
      academy.pathItems.filter((item) => item.pathId === path.id).length,
    ])
  );

  return (
    <main>
      <section className="learn-hero">
        <div className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 sm:py-16 xl:px-10 xl:py-20">
          <div className="learn-panel learn-mesh rounded-[2rem] p-5 sm:rounded-[2.4rem] sm:p-10 xl:rounded-[2.8rem] xl:p-14">
            <p className="learn-kicker">HenryCo Learn</p>
            {viewer.user ? (
              <p className="mt-4 text-sm font-semibold tracking-tight text-[var(--learn-ink-soft)]">
                {t("Welcome back")}
                {heroFirstName ? `, ${heroFirstName}` : ""}.
              </p>
            ) : null}
            <h1 className={`learn-display max-w-3xl text-balance text-[var(--learn-ink)] ${viewer.user ? "mt-4 sm:mt-5" : "mt-5 sm:mt-6"}`}>
              {t("Skills that stick. Proof that travels.")}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-[var(--learn-ink-soft)] sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
              {t(
                "Pick a course, move through lessons in order, track progress in your HenryCo account, and earn a certificate others can verify online. Built for busy adults who want clarity, not jargon.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8 sm:gap-3">
              <Link
                href="/courses"
                className="learn-button-primary rounded-full px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--learn-mint-soft)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f1d] active:translate-y-[0.5px] sm:px-5 sm:py-3"
              >
                {t("Browse courses")}
              </Link>
              {viewer.user ? (
                <a
                  href={getAccountLearnUrl("active")}
                  className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--learn-mint-soft)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f1d] active:translate-y-[0.5px] sm:px-5 sm:py-3"
                >
                  {t("Continue learning")}
                </a>
              ) : (
                <a
                  href={getSharedAuthUrl("signup", "/courses")}
                  className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--learn-mint-soft)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f1d] active:translate-y-[0.5px] sm:px-5 sm:py-3"
                >
                  {t("Create free account")}
                </a>
              )}
              <Link
                href="/academy"
                className="learn-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--learn-mint-soft)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1f1d] active:translate-y-[0.5px] sm:px-5 sm:py-3"
              >
                {t("How it works")}
              </Link>
            </div>
            <div className="mt-8 sm:mt-10">
              <QuickMetricStrip
                items={[
                  { label: t("Programs open now"), value: String(academy.courses.length) },
                  { label: t("Guided paths"), value: String(academy.paths.length) },
                  { label: t("Subject areas"), value: String(academy.categories.length) },
                  { label: t("Learner reviews"), value: String(academy.reviews.length) },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <LearnSectionIntro
          kicker={t("Start here")}
          title={t("Featured programs our team highlights right now.")}
          body={t("Each card opens the full course page: what you’ll learn, how long it takes, whether there’s an assessment, and how to enroll.")}
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} locale={locale} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            {t("See all courses")}
          </Link>
          <a href={getAccountLearnUrl("active")} className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            {t("Continue in my account")}
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <PublicSpotlight
          tone="contrast"
          eyebrow={t("How learning runs here")}
          title={t("Structured lessons, fair assessments, real verification.")}
          body={t(
            "Sign in once. Enrollments, progress, certificates, billing, and teaching applications all live on the same HenryCo profile — no duplicate logins, no parallel inboxes.",
          )}
          aside={
            <ul className="space-y-5">
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">{t("Teams & assignments")}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t("Some courses are assigned inside HenryCo. Team programs appear in your account alongside anything you chose yourself.")}
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">{t("What “done” means")}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t("Completion follows each course’s rules — usually all lessons, then a passing quiz where applicable. Status shows plainly in the learning room.")}
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">{t("Verification anyone can check")}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t("Eligible courses issue a certificate with a code anyone can verify online — useful for employers, partners, or your own records.")}
                </p>
              </li>
            </ul>
          }
        />
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <LearnSectionIntro
          kicker={t("Learning paths")}
          title={t("Follow a sequence when one course isn’t enough.")}
          body={t("Paths group related courses so you build a capability step by step—ideal when you’re onboarding to a role or deepening a specialty.")}
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featuredPaths.map((path) => (
            <PathCard key={path.id} path={path} courseCount={pathItemCounts.get(path.id) || 0} href={`/paths/${path.slug}`} locale={locale} />
          ))}
        </div>
        <div className="mt-8">
          <Link href="/paths" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            {t("Explore every path")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 xl:px-10">
        <div className="grid gap-8 xl:grid-cols-[1.05fr,0.95fr] xl:items-start">
          <LearnPanel className="learn-mesh rounded-[2.4rem] p-7 sm:p-8">
            <p className="learn-kicker">{t("Teach with HenryCo")}</p>
            <h2 className="learn-heading mt-4 text-[2.1rem] text-[var(--learn-ink)] sm:text-[2.6rem]">
              {t("Apply if you can teach with depth, structure, and professionalism.")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--learn-ink-soft)]">
              {t("We review every application by hand. Approval is not automatic. Strong candidates move through identity checks, quality expectations, and onboarding—not a self-serve creator rush.")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/teach" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                {t("Start application")}
              </Link>
              <Link href="/trust" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
                {t("Standards & trust")}
              </Link>
            </div>
          </LearnPanel>

          <ul className="divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
            <li className="flex gap-4 py-5">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[var(--learn-copper)]" />
              <div>
                <h3 className="text-base font-semibold tracking-tight text-[var(--learn-ink)]">{t("Quality bar")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--learn-ink-soft)]">
                  {t("We look for real subject expertise, respectful delivery, and outlines learners can actually finish — not hype or recycled slides.")}
                </p>
              </div>
            </li>
            <li className="flex gap-4 py-5">
              <UsersRound className="mt-1 h-5 w-5 shrink-0 text-[var(--learn-copper)]" />
              <div>
                <h3 className="text-base font-semibold tracking-tight text-[var(--learn-ink)]">{t("Aligned with HenryCo")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--learn-ink-soft)]">
                  {t("Topics that fit our ecosystem — operations, customer experience, digital skills, partner enablement — get the closest match with our learners' needs.")}
                </p>
              </div>
            </li>
            <li className="flex gap-4 py-5">
              <ChartNoAxesCombined className="mt-1 h-5 w-5 shrink-0 text-[var(--learn-mint-soft)]" />
              <div>
                <h3 className="text-base font-semibold tracking-tight text-[var(--learn-ink)]">{t("Why HenryCo Learn exists")}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--learn-ink-soft)]">
                  {t("We invest in education so customers, partners, and staff share the same standards — and so capable people can prove what they know.")}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
