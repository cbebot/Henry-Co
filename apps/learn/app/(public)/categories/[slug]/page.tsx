import { notFound } from "next/navigation";
import { CourseCard, LearnSectionIntro } from "@/components/learn/ui";
import { getCategoryBySlug } from "@/lib/learn/data";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro kicker={data.category.name} title={data.category.heroCopy} body={data.category.description} />
      <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {data.courses.map((course) => (
          <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
        ))}
      </div>
    </main>
  );
}
