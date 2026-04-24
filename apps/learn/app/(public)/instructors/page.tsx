import Link from "next/link";
import { getPublicAcademyData } from "@/lib/learn/data";
import { LearnPanel, LearnSectionIntro } from "@/components/learn/ui";

export const metadata = { title: "Instructors - HenryCo Learn" };

export default async function InstructorsPage() {
  const academy = await getPublicAcademyData();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Instructors"
        title="Operators teaching what they run."
        body="Each instructor is a working domain specialist. No filler avatars, no bought bios &mdash; just the people behind the trust layer."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {academy.instructors.map((instructor) => (
          <LearnPanel key={instructor.id} className="rounded-[2rem]">
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--learn-ink)]">{instructor.fullName}</h3>
            <p className="mt-2 text-sm font-medium text-[var(--learn-mint-soft)]">{instructor.title}</p>
            <p className="mt-4 text-sm leading-7 text-[var(--learn-ink-soft)]">{instructor.bio}</p>
            <Link href={`/instructors/${instructor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--learn-mint-soft)]">
              View instructor
            </Link>
          </LearnPanel>
        ))}
      </div>
    </main>
  );
}
