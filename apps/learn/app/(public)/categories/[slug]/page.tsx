import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getLearnCategoriesCopy } from "@henryco/i18n/server";
import { CourseCard } from "@/components/learn/ui";
import { getCategoryBySlug } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [data, locale] = await Promise.all([getCategoryBySlug(slug), getLearnPublicLocale()]);
  if (!data) return {};
  const copy = getLearnCategoriesCopy(locale);
  const categoryName = data.category.name;
  return {
    title: copy.meta.titleTemplate.replace("{category}", categoryName),
    description: copy.meta.descriptionTemplate.replace("{category}", categoryName),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, locale] = await Promise.all([getCategoryBySlug(slug), getLearnPublicLocale()]);
  if (!data) notFound();

  const copy = getLearnCategoriesCopy(locale);
  const categoryName = data.category.name;
  const courseCount = data.courses.length;

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <nav className="text-sm">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.breadcrumb.backToCourses}
        </Link>
      </nav>

      <section className="mt-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              {copy.hero.eyebrowTemplate.replace("{category}", categoryName)}
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
                {copy.hero.ctaBrowseAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/paths"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
              >
                {copy.hero.ctaExplorePaths}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {copy.stats.activeCoursesLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {courseCount}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {copy.stats.enrollmentLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {copy.stats.enrollmentValue}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3 last:border-b-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                {copy.stats.recordsLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                {copy.stats.recordsValue}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--learn-line)] pb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
            {copy.grid.eyebrowTemplate.replace("{category}", categoryName)}
          </p>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {copy.grid.countTemplate.replace("{count}", String(courseCount))}
          </span>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((course) => (
            <CourseCard key={course.id} course={course} href={`/courses/${course.slug}`} locale={locale} />
          ))}
        </div>
      </section>
    </main>
  );
}
