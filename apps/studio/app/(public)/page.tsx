import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, Sparkles, Target } from "lucide-react";
import { PublicProofRail, PublicSpotlight } from "@henryco/ui/public-shell";
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
            <PublicProofRail
              eyebrow="At a glance"
              density="tight"
              variant="rail"
              items={[
                { label: "Services", value: String(catalog.services.length) },
                { label: "Packages", value: String(catalog.packages.length) },
                { label: "Teams", value: String(catalog.teams.length) },
                { label: "Case studies", value: String(catalog.caseStudies.length) },
              ]}
            />

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

      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="studio-kicker">Why Studio</div>
            <h2 className="studio-heading mt-4">The difference clients actually notice.</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-3 lg:divide-x lg:divide-[var(--studio-line)]">
          {catalog.valueComparisons.map((item, idx) => (
            <div key={item.title} className={idx === 0 ? "lg:pr-2" : "lg:px-8"}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="mt-3 text-xl font-semibold tracking-[-0.01em] text-[var(--studio-ink)]">{item.title}</div>
              <ul className="mt-5 space-y-3">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
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
          {featuredPackages.map((pkg, idx) => (
            <article
              key={pkg.id}
              className={
                idx === 1
                  ? "studio-panel rounded-[2.2rem] p-6 ring-1 ring-[var(--studio-signal)]/40 shadow-[0_28px_80px_-30px_rgba(151,244,243,0.4)]"
                  : "studio-panel rounded-[2.2rem] p-6"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="studio-kicker">{pkg.name}</div>
                {idx === 1 ? (
                  <span className="rounded-full border border-[var(--studio-signal)]/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                    Most chosen
                  </span>
                ) : null}
              </div>
              <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
                {formatCurrency(pkg.price)}
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{pkg.summary}</p>
              <dl className="mt-5 flex items-end justify-between gap-6 border-t border-[var(--studio-line)] pt-4">
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">Deposit</dt>
                  <dd className="mt-1 text-base font-semibold text-[var(--studio-ink)]">{Math.round(pkg.depositRate * 100)}%</dd>
                </div>
                <div>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">Timeline</dt>
                  <dd className="mt-1 text-base font-semibold text-[var(--studio-ink)]">{pkg.timelineWeeks} wks</dd>
                </div>
              </dl>
              <div className="mt-5 text-sm text-[var(--studio-ink-soft)]"><span className="text-[var(--studio-ink)] font-medium">Best for:</span> {pkg.bestFor}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="studio-kicker">Services</div>
            <h2 className="studio-heading mt-4">Specialised services built around real business outcomes.</h2>
            <ul className="mt-8 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
              {featuredServices.map((service) => (
                <li key={service.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <div>
                    <div className="text-base font-semibold tracking-tight text-[var(--studio-ink)]">{service.name}</div>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--studio-ink-soft)]">{service.headline}</p>
                  </div>
                  <div className="text-sm font-semibold text-[var(--studio-signal)] whitespace-nowrap">
                    from {formatCurrency(service.startingPrice)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
            <div className="studio-kicker">Selected work</div>
            <div className="mt-6 space-y-5">
              {featuredCases.map((item) => (
                <article key={item.id} className="border-l-2 border-[var(--studio-signal)]/40 pl-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-[var(--studio-ink)]">{item.name}</div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">{item.type}</div>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.challenge}</p>
                  <div className="mt-3 text-sm font-medium text-[var(--studio-ink)]">{item.impact}</div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <div className="studio-kicker">How an engagement runs</div>
          <h2 className="studio-heading mt-4">From first call to launch, in one continuous record.</h2>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {catalog.process.slice(0, 4).map((step, index) => (
            <li key={step} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--studio-signal)]/30 text-xs font-semibold text-[var(--studio-signal)]">
                  0{index + 1}
                </span>
                <div className="h-px flex-1 bg-[var(--studio-line)]" />
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{step}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--studio-line)] pt-6">
          <div>
            <div className="studio-kicker">Specialist teams</div>
            <p className="mt-2 text-sm text-[var(--studio-ink-soft)]">
              Matched to project type. Availability shown live on each team.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {featuredTeams.map((team) => (
              <span
                key={team.id}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] bg-black/15 px-3.5 py-1.5 text-xs font-medium text-[var(--studio-ink)]"
              >
                {team.name}
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--studio-signal)]">{team.availability}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10 space-y-8">
        <PublicSpotlight
          tone="contrast"
          eyebrow="Trust & credibility"
          title="Quality you can verify before you invest."
          body="Every project runs on a single record &mdash; scope, payments, reviews, milestones. Nothing about your engagement lives in a back-channel."
          aside={
            <div className="space-y-5">
              {featuredTestimonials.map((item) => (
                <figure key={item.id} className="border-l border-white/20 pl-5">
                  <blockquote className="text-sm leading-7 text-white/90">&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-white/60">{item.name}</figcaption>
                </figure>
              ))}
            </div>
          }
        />

        <PublicProofRail
          density="tight"
          variant="rail"
          items={[
            { label: "Visibility", value: "Full project", hint: "Scope, payments, reviews — visible at every stage." },
            { label: "Workspace", value: "One team", hint: "Design, dev, finance, support — same record." },
            { label: "Standard", value: "Premium", hint: "Custom work runs the same milestones as packages." },
            { label: "Account", value: "Always on", hint: "History, invoices, updates from your HenryCo account." },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[var(--studio-line)] bg-black/15 px-6 py-5">
          <div className="flex items-center gap-3 text-[var(--studio-ink-soft)]">
            <Target className="h-5 w-5 text-[var(--studio-signal)]" />
            <span className="text-sm">Ready to scope a project? Brief takes about 8 minutes.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/request" className="studio-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
              Start a brief
            </Link>
            <Link href="/pricing" className="studio-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold">
              See packages
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
