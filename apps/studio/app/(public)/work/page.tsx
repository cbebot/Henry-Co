import Link from "next/link";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioCaseStudySlug } from "@/lib/studio/content";

export default async function WorkPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="max-w-4xl">
          <div className="studio-kicker">Selected work</div>
          <h1 className="studio-heading mt-4">
            Case studies built to prove delivery depth before the first sales call.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--studio-ink-soft)]">
            HenryCo Studio does not present weak thumbnails and vague captions. Each story is framed
            around business pressure, operating clarity, and the level of output premium buyers expect.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Case studies", String(catalog.caseStudies.length)],
            ["Specialist teams", String(catalog.teams.length)],
            ["Service lanes", String(catalog.services.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{label}</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {catalog.caseStudies.map((item) => (
          <article key={item.id} className="studio-panel rounded-[2rem] p-6">
            <div className="studio-kicker">{item.type}</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
              {item.name}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.challenge}</p>
            <div className="mt-4 text-sm font-medium text-[var(--studio-ink)]">{item.impact}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {item.metrics.map((metric) => (
                <span
                  key={metric}
                  className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]"
                >
                  {metric}
                </span>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href={`/work/${studioCaseStudySlug(item)}`}
                className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                View case study
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
