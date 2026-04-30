import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getPublicAcademyData } from "@/lib/learn/data";

export const metadata = { title: "Instructors - HenryCo Learn" };

export default async function InstructorsPage() {
  const academy = await getPublicAcademyData();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
              Instructors
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              Operators teaching what they run.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
              Each instructor is a working domain specialist. No filler avatars, no bought bios
              &mdash; just the people behind the trust layer.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/teach"
                className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Apply to teach
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
              >
                Browse the catalog
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { label: "Active instructors", value: String(academy.instructors.length) },
              { label: "Categories represented", value: String(academy.categories.length) },
              { label: "Verification", value: "Manual review, no bought bios" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-baseline gap-3 border-b border-[var(--learn-line)] py-3 last:border-b-0"
              >
                <Sparkles className="h-3.5 w-3.5 text-[var(--learn-copper)]" aria-hidden />
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
            Faculty
          </p>
          <span className="h-px flex-1 bg-[var(--learn-line)]" />
        </div>
        <ul className="mt-8 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
          {academy.instructors.map((instructor) => (
            <li
              key={instructor.id}
              className="grid gap-3 py-6 sm:grid-cols-[1fr,auto] sm:items-start sm:gap-8"
            >
              <div>
                <h3 className="text-base font-semibold tracking-tight text-[var(--learn-ink)]">
                  {instructor.fullName}
                </h3>
                <p className="mt-1 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                  {instructor.title}
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                  {instructor.bio}
                </p>
              </div>
              <Link
                href={`/instructors/${instructor.slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
              >
                View instructor
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
