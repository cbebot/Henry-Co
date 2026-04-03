import { notFound } from "next/navigation";
import { CourseCard, LearnPanel } from "@/components/learn/ui";
import { getInstructorBySlug } from "@/lib/learn/data";

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getInstructorBySlug(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnPanel className="rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <p className="learn-kicker">Instructor spotlight</p>
        <h1 className="learn-heading mt-6 text-[3rem] text-[var(--learn-ink)] sm:text-[4rem]">{data.instructor.fullName}</h1>
        <p className="mt-3 text-lg text-[var(--learn-mint-soft)]">{data.instructor.title}</p>
        <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--learn-ink-soft)]">{data.instructor.bio}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {data.instructor.expertise.map((topic) => (
            <span key={topic} className="rounded-full border border-[var(--learn-line)] px-3 py-1 text-xs font-semibold text-[var(--learn-ink-soft)]">{topic}</span>
          ))}
        </div>
      </LearnPanel>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {data.courses.map((course) => (
          <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
        ))}
      </div>
    </main>
  );
}
