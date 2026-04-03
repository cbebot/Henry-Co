import { getCourseCatalog, getPublicAcademyData } from "@/lib/learn/data";
import { CourseCard, LearnSectionIntro } from "@/components/learn/ui";

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
        kicker="Course Catalog"
        title="Find the right program without sorting through template-LMS clutter."
        body="Search by program focus, filter by category or difficulty, and move directly into a course detail experience backed by live academy records."
      />

      <form className="learn-panel mt-8 grid gap-4 rounded-[2rem] p-5 md:grid-cols-[1.4fr,1fr,1fr,auto]">
        <input name="q" defaultValue={params.q} placeholder="Search courses, skills, or tags" className="learn-input rounded-2xl px-4 py-3" />
        <select name="category" defaultValue={params.category || ""} className="learn-select rounded-2xl px-4 py-3">
          <option value="">All categories</option>
          {academy.categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select name="difficulty" defaultValue={params.difficulty || ""} className="learn-select rounded-2xl px-4 py-3">
          <option value="">All difficulty levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold" type="submit">Apply filters</button>
      </form>

      <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
        ))}
      </div>
    </main>
  );
}
