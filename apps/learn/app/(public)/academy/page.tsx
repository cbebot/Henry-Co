import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getAccountLearnUrl, getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return { title: t("How HenryCo Learn works") };
}

export default async function AcademyPage() {
  const [locale, academy] = await Promise.all([getLearnPublicLocale(), getPublicAcademyData()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker={t("How HenryCo Learn works")}
        title={t("From “interested” to “I finished”—in plain steps.")}
        body={t("You don’t need to be technical. Choose a program, sign in with your HenryCo account, learn in order, and—when the course includes it—pass a short assessment to unlock your certificate. Managers can also assign training; you’ll see both in one place.")}
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("1. Discover")}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t("Browse the catalog or a learning path. Each course page lists duration, difficulty, whether there’s a final quiz, and the score you need to pass.")}
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("2. Enroll & learn")}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t("Free courses open immediately; paid ones follow our checkout flow. Lessons unlock in sequence so you always know what comes next.")}
          </p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{t("3. Prove & keep")}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--learn-ink-soft)]">
            {t("Finish lessons and any required quiz to earn a certificate where offered. Download a copy anytime; share your verification code so others can confirm it’s real.")}
          </p>
        </LearnPanel>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{t("Categories")}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.categories.length}</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{t("Courses")}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.courses.length}</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{t("Paths")}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.paths.length}</p>
        </LearnPanel>
        <LearnPanel className="rounded-[2rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">{t("Instructors")}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">{academy.instructors.length}</p>
        </LearnPanel>
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
        <LearnPanel className="learn-mesh rounded-[2rem] p-7 sm:p-8">
          <p className="learn-kicker">{t("Your dashboard")}</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">
            {t("Keep learning and admin in the right place.")}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--learn-ink-soft)]">
            {t("The course room on HenryCo Learn is where you read lessons, submit quizzes, and download certificates. Your HenryCo account shows the big picture—active courses, saved picks, assignments, billing, and teaching status—in one calm overview.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={getSharedAuthUrl("signup", "/courses")} className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              {t("Create account")}
            </a>
            <a href={getAccountLearnUrl()} className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
              {t("Open Learn in account")}
            </a>
          </div>
        </LearnPanel>

        <LearnPanel className="rounded-[2rem]">
          <p className="learn-kicker">{t("Want to teach?")}</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--learn-ink)]">
            {t("We take instructor applications seriously.")}
          </h3>
          <p className="mt-4 text-sm leading-8 text-[var(--learn-ink-soft)]">
            {t("Share your background and a concrete course proposal. Our team reviews every submission; we may request changes or decline politely. Commercial terms, including any revenue share, are discussed only after approval.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/teach" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              {t("Apply to teach")}
            </Link>
            <Link href="/certifications" className="learn-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
              {t("Certificate programs")}
            </Link>
          </div>
        </LearnPanel>
      </div>
    </main>
  );
}
