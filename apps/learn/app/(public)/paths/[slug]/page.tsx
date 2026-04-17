import { notFound } from "next/navigation";
import { getPathBySlug } from "@/lib/learn/data";
import { getPassiveLearnViewer } from "@/lib/learn/auth";
import { ActionLink, LearnPanel, LearnSectionIntro, LearnStatusBadge } from "@/components/learn/ui";

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getPassiveLearnViewer();
  const data = await getPathBySlug(slug, viewer);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 xl:px-10">
      <section className="learn-panel learn-hero rounded-[2.8rem] p-8 sm:p-10 xl:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge label={data.path.visibility} tone={data.path.visibility === "public" ? "signal" : "warning"} />
          <LearnStatusBadge label={data.path.accessModel} />
        </div>
        <h1 className="learn-heading mt-6 text-[3rem] text-[var(--learn-ink)] sm:text-[4rem]">{data.path.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--learn-ink-soft)]">{data.path.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionLink href="/courses" label="Browse full catalog" />
          <ActionLink href="/academy" label="See academy system" variant="secondary" />
        </div>
      </section>

      <section className="mt-10">
        <LearnSectionIntro kicker="Path Sequence" title="A structured route through the capability." body="These path items are ordered intentionally so progress builds confidence instead of creating noise." />
        <div className="mt-8 space-y-4">
          {data.items.map((item, index) => (
            <LearnPanel key={item.id} className="rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">Step {index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--learn-ink)]">{item.course?.title || item.label}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">{item.description}</p>
                </div>
                {item.course ? <ActionLink href={`/courses/${item.course.slug}`} label="Open course" variant="secondary" /> : null}
              </div>
            </LearnPanel>
          ))}
        </div>
      </section>
    </main>
  );
}
