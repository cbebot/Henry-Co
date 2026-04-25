import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getPathBySlug } from "@/lib/learn/data";
import { getLearnViewer } from "@/lib/learn/auth";
import { ActionLink, LearnStatusBadge } from "@/components/learn/ui";

export default async function PathDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await getLearnViewer();
  const data = await getPathBySlug(slug, viewer);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-14 sm:px-8 xl:px-10">
      {/* Editorial path hero — no big rounded panel */}
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <LearnStatusBadge
            label={data.path.visibility}
            tone={data.path.visibility === "public" ? "signal" : "warning"}
          />
          <LearnStatusBadge label={data.path.accessModel} />
        </div>
        <h1 className="mt-6 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--learn-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          {data.path.title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--learn-ink-soft)] sm:text-lg">
          {data.path.description}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ActionLink href="/courses" label="Browse full catalog" />
          <ActionLink href="/academy" label="See academy system" variant="secondary" />
        </div>
      </section>

      {/* Path sequence — divided list, no inner panels */}
      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--learn-copper)]">
            Path sequence
          </p>
          <span className="h-px flex-1 bg-[var(--learn-line)]" />
        </div>
        <h2 className="mt-4 max-w-2xl text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--learn-ink)] sm:text-[1.95rem]">
          A structured route through the capability.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
          These path items are ordered intentionally so progress builds confidence instead of
          creating noise.
        </p>

        <ol className="mt-8 divide-y divide-[var(--learn-line)] border-y border-[var(--learn-line)]">
          {data.items.map((item, index) => (
            <li key={item.id} className="grid gap-5 py-6 md:grid-cols-[0.32fr,0.68fr]">
              <div>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--learn-copper)]">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-[1.15rem] font-semibold leading-snug tracking-tight text-[var(--learn-ink)] sm:text-[1.25rem]">
                  {item.course?.title || item.label}
                </h3>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <p className="max-w-2xl text-sm leading-7 text-[var(--learn-ink-soft)]">
                  {item.description}
                </p>
                {item.course ? (
                  <Link
                    href={`/courses/${item.course.slug}`}
                    className="group inline-flex shrink-0 items-center gap-2 self-start text-sm font-semibold text-[var(--learn-copper)] underline-offset-4 hover:underline"
                  >
                    Open course
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
