import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";

const studio = getDivisionConfig("studio");

const footerColumns = [
  {
    title: "Platform",
    links: [
      { href: "/services", label: "Services" },
      { href: "/pricing", label: "Packages" },
      { href: "/work", label: "Case studies" },
      { href: "/teams", label: "Teams" },
    ],
  },
  {
    title: "Buying flow",
    links: [
      { href: "/request", label: "Start a project" },
      { href: "/process", label: "Process" },
      { href: "/trust", label: "Trust" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { href: "__ACCOUNT__", label: "HenryCo account" },
      { href: "__LOGIN__", label: "Shared sign in" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function StudioSiteFooter({
  supportEmail,
  supportPhone,
  accountHref,
  loginHref,
}: {
  supportEmail: string | null;
  supportPhone: string | null;
  accountHref: string;
  loginHref: string;
}) {
  const columns = footerColumns.map((column) => ({
    ...column,
    links: column.links.map((link) => ({
      ...link,
      href:
        link.href === "__ACCOUNT__" ? accountHref : link.href === "__LOGIN__" ? loginHref : link.href,
    })),
  }));

  return (
    <footer className="border-t border-[var(--studio-line)] bg-[linear-gradient(180deg,rgba(5,12,17,0.2),rgba(5,12,17,0.6))]">
      <div className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 lg:px-10">
        <div className="studio-panel rounded-[2.6rem] p-7 sm:p-10">
          <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="studio-kicker">HenryCo Studio</div>
              <h2 className="mt-5 max-w-3xl text-balance text-[2rem] font-semibold tracking-[-0.035em] text-[var(--studio-ink)] sm:text-[2.25rem] leading-[1.15]">
                Serious software, delivered with sharper process and cleaner handoff.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--studio-ink-soft)]">
                Studio qualifies your project, routes it to the right team, structures milestone pricing, and keeps delivery visible from first brief to final launch.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  "Package path and custom path, both premium.",
                  "Proposals, payments, files, and revisions on one record.",
                  "Project history lives inside your HenryCo account.",
                ].map((item) => (
                  <div key={item} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/request"
                  className="rounded-full bg-[linear-gradient(135deg,#cfe9ef_0%,#83ebe8_46%,#46aab4_100%)] px-5 py-3 text-sm font-semibold text-[#041117]"
                >
                  Start a Studio project
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-[var(--studio-line)] px-5 py-3 text-sm font-semibold text-[var(--studio-ink)]"
                >
                  Speak to Studio
                </Link>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title}>
                  <div className="studio-kicker">{column.title}</div>
                  <div className="mt-4 flex flex-col gap-3">
                    {column.links.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-sm text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 border-t border-[var(--studio-line)] pt-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="text-sm leading-7 text-[var(--studio-ink-soft)]">
              {supportEmail || studio.supportEmail} &middot; {supportPhone || studio.supportPhone} &middot; studio.henrycogroup.com
            </div>
            <Link
              href={accountHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--studio-ink)]"
            >
              Open HenryCo account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-[92rem] flex-col items-start gap-3 px-1 text-xs text-[var(--studio-ink-soft)]/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            &copy; {new Date().getFullYear()} HenryCo Studio. All rights reserved.
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--studio-signal)]" />
            Designed by HenryCo Studio
          </span>
        </div>
      </div>
    </footer>
  );
}
