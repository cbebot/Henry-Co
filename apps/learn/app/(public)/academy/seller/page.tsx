import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createDivisionMetadata } from "@henryco/config";
import { getSellerAcademyCopy } from "@henryco/i18n";
import { SellerTierBadge } from "@henryco/ui";
import { getSellerAcademyTrack } from "@/lib/learn/data";
import { CourseCard, LearnEmptyState, LearnSectionIntro } from "@/components/learn/ui";
import { getSharedAuthUrl } from "@/lib/learn/links";
import { getLearnPublicLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLearnPublicLocale();
  const copy = getSellerAcademyCopy(locale);
  return createDivisionMetadata("learn", {
    title: copy.track.eyebrow,
    description: copy.metadata.description,
    path: "/academy/seller",
  });
}

const DIFFICULTY_TO_LEVEL: Record<string, "foundational" | "intermediate" | "advanced"> = {
  beginner: "foundational",
  intermediate: "intermediate",
  advanced: "advanced",
};

export default async function SellerAcademyPage() {
  const locale = await getLearnPublicLocale();
  const copy = getSellerAcademyCopy(locale);
  const { courses } = await getSellerAcademyTrack();

  const steps = [
    copy.steps.learn,
    copy.steps.sell,
    copy.steps.earn,
  ];

  const tierPreview: Array<{ tier: "bronze" | "silver" | "gold"; label: string; tooltip: string }> = [
    { tier: "bronze", label: copy.tierNames.bronze, tooltip: copy.badge.tooltip.bronze },
    { tier: "silver", label: copy.tierNames.silver, tooltip: copy.badge.tooltip.silver },
    { tier: "gold", label: copy.tierNames.gold, tooltip: copy.badge.tooltip.gold },
  ];

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro kicker={copy.track.eyebrow} title={copy.track.title} body={copy.track.body} />

      {/* Tiers you can earn — built from locked design-system tokens, none-safe. */}
      <div className="mt-7 flex flex-wrap items-center gap-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
          {copy.badge.ariaPrefix}
        </span>
        {tierPreview.map((item) => (
          <SellerTierBadge key={item.tier} tier={item.tier} label={item.label} tooltip={item.tooltip} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={getSharedAuthUrl("signup", "/academy/seller")}
          className="learn-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          {copy.courses.enrollCta}
          <ArrowRight className="h-4 w-4" />
        </a>
        <Link
          href="/courses"
          className="learn-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          {copy.courses.viewCta}
        </Link>
      </div>

      {/* How it works */}
      <section className="mt-14">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-mint-soft)]">
          {copy.steps.eyebrow}
        </p>
        <ol className="mt-8 grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--learn-line)]">
          {steps.map((step, i) => (
            <li key={step.title} className={i > 0 ? "lg:pl-10" : ""}>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-mint-soft)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--learn-ink)]">{step.title}</h3>
              <p className="hc-font-reading mt-2 text-pretty text-sm leading-7 text-[var(--learn-ink-soft)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The track */}
      <section className="mt-14">
        <LearnSectionIntro kicker={copy.courses.heading} title={copy.courses.heading} body={copy.courses.subheading} />
        {courses.length === 0 ? (
          <div className="mt-8">
            <LearnEmptyState
              title={copy.courses.empty}
              body={copy.track.body}
              action={
                <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
                  {copy.courses.viewCta}
                </Link>
              }
            />
          </div>
        ) : (
          <ol className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => {
              const level = DIFFICULTY_TO_LEVEL[course.difficulty];
              return (
                <li key={course.id} className="flex flex-col gap-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
                    {String(index + 1).padStart(2, "0")} · {level ? copy.courses.levelLabel[level] : copy.courses.heading}
                  </span>
                  <CourseCard course={course} href={`/courses/${course.slug}`} locale={locale} />
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
