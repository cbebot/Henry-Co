import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { formatCurrency } from "@/lib/env";

export default async function PricingPage() {
  const catalog = await getStudioCatalog();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 lg:px-10">
      {/* Editorial hero */}
      <section>
        <p className="studio-kicker">Packages and pricing</p>
        <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
          Clear packages for common projects. Custom scoping for everything else.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
          Transparent bands when the scope is repeatable, a milestone-priced brief when it
          isn&rsquo;t. You see the number before the first conversation.
        </p>
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--studio-line)] py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
          <div className="flex flex-col gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Available packages
            </dt>
            <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
              {catalog.packages.length}
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              Service areas
            </dt>
            <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2rem]">
              {catalog.services.length}
            </dd>
          </div>
        </dl>
      </section>

      {/* Packages — divided editorial cards, no panel chrome */}
      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">Packages</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <ol className="mt-6 grid gap-5 xl:grid-cols-3">
          {catalog.packages.map((pkg) => {
            const service = catalog.services.find((item) => item.id === pkg.serviceId);
            return (
              <article
                key={pkg.id}
                id={pkg.id}
                className="studio-card-tactile flex h-full flex-col scroll-mt-32 rounded-[1.8rem] border border-[var(--studio-line)] bg-[rgba(0,0,0,0.04)] p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                    {service?.name || "Studio package"}
                  </p>
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                    {pkg.timelineWeeks} weeks
                  </span>
                </div>
                <p className="mt-5 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--studio-ink)] sm:text-[2.2rem]">
                  {formatCurrency(pkg.price)}
                </p>
                <h3 className="mt-2 text-[1.15rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                  {pkg.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--studio-ink-soft)]">
                  {pkg.summary}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 border-y border-[var(--studio-line)] py-3">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                      Deposit
                    </dt>
                    <dd className="mt-1 text-[1.1rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                      {Math.round(pkg.depositRate * 100)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                      Best for
                    </dt>
                    <dd className="mt-1 text-sm leading-snug text-[var(--studio-ink)]">
                      {pkg.bestFor}
                    </dd>
                  </div>
                </dl>
                <ul className="mt-5 space-y-2">
                  {pkg.includes.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
                    >
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/request?package=${pkg.id}`}
                  className="studio-button-primary group mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#041117] active:translate-y-[0.5px]"
                >
                  Start with this package
                  <ArrowRight className="h-3.5 w-3.5 transition motion-safe:group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </article>
            );
          })}
        </ol>
      </section>

      {/* Custom-vs-package + Move forward — 2-col editorial split */}
      <section className="mt-16 grid gap-12 xl:grid-cols-[0.96fr_1.04fr]">
        <div>
          <p className="studio-kicker">Choose custom instead when</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            Larger or deeper builds skip the package and go straight to the brief.
          </h2>
          <ul className="mt-7 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {[
              "You need a multi-role portal, client workspace, dashboard, or workflow-specific software system.",
              "The project combines web, admin, payments, operations, and automation into one platform.",
              "The product needs mobile, integrations, or a more deliberate architecture path than a package allows.",
              "You want HenryCo to scope the exact experience rather than retrofit your needs into a predefined template.",
            ].map((item) => (
              <li
                key={item}
                className="py-3 text-sm leading-7 text-[var(--studio-ink-soft)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="studio-kicker">Move forward</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            Pick a package that fits, or send us the exact brief.
          </h2>
          <ul className="mt-7 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
            {catalog.valueComparisons.slice(0, 2).map((item) => (
              <li key={item.title} className="py-5">
                <h3 className="text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
                  {item.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {item.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2 text-sm leading-relaxed text-[var(--studio-ink-soft)]"
                    >
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/request"
              className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Open the brief builder
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
            >
              View all services
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise band — editorial border-l ribbon */}
      <section className="mt-16 border-l-2 border-[var(--studio-signal)]/55 pl-5">
        <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-signal)]">
          <Sparkles className="h-3.5 w-3.5" />
          Enterprise or non-standard scope
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
          Larger, more sensitive, or deeply integrated builds are scoped as a custom program.
        </h2>
        <p className="mt-3 max-w-xl text-pretty text-sm leading-7 text-[var(--studio-ink-soft)]">
          Enterprise platforms, large rebuilds, and complex integrations are priced and scoped
          against the exact requirements &mdash; not a template.
        </p>
        <Link
          href="/request"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 hover:underline"
        >
          Start a custom project
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </main>
  );
}
