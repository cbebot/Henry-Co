import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioCaseStudySlug } from "@/lib/studio/content";

export default async function WorkPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Selected work</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          The work before the conversation.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Each case study covers the business challenge, the approach, and the measurable impact.
          No vague summaries &mdash; proof you can verify before you commit.
        </p>
        <dl className="mt-10 grid grid-cols-3 gap-x-6 gap-y-5 border-y border-[var(--studio-line)] py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
          {[
            ["Case studies", String(catalog.caseStudies.length)],
            ["Teams", String(catalog.teams.length)],
            ["Services", String(catalog.services.length)],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                {label}
              </dt>
              <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <ol className="mt-16 grid gap-5 lg:grid-cols-3">
        {catalog.caseStudies.map((item) => (
          <li key={item.id}>
            <Link
              href={`/work/${studioCaseStudySlug(item)}`}
              className="group flex h-full flex-col rounded-[1.8rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--studio-signal)]/40"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                {item.type}
              </p>
              <h2 className="mt-4 text-[1.35rem] font-semibold leading-snug tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.5rem]">
                {item.name}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--studio-ink-soft)]">
                {item.challenge}
              </p>
              <p className="mt-4 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm font-semibold leading-relaxed text-[var(--studio-ink)]">
                {item.impact}
              </p>
              {item.metrics.length ? (
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {item.metrics.map((metric) => (
                    <li
                      key={metric}
                      className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                    >
                      {metric}
                    </li>
                  ))}
                </ul>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 group-hover:underline">
                View case study
                <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
