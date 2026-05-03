import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioServiceSlug } from "@/lib/studio/content";
import { formatCurrency } from "@/lib/env";

export default async function ServicesPage() {
  const catalog = await getStudioCatalog();

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 lg:px-10">
      <section>
        <p className="studio-kicker">Services</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Specialised capability, priced against outcomes.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Executive websites, internal systems, commerce, product UX, and custom software. Each
          area has a defined scope, a starting price, and a delivery window stated up front.
        </p>
      </section>

      <ol className="mt-14 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
        {catalog.services.map((service, i) => (
          <li
            key={service.id}
            id={service.id}
            className="grid scroll-mt-32 gap-8 py-10 xl:grid-cols-[0.4fr,0.6fr]"
          >
            <div>
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Service {String(i + 1).padStart(2, "0")} &middot; {service.name}
              </p>
              <h2 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.95rem]">
                {service.headline}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--studio-ink-soft)]">
                {service.summary}
              </p>
            </div>

            <div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--studio-line)] py-5">
                <div className="flex flex-col gap-1.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                    Starting from
                  </dt>
                  <dd className="text-[1.5rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[1.7rem]">
                    {formatCurrency(service.startingPrice)}
                  </dd>
                  <p className="text-[12.5px] text-[var(--studio-ink-soft)]">
                    {service.deliveryWindow}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                    Typical outcomes
                  </dt>
                  <dd>
                    <ul className="space-y-1.5">
                      {service.outcomes.map((item) => (
                        <li
                          key={item}
                          className="text-[12.5px] leading-relaxed text-[var(--studio-ink-soft)]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {service.stack.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--studio-ink-soft)]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <Link
                href={`/services/${studioServiceSlug(service)}`}
                className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#041117] rounded-sm"
              >
                View service detail
                <ArrowUpRight className="h-3.5 w-3.5 transition motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
