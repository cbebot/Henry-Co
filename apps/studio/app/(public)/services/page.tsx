import Link from "next/link";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { studioServiceSlug } from "@/lib/studio/content";
import { formatCurrency } from "@/lib/env";

export default async function ServicesPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel rounded-[2.8rem] px-7 py-8 sm:px-10 lg:px-14 lg:py-12">
        <div className="studio-kicker">Services</div>
        <h1 className="studio-heading mt-4 max-w-4xl">
          Studio services are framed around business outcomes, not generic deliverables.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
          From executive websites to internal control systems and custom software, every service lane
          is designed to turn buyer intent into a real proposal, a clean operating model, and a
          stronger delivery experience.
        </p>
      </section>

      <div className="mt-10 space-y-6">
        {catalog.services.map((service) => (
          <section key={service.id} className="studio-panel rounded-[2.4rem] p-6 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="studio-kicker">{service.name}</div>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                  {service.headline}
                </h2>
                <p className="mt-4 text-sm leading-8 text-[var(--studio-ink-soft)]">{service.summary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">Starting from</div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                    {formatCurrency(service.startingPrice)}
                  </div>
                  <div className="mt-3 text-sm text-[var(--studio-ink-soft)]">{service.deliveryWindow}</div>
                </div>
                <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">Typical outcomes</div>
                  <div className="mt-3 space-y-2 text-sm text-[var(--studio-ink-soft)]">
                    {service.outcomes.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {service.stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-6">
              <Link
                href={`/services/${studioServiceSlug(service)}`}
                className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                View service detail
              </Link>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
