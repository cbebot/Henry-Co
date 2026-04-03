import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { formatCurrency } from "@/lib/env";

export default async function PricingPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <section className="studio-panel studio-mesh rounded-[2.8rem] px-7 py-8 sm:px-10 lg:px-14 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
          <div>
            <div className="studio-kicker">Packages and pricing</div>
            <h1 className="studio-heading mt-4 max-w-4xl">
              Packages create a faster buying path. Bespoke products and custom software still stay first-class.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
              HenryCo Studio uses packages when a premium delivery lane is already clear. If the work is
              more complex, more integrated, or more operationally specific, the custom brief path captures
              the real scope instead of forcing it into the wrong template.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Published package lanes", String(catalog.packages.length)],
              ["Custom-ready service lanes", String(catalog.services.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{label}</div>
                <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 xl:grid-cols-3">
        {catalog.packages.map((pkg) => {
          const service = catalog.services.find((item) => item.id === pkg.serviceId);
          return (
            <article key={pkg.id} className="studio-panel rounded-[2.4rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="studio-kicker">{service?.name || "Studio package"}</div>
                <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                  {pkg.timelineWeeks} weeks
                </div>
              </div>
              <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {formatCurrency(pkg.price)}
              </div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)]">
                {pkg.name}
              </div>
              <p className="mt-3 text-sm leading-8 text-[var(--studio-ink-soft)]">{pkg.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">Deposit</div>
                  <div className="mt-2 text-xl font-semibold text-[var(--studio-ink)]">
                    {Math.round(pkg.depositRate * 100)}%
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">Best for</div>
                  <div className="mt-2 text-sm leading-7 text-[var(--studio-ink)]">{pkg.bestFor}</div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {pkg.includes.map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <div className="studio-panel rounded-[2.4rem] p-6 sm:p-8">
          <div className="studio-kicker">Choose custom instead when</div>
          <div className="mt-5 space-y-4">
            {[
              "You need a multi-role portal, client workspace, dashboard, or workflow-specific software system.",
              "The project combines web, admin, payments, operations, and automation into one platform.",
              "The product needs mobile, integrations, or a more deliberate architecture path than a package allows.",
              "You want HenryCo to scope the exact experience rather than retrofit your needs into a predefined template.",
            ].map((item) => (
              <div key={item} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="studio-panel rounded-[2.4rem] p-6 sm:p-8">
          <div className="studio-kicker">Commercial next move</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
            Use a package when it fits. Use the custom brief when the real scope deserves it.
          </h2>
          <div className="mt-5 space-y-4">
            {catalog.valueComparisons.slice(0, 2).map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-lg font-semibold text-[var(--studio-ink)]">{item.title}</div>
                <div className="mt-3 space-y-2">
                  {item.points.map((point) => (
                    <div key={point} className="flex gap-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/request" className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              Open the brief builder
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services" className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
              Compare service lanes
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 studio-panel rounded-[2.4rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="studio-kicker">Enterprise or non-standard scope</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
              If the project is larger, more sensitive, or more integrated, Studio will scope it as a custom program.
            </h2>
            <p className="mt-4 text-sm leading-8 text-[var(--studio-ink-soft)]">
              Enterprise systems, internal transformations, large platform rebuilds, and custom growth stacks should go through the premium brief builder so HenryCo can structure the right delivery model.
            </p>
          </div>
          <Link
            href="/request"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-5 py-3 text-sm font-semibold text-[var(--studio-ink)]"
          >
            <Sparkles className="h-4 w-4 text-[var(--studio-signal)]" />
            Scope an enterprise custom project
          </Link>
        </div>
      </section>
    </main>
  );
}
