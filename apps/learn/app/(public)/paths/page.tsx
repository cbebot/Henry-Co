import { getPublicAcademyData } from "@/lib/learn/data";
import { LearnSectionIntro, PathCard } from "@/components/learn/ui";

export const metadata = { title: "Paths - HenryCo Learn" };

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
        kicker="Learning Paths"
        title="Capability tracks that sequence progress instead of dumping content."
        body="Paths turn related courses into first-class academy experiences for public learners and internal teams."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {academy.paths.map((path) => (
          <PathCard key={path.id} path={path} courseCount={pathItemCounts.get(path.id) || 0} href={`/paths/${path.slug}`} />
        ))}
      </div>
    </main>
  );
}
