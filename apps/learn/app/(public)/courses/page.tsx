import { getCourseCatalog, getPublicAcademyData } from "@/lib/learn/data";
import { CourseCard, LearnEmptyState, LearnSectionIntro } from "@/components/learn/ui";
import { getSharedAuthUrl } from "@/lib/learn/links";
import Link from "next/link";

export const metadata = { title: "Courses - HenryCo Learn" };

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const academy = await getPublicAcademyData();
  const courses = await getCourseCatalog({
    search: params.q,
    category: params.category,
    difficulty: params.difficulty,
  });

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Course catalog"
        title="Find a program that fits your next step."
        body="Filter by topic or level, open any course for full details, then sign in with your HenryCo account to enroll. Your progress syncs automatically—you can always pick up where you left off."
      />

      <div className="learn-panel mt-8 rounded-[2rem] p-5 sm:p-6">
        <p className="text-sm font-semibold text-[var(--learn-ink)]">New here?</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--learn-ink-soft)]">
          Create a free HenryCo account first—it takes a minute. Then return to any course and tap <span className="font-medium text-[var(--learn-ink)]">Start this course</span> (or complete checkout if the program is paid).
        </p>
        <a
          href={getSharedAuthUrl("signup", "/courses")}
          className="learn-button-secondary mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Create account
        </a>
      </div>

      <form className="learn-panel mt-8 grid gap-4 rounded-[2rem] p-5 md:grid-cols-[1.4fr,1fr,1fr,auto]">
        <input name="q" defaultValue={params.q} placeholder="Search by title, skill, or tag" className="learn-input rounded-2xl px-4 py-3" />
        <select name="category" defaultValue={params.category || ""} className="learn-select rounded-2xl px-4 py-3">
          <option value="">All categories</option>
          {academy.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select name="difficulty" defaultValue={params.difficulty || ""} className="learn-select rounded-2xl px-4 py-3">
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold" type="submit">Search</button>
      </form>

      {courses.length === 0 ? (
        <div className="mt-10">
          <LearnEmptyState
            title="No courses match those filters"
            body="Try a different keyword, category, or difficulty—or clear filters to see everything we publish right now."
            action={
              <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                Reset catalog
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
          ))}
        </div>
      )}
    </main>
  );
}
