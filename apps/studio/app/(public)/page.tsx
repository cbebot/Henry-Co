import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, Sparkles, Target, Waypoints } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { formatCurrency } from "@/lib/env";

export default async function StudioHomePage() {
  const catalog = await getStudioCatalog();
  const featuredPackages = catalog.packages.slice(0, 3);
  const featuredServices = catalog.services.slice(0, 5);
  const featuredTeams = catalog.teams.slice(0, 4);
  const featuredCases = catalog.caseStudies.slice(0, 3);
  const featuredTestimonials = catalog.testimonials.slice(0, 2);

  return (
    <main className="pb-24">
      <section className="mx-auto max-w-[92rem] px-5 pt-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="studio-panel studio-hero studio-mesh rounded-[3rem] px-7 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="flex flex-wrap items-center gap-2">
              <span className="studio-kicker">HenryCo Studio</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--studio-signal)]" />
                Software built with sharper process
              </span>
            </div>
            <h1 className="studio-display mt-7 max-w-3xl text-balance text-[var(--studio-ink)]">
              Serious software, delivered with discipline.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
              We design and build websites, web apps, and internal platforms for companies that expect a calmer path from brief to launch &mdash; scoped in plain English, priced on milestones, delivered in one structured workspace.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/pick"
                className="studio-button-primary inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"
              >
                Help me pick a project type
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/request"
                className="studio-button-secondary inline-flex rounded-full px-6 py-4 text-sm font-semibold"
              >
                Start a brief
              </Link>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
              <div className="studio-kicker">At a glance</div>
              <div className="mt-5 grid gap-3 grid-cols-2">
                {[
                  { label: "Services", value: String(catalog.services.length) },
                  { label: "Packages", value: String(catalog.packages.length) },
                  { label: "Teams", value: String(catalog.teams.length) },
                  { label: "Case studies", value: String(catalog.caseStudies.length) },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-black/10 px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
                      {item.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)] sm:text-4xl">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Layers3,
                  title: "Package path",
                  body: "Premium websites, commerce, dashboards \u2014 repeatable scopes with clear price bands.",
                  href: "/pricing",
                  cta: "Compare packages",
                },
                {
                  icon: Sparkles,
                  title: "Custom project path",
                  body: "Bespoke software, portals, multi-role products, and specific feature architecture.",
                  href: "/request",
                  cta: "Build a brief",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-[1.9rem] border border-[var(--studio-line)] bg-black/10 p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(151,244,243,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <item.icon className="h-5 w-5 text-[var(--studio-signal)]" />
                  <div className="mt-4 text-xl font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--studio-ink)]">
                    {item.cta}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="studio-kicker">Why Studio</div>
              <h2 className="studio-heading mt-4">The difference clients actually notice.</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {catalog.valueComparisons.map((item) => (
              <div key={item.title} className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                <div className="text-lg font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">{item.title}</div>
                <div className="mt-4 space-y-2.5">
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
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="studio-kicker">Packages</div>
            <h2 className="studio-heading mt-4">Transparent pricing so you know what to expect before the first conversation.</h2>
          </div>
          <Link href="/pricing" className="text-sm font-semibold text-[var(--studio-ink)]">
            Explore all packages
          </Link>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {featuredPackages.map((pkg) => (
            <article key={pkg.id} className="studio-panel rounded-[2.2rem] p-6">
              <div className="studio-kicker">{pkg.name}</div>
              <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {formatCurrency(pkg.price)}
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{pkg.summary}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">Deposit</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--studio-ink)]">
                    {Math.round(pkg.depositRate * 100)}%
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">Timeline</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--studio-ink)]">{pkg.timelineWeeks} weeks</div>
                </div>
              </div>
              <div className="mt-5 text-sm text-[var(--studio-ink)]">Best for: {pkg.bestFor}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">Services</div>
            <h2 className="studio-heading mt-4">Specialised services built around real business outcomes.</h2>
            <div className="mt-6 space-y-4">
              {featuredServices.map((service) => (
                <div key={service.id} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-[var(--studio-ink)]">{service.name}</div>
                    <div className="text-sm text-[var(--studio-signal)]">{formatCurrency(service.startingPrice)}</div>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{service.headline}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">Selected work</div>
            <div className="mt-6 space-y-4">
              {featuredCases.map((item) => (
                <div key={item.id} className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-[var(--studio-ink)]">{item.name}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">{item.type}</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.challenge}</p>
                  <div className="mt-4 text-sm font-medium text-[var(--studio-ink)]">{item.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-[0.97fr_1.03fr]">
          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">Our teams</div>
            <h2 className="studio-heading mt-4">Work with a specialist team matched to your project.</h2>
            <div className="mt-6 space-y-4">
              {featuredTeams.map((team) => (
                <div key={team.id} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[var(--studio-ink)]">{team.name}</div>
                      <div className="mt-1 text-sm text-[var(--studio-signal)]">{team.label}</div>
                    </div>
                    <div className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {team.availability}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{team.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">Our process</div>
            <div className="mt-6 space-y-4">
              {catalog.process.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] text-sm font-semibold text-[var(--studio-ink)]">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-7 text-[var(--studio-ink-soft)]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="studio-panel rounded-[2.8rem] px-7 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[0.94fr_1.06fr] xl:items-end">
            <div>
              <div className="studio-kicker">Trust & credibility</div>
              <h2 className="studio-heading mt-4">Quality you can verify before you invest.</h2>
              <div className="mt-6 space-y-4">
                {featuredTestimonials.map((item) => (
                  <div key={item.id} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                    <p className="text-base leading-8 text-[var(--studio-ink)]">{item.quote}</p>
                    <div className="mt-3 text-sm text-[var(--studio-ink-soft)]">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Waypoints,
                  title: "Full project visibility",
                  body: "Scope, payments, reviews, and delivery milestones — visible to you at every stage.",
                },
                {
                  icon: Layers3,
                  title: "One team, one workspace",
                  body: "Design, development, finance, and support all work from the same project record.",
                },
                {
                  icon: Sparkles,
                  title: "Custom work, premium standard",
                  body: "Bespoke projects receive the same structured process, clear milestones, and polish as any package.",
                },
                {
                  icon: Target,
                  title: "Everything in your account",
                  body: "Project history, invoices, and updates are always accessible from your HenryCo account.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <item.icon className="h-5 w-5 text-[var(--studio-signal)]" />
                  <div className="mt-4 text-lg font-semibold text-[var(--studio-ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
