import Link from "next/link";
import { getPublicAcademyData } from "@/lib/learn/data";
import { LearnSectionIntro, PathCard } from "@/components/learn/ui";

export const metadata = { title: "Learning paths - HenryCo Learn" };

export default async function PathsPage() {
  const academy = await getPublicAcademyData();
  const pathItemCounts = new Map(
    academy.paths.map((path) => [
      path.id,
      academy.pathItems.filter((item) => item.pathId === path.id).length,
    ])
  );

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <LearnSectionIntro
        kicker="Learning paths"
        title="Build a skill across several courses—not one long sprint."
        body="Each path lists the courses in order. Complete them one at a time; your progress still lives in your HenryCo account so you can pause and return whenever you need."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {academy.paths.map((path) => (
          <PathCard key={path.id} path={path} courseCount={pathItemCounts.get(path.id) || 0} href={`/paths/${path.slug}`} />
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/courses" className="learn-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          Browse individual courses
        </Link>
      </div>
    </main>
  );
}
