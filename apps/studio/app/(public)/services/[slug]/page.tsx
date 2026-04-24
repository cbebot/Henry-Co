import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/env";
import { getStudioCatalog, getStudioServiceBySlug } from "@/lib/studio/catalog";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, catalog] = await Promise.all([getStudioServiceBySlug(slug), getStudioCatalog()]);
  if (!service) notFound();

  const packages = catalog.packages.filter((item) => item.serviceId === service.id);

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.4rem] px-7 py-10 sm:px-10 lg:px-14">
        <div className="max-w-3xl">
          <div className="studio-kicker">{service.name}</div>
          <h1 className="studio-heading mt-4 text-balance">{service.headline}</h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">{service.summary}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/request" className="studio-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
            Start a {service.name.toLowerCase()} brief
          </Link>
          <Link href="/teams" className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
            Choose a team
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">What you get</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {service.outcomes.map((outcome) => (
              <span key={outcome} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                {outcome}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">Starting from</div>
            <div className="mt-2 text-3xl font-semibold text-[var(--studio-ink)]">
              {formatCurrency(service.startingPrice)}
            </div>
            <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">{service.deliveryWindow}</div>
          </div>
        </article>

        <article className="studio-panel rounded-[1.75rem] p-6">
          <div className="studio-kicker">Packages</div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-lg font-semibold text-[var(--studio-ink)]">{pkg.name}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{pkg.summary}</p>
                <div className="mt-4 text-2xl font-semibold text-[var(--studio-ink)]">{formatCurrency(pkg.price)}</div>
                <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">{pkg.timelineWeeks} weeks typical timeline</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pkg.includes.map((item) => (
                    <span key={item} className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-10 studio-panel rounded-[1.75rem] p-6">
        <div className="studio-kicker">Why choose HenryCo</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {catalog.valueComparisons.map((comparison) => (
            <article key={comparison.title} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="text-lg font-semibold text-[var(--studio-ink)]">{comparison.title}</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {comparison.points.map((point) => (
                  <div key={point}>• {point}</div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
