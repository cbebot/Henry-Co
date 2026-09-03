import type { Metadata } from "next";
import { FileText, HelpCircle, Home, Layers, Settings, Users } from "lucide-react";

export const metadata: Metadata = { title: "Overview — Owner CMS" };

const SURFACES = [
  {
    title: "Company Pages",
    icon: FileText,
    desc: "About, Contact, Privacy, Terms — typed block editor, draft → publish, real-render preview.",
    phase: "Phase 1",
  },
  {
    title: "Brand & Settings",
    icon: Settings,
    desc: "Group identity, footer, default SEO, social links, and logos.",
    phase: "Phase 1",
  },
  {
    title: "Divisions",
    icon: Layers,
    desc: "The seven division cards, plus a live DB-vs-config truth checker.",
    phase: "Phase 1",
  },
  {
    title: "People",
    icon: Users,
    desc: "Leadership and team, with reference links to pages and divisions.",
    phase: "Phase 1",
  },
  {
    title: "Homepage",
    icon: Home,
    desc: "The full editorial hub homepage content.",
    phase: "Phase 1",
  },
  {
    title: "FAQs",
    icon: HelpCircle,
    desc: "Public FAQ entries per page.",
    phase: "Phase 1",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
          Owner CMS
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">
          Welcome back
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          One audited console for every editable surface the public Henry Onyx sites render —
          editing the real, live content. The secured shell is in place; the editing surfaces below
          arrive next.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <div
              key={surface.title}
              className="flex flex-col rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 transition-colors hover:border-[var(--hc-accent)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="rounded-full bg-[var(--owner-accent-soft)] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--hc-accent-text)]">
                  {surface.phase}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-[var(--hc-ink)]">{surface.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-[var(--hc-ink-muted)]">{surface.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
