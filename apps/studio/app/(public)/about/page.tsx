import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { getStudioCatalog } from "@/lib/studio/catalog";

export default async function StudioAboutPage() {
  const catalog = await getStudioCatalog();
  const proof = [
    { label: "Services", value: String(catalog.services.length) },
    { label: "Packages", value: String(catalog.packages.length) },
    { label: "Teams", value: String(catalog.teams.length) },
    { label: "Case studies", value: String(catalog.caseStudies.length) },
  ];
  const principles = [
    {
      title: "Structured before creative",
      body: "Every project starts with the brief, success criteria, constraints, and delivery path made visible.",
      icon: Layers3,
    },
    {
      title: "Premium execution",
      body: "Design, engineering, copy, and launch support move together instead of being treated as separate handoffs.",
      icon: Sparkles,
    },
    {
      title: "Client-side confidence",
      body: "Milestones, files, invoices, proof uploads, and project messages stay accountable in the Studio workspace.",
      icon: ShieldCheck,
    },
  ];

  return (
    <main id="henryco-main" tabIndex={-1} className="mx-auto max-w-[88rem] px-5 py-12 sm:px-8 lg:px-10">
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="studio-kicker">About HenryCo Studio</p>
          <h1 className="mt-4 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--studio-ink)] sm:text-[2.9rem] md:text-[3.4rem]">
            A software studio built around clarity, delivery, and trust.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--studio-ink-soft)] sm:text-lg">
            HenryCo Studio designs and builds websites, commerce experiences, internal tools, and custom platforms for teams that need serious execution without a chaotic build process.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/request"
              className="studio-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              Start a brief
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/work"
              className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              View work
            </Link>
          </div>
        </div>

        <dl className="grid gap-3 rounded-[2rem] border border-[var(--studio-line)] bg-black/10 p-4 sm:grid-cols-2 sm:p-5">
          {proof.map((item) => (
            <div key={item.label} className="rounded-[1.5rem] border border-[var(--studio-line)] bg-white/[0.03] p-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">{item.label}</dt>
              <dd className="mt-3 text-3xl font-semibold tracking-tight text-[var(--studio-ink)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline gap-4">
          <p className="studio-kicker">How we operate</p>
          <span className="h-px flex-1 bg-[var(--studio-line)]" />
        </div>
        <ul className="mt-7 grid gap-5 md:grid-cols-3">
          {principles.map((item) => (
            <li key={item.title} className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-6">
              <item.icon className="h-5 w-5 text-[var(--studio-signal)]" aria-hidden />
              <h2 className="mt-5 text-[1.1rem] font-semibold leading-snug tracking-tight text-[var(--studio-ink)]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="studio-kicker">Delivery record</p>
          <h2 className="mt-4 max-w-xl text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--studio-ink)] sm:text-[1.85rem]">
            The studio workspace is part of the service, not an afterthought.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
            Clients can follow project status, exchange messages, review files, and pay invoices from one controlled workspace.
          </p>
        </div>
        <ul className="divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          {catalog.process.slice(0, 5).map((step) => (
            <li key={step} className="flex gap-3 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)]" aria-hidden />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
