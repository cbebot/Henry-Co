import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, HelpCircle, Home, Layers, Settings, Users } from "lucide-react";

export const metadata: Metadata = { title: "Overview — Owner CMS" };

type Surface = {
  title: string;
  icon: typeof FileText;
  desc: string;
  href?: string;
  ready: boolean;
};

const SURFACES: Surface[] = [
  {
    title: "Company Pages",
    icon: FileText,
    desc: "About, Contact, Privacy, Terms and the Homepage — edit the real content, draft → publish to your live site.",
    href: "/pages",
    ready: true,
  },
  {
    title: "Brand & Settings",
    icon: Settings,
    desc: "Group identity, footer, default SEO, social links, and logos.",
    ready: false,
  },
  {
    title: "Divisions",
    icon: Layers,
    desc: "The division cards, plus a live DB-vs-config truth checker.",
    ready: false,
  },
  {
    title: "People",
    icon: Users,
    desc: "Leadership and team, with reference links to pages and divisions.",
    ready: false,
  },
  {
    title: "Homepage",
    icon: Home,
    desc: "The full editorial hub homepage content.",
    ready: false,
  },
  {
    title: "FAQs",
    icon: HelpCircle,
    desc: "Public FAQ entries per page.",
    ready: false,
  },
];

const CARD_BASE = "flex h-full flex-col rounded-2xl border p-5 transition-all";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--hc-accent-text)]">
          Owner CMS
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">Welcome back</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          One audited console for every editable surface the public Henry &amp; Co. sites render —
          editing the real, live content.{" "}
          <span className="font-medium text-[var(--hc-ink)]">Company Pages</span> is live now; the
          remaining surfaces are being built next.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {surface.ready ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-700">
                    Live
                  </span>
                ) : (
                  <span className="rounded-full bg-[var(--owner-accent-soft)] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--hc-accent-text)]">
                    Soon
                  </span>
                )}
              </div>
              <h2 className="mt-4 flex items-center gap-1.5 text-base font-semibold text-[var(--hc-ink)]">
                {surface.title}
                {surface.ready ? (
                  <ArrowRight
                    className="h-4 w-4 text-[var(--hc-ink-muted)] transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                ) : null}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-[var(--hc-ink-muted)]">{surface.desc}</p>
            </>
          );

          if (surface.ready && surface.href) {
            return (
              <Link
                key={surface.title}
                href={surface.href}
                className={`group ${CARD_BASE} border-[var(--hc-line)] bg-[var(--hc-surface)] hover:border-[var(--hc-accent)] hover:shadow-sm`}
              >
                {inner}
              </Link>
            );
          }
          return (
            <div
              key={surface.title}
              className={`${CARD_BASE} border-dashed border-[var(--hc-line)] bg-[var(--hc-surface)] opacity-75`}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
