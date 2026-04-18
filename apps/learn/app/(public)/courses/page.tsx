import { getCourseCatalog, getPublicAcademyData } from "@/lib/learn/data";
import { CourseCard, LearnEmptyState, LearnSectionIntro } from "@/components/learn/ui";
import { getSharedAuthUrl } from "@/lib/learn/links";
import Link from "next/link";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return { title: t("Course catalog") };
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const [locale, academy] = await Promise.all([getLearnPublicLocale(), getPublicAcademyData()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const courses = await getCourseCatalog({
    search: params.q,
    category: params.category,
    difficulty: params.difficulty,
  });

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker={t("Course catalog")}
        title={t("Find a program that fits your next step.")}
        body={t("Filter by topic or level, open any course for full details, then sign in with your HenryCo account to enroll. Your progress syncs automatically—you can always pick up where you left off.")}
      />

      <div className="learn-panel mt-8 rounded-[2rem] p-5 sm:p-6">
        <p className="text-sm font-semibold text-[var(--learn-ink)]">{t("New here?")}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--learn-ink-soft)]">
          {t("Create a free HenryCo account first—it takes a minute. Then return to any course and tap Start this course (or complete checkout if the program is paid).")}
        </p>
        <a
          href={getSharedAuthUrl("signup", "/courses")}
          className="learn-button-secondary mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          {t("Create account")}
        </a>
      </div>

      <form className="learn-panel mt-8 grid gap-4 rounded-[2rem] p-5 md:grid-cols-[1.4fr,1fr,1fr,auto]">
        <input name="q" defaultValue={params.q} placeholder={t("Search by title, skill, or tag")} className="learn-input rounded-2xl px-4 py-3" />
        <select name="category" defaultValue={params.category || ""} className="learn-select rounded-2xl px-4 py-3">
          <option value="">{t("All categories")}</option>
          {academy.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select name="difficulty" defaultValue={params.difficulty || ""} className="learn-select rounded-2xl px-4 py-3">
          <option value="">{t("All levels")}</option>
          <option value="beginner">{t("Beginner")}</option>
          <option value="intermediate">{t("Intermediate")}</option>
          <option value="advanced">{t("Advanced")}</option>
        </select>
        <button className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold" type="submit">{t("Search")}</button>
      </form>

      {courses.length === 0 ? (
        <div className="mt-10">
          <LearnEmptyState
            title={t("No courses match those filters")}
            body={t("Try a different keyword, category, or difficulty—or clear filters to see everything we publish right now.")}
            action={
              <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                {t("Reset catalog")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} locale={locale} />
          ))}
        </div>
      )}
    </main>
  );
}
