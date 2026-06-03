import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { resolveLocalizedDynamicField, translateSurfaceLabel } from "@henryco/i18n/server";
import { CourseCard } from "@/components/learn/ui";
import { getInstructorBySlug } from "@/lib/learn/data";
import { getLearnPublicLocale } from "@/lib/locale-server";

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getInstructorBySlug(slug);
  if (!data) notFound();

  const locale = await getLearnPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  // WAVE A — translate Supabase-row-driven text via the cached DeepL pipeline.
  const machineTranslate = locale !== "en";
  const instructorRecord = data.instructor as unknown as Record<string, unknown>;
  const [instructorFullName, instructorTitle, instructorBio] = await Promise.all([
    resolveLocalizedDynamicField({
      record: instructorRecord,
      field: "fullName",
      locale,
      fallback: data.instructor.fullName ?? "",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: instructorRecord,
      field: "title",
      locale,
      fallback: data.instructor.title ?? "",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: instructorRecord,
      field: "bio",
      locale,
      fallback: data.instructor.bio ?? "",
      machineTranslate,
    }),
  ]);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <nav className="text-sm">
        <Link
          href="/instructors"
          className="inline-flex items-center gap-1 font-semibold text-[var(--learn-mint-soft)] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("All instructors")}
        </Link>
      </nav>

      <section className="mt-8">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--learn-mint-soft)]">
          {t("Instructor spotlight")}
        </p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
          {instructorFullName || data.instructor.fullName}
        </h1>
        <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
          {instructorTitle || data.instructor.title}
        </p>
        <p className="mt-6 max-w-3xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)]">
          {instructorBio || data.instructor.bio}
        </p>
        {data.instructor.expertise.length > 0 ? (
          <div className="mt-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
              {t("Expertise")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.instructor.expertise.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-[var(--learn-line)] bg-[color:var(--home-surface-04)] px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--learn-ink-soft)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--learn-line)] pb-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
            {t("Courses by this instructor")}
          </p>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-ink-soft)]">
            {data.courses.length} {t("active")}
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
