import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CourseCard } from "@/components/learn/ui";
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
      <nav className="text-sm">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          All courses
        </Link>
      </nav>

      <section className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              Category · {data.category.name}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {data.category.heroCopy}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              {data.category.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Browse all courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/paths"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
              >
                Explore learning paths
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                Active courses
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {data.courses.length}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                Enrollment
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                One HenryCo account
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3 last:border-b-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                Records
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                Server-side, verifiable
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--learn-line)] pb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
            Courses in {data.category.name}
          </p>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {data.courses.length} listed
          </span>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
