import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { getLearnPathsCopy } from "@henryco/i18n/server";
import { getPublicAcademyData } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";
import { PathCard } from "@/components/learn/ui";

export async function generateMetadata() {
  const locale = await getLearnPublicLocale();
  const copy = getLearnPathsCopy(locale);
  return { title: copy.meta.title };
}

export default async function PathsPage() {
  const [locale, academy] = await Promise.all([
    getLearnPublicLocale(),
    getPublicAcademyData(),
  ]);
  const copy = getLearnPathsCopy(locale);
  const pathItemCounts = new Map(
    academy.paths.map((path) => [
      path.id,
      academy.pathItems.filter((item) => item.pathId === path.id).length,
    ]),
  );

  const totalCourses = academy.pathItems.length;

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              {copy.hero.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {copy.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              {copy.hero.body}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {copy.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/certifications"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
              >
                {copy.hero.ctaSecondary}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: copy.aside.pathsLabel, value: String(academy.paths.length) },
              { label: copy.aside.coursesLabel, value: String(totalCourses) },
              { label: copy.aside.pacingLabel, value: copy.aside.pacingValue },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3 last:border-b-0"
              >
                <Layers className="h-3.5 w-3.5 text-[var(--learn-copper)]" aria-hidden />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
                  {item.label}
                </span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--learn-ink)]">
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-baseline gap-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
            {copy.openPaths.eyebrow}
          </p>
          <span className="h-px flex-1 bg-[var(--learn-line)]" />
        </div>
        {/* TODO i18n WAVE A — list view, PathCard renders Supabase-row title + summary.
            Skipped here per scope (list views beyond title). Detail page /paths/[slug]
            routes title/description/items via resolveLocalizedDynamicField. */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {academy.paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              courseCount={pathItemCounts.get(path.id) || 0}
              href={`/paths/${path.slug}`}
              locale={locale}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
