import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, HelpCircle, Home, Layers, Settings, Users } from "lucide-react";
import { getCmsStats } from "@/lib/cms/stats";

export const metadata: Metadata = { title: "Overview — Owner CMS" };
export const dynamic = "force-dynamic";

type Surface = { title: string; icon: typeof FileText; desc: string; href: string };

const SURFACES: Surface[] = [
  {
    title: "Company Pages",
    icon: FileText,
    href: "/pages",
    desc: "About, Contact, Privacy, Terms — edit the real content, draft → publish to your live site.",
  },
  {
    title: "Homepage",
    icon: Home,
    href: "/homepage",
    desc: "The full editorial hub homepage — hero, sections, your owner note, and FAQ.",
  },
  {
    title: "Divisions",
    icon: Layers,
    href: "/divisions",
    desc: "Every division — copy, highlights, lead, links, and visibility.",
  },
  {
    title: "People",
    icon: Users,
    href: "/people",
    desc: "Leadership & team — add, edit, photos, and bios (incl. your About-page profile).",
  },
  {
    title: "FAQs",
    icon: HelpCircle,
    href: "/faqs",
    desc: "Public questions & answers, grouped per page.",
  },
  {
    title: "Brand & Settings",
    icon: Settings,
    href: "/brand",
    desc: "Group identity, logos, footer, default SEO, and social links.",
  },
];

export default async function DashboardPage() {
  const stats = await getCmsStats();
  const tiles = [
    { label: "Pages", value: stats.pages },
    { label: "Divisions", value: stats.divisions },
    { label: "People", value: stats.people },
    { label: "FAQs", value: stats.faqs },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
          Owner CMS
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">Welcome back</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          One audited console for every editable surface the public Henry &amp; Co. sites render —
          editing the real, live content. Every surface below is live.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-4"
          >
            <div className="text-2xl font-semibold text-[var(--hc-ink)]">{tile.value}</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[var(--hc-ink-muted)]">
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <Link
              key={surface.title}
              href={surface.href}
              className="group flex h-full flex-col rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 transition-all hover:border-[var(--hc-accent)] hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-700">
                  Live
                </span>
              </div>
              <h2 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-[var(--hc-ink)]">
                {surface.title}
                <ArrowRight
                  className="h-4 w-4 text-[var(--hc-ink-muted)] transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-[var(--hc-ink-muted)]">{surface.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
