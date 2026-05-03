import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/env";
import { getStudioCatalog, getStudioServiceBySlug } from "@/lib/studio/catalog";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, catalog] = await Promise.all([
    getStudioServiceBySlug(slug),
    getStudioCatalog(),
  ]);
  if (!service) notFound();

  const packages = catalog.packages.filter((item) => item.serviceId === service.id);

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">{service.name}</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          {service.headline}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          {service.summary}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/request"
            className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            Start a {service.name.toLowerCase()} brief
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/teams"
            className="studio-button-secondary inline-flex rounded-full px-6 py-3.5 text-sm font-semibold"
          >
            Choose a team
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-[0.85fr,1.15fr]">
        <div>
          <p className="studio-kicker">What you get</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            Outcomes built into every engagement.
          </h2>
          {service.outcomes.length ? (
            <ul className="mt-6 flex flex-wrap gap-1.5">
              {service.outcomes.map((outcome) => (
                <li
                  key={outcome}
                  className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                >
                  {outcome}
                </li>
              ))}
            </ul>
          ) : null}
          <dl className="mt-8 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            <div className="flex items-baseline gap-3 py-3">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Starting from
              </dt>
              <dd className="ml-auto text-right text-[1.45rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[1.65rem]">
                {formatCurrency(service.startingPrice)}
              </dd>
            </div>
            <div className="flex items-baseline gap-3 py-3">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Delivery window
              </dt>
              <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--studio-ink)]">
                {service.deliveryWindow}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="studio-kicker">Packages</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            Pre-scoped lanes you can pick from.
          </h2>
          <ul className="mt-7 grid gap-5 lg:grid-cols-2">
            {packages.map((pkg) => (
              <li
                key={pkg.id}
                className="rounded-[1.6rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--studio-signal)]/40"
              >
                <h3 className="text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--studio-ink-soft)]">
                  {pkg.summary}
                </p>
                <p className="mt-4 text-[1.45rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)]">
                  {formatCurrency(pkg.price)}
                </p>
                <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                  {pkg.timelineWeeks} weeks typical timeline
                </p>
                {pkg.includes.length ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {pkg.includes.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Why choose HenryCo</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <ol className="mt-6 grid gap-8 md:grid-cols-2 md:divide-x md:divide-[var(--studio-line)]">
          {catalog.valueComparisons.map((comparison, i) => (
            <li key={comparison.title} className={i > 0 ? "md:pl-8" : ""}>
              <h3 className="text-[1.15rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                {comparison.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {comparison.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
