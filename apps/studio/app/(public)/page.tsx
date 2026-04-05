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
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="studio-panel studio-hero studio-mesh rounded-[3rem] px-7 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="studio-kicker">HenryCo Studio</div>
            <h1 className="studio-display mt-6 max-w-5xl text-[var(--studio-ink)]">
              Websites, web apps, and real software—guided from raw idea to polished launch.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--studio-ink-soft)] sm:text-lg">
              We design and build for schools, churches, founders, logistics teams, marketplaces, creators, and established
              businesses. You choose a ready-made project path when it fits, or describe something fully custom when it
              does not. Either way you get plain-English scope, honest milestones, and one premium workspace tied to your
              HenryCo account.
            </p>
            <p className="mt-4 max-w-3xl rounded-2xl border border-[var(--studio-line)] bg-black/15 px-4 py-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
              <span className="font-semibold text-[var(--studio-ink)]">Your next step is always obvious:</span>{" "}
              browse curated project types, open a structured brief, or talk to Studio on the contact page. Deposits and
              proof are explained before you pay—never hidden behind jargon.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
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
                I already know what I need
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-full border border-[var(--studio-line)] px-6 py-4 text-sm font-semibold text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.28)] hover:text-[var(--studio-ink)]"
              >
                View packages
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Fixed packages", "When the scope is similar each time—clear price bands and what is included."],
                ["Fully custom build", "When you need something unique: software, portals, or a product only you have."],
                ["Same account, full history", "Proposals, payments, messages, and delivery notes stay in your HenryCo account."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="text-base font-semibold text-[var(--studio-ink)]">{title}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
              <div className="studio-kicker">Studio snapshot</div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Services",
                    value: String(catalog.services.length),
                    body: "Specialised areas of expertise — from web development to product design.",
                  },
                  {
                    label: "Packages",
                    value: String(catalog.packages.length),
                    body: "Ready-to-start project types with clear scope and pricing.",
                  },
                  {
                    label: "Teams",
                    value: String(catalog.teams.length),
                    body: "Choose a team directly or let us recommend the best fit for your project.",
                  },
                  {
                    label: "Case studies",
                    value: String(catalog.caseStudies.length),
                    body: "Real projects we've delivered — see the work before you commit.",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                      {item.label}
                    </div>
                    <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                      {item.value}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Layers3,
                  title: "Package path",
                  body: "Premium websites, commerce builds, dashboards, and tighter repeatable scopes.",
                  href: "/pricing",
                  cta: "Compare packages",
                },
                {
                  icon: Sparkles,
                  title: "Custom project path",
                  body: "Bespoke software, portals, multi-role products, and specific feature architecture.",
                  href: "/request",
                  cta: "Build a custom brief",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-[1.9rem] border border-[var(--studio-line)] bg-black/10 p-5 transition hover:border-[rgba(151,244,243,0.28)]"
                >
                  <item.icon className="h-5 w-5 text-[var(--studio-signal)]" />
                  <div className="mt-4 text-xl font-semibold text-[var(--studio-ink)]">{item.title}</div>
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
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">How it works</div>
            <h2 className="studio-heading mt-4">A clear path from idea to delivery — no guesswork required.</h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  title: "Packages for common projects",
                  body: "When you need a website, commerce store, or dashboard with a clear scope — pick a package and start.",
                },
                {
                  title: "Custom builds for unique needs",
                  body: "When your project needs specific features, user roles, or integrations that don't fit a standard package.",
                },
                {
                  title: "Everything in one workspace",
                  body: "Your proposal, payments, milestones, updates, and deliverables live in one organised project workspace.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="text-lg font-semibold text-[var(--studio-ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">Why HenryCo Studio</div>
            <div className="mt-6 space-y-4">
              {catalog.valueComparisons.map((item) => (
                <div key={item.title} className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5">
                  <div className="text-lg font-semibold text-[var(--studio-ink)]">{item.title}</div>
                  <div className="mt-4 space-y-2">
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
