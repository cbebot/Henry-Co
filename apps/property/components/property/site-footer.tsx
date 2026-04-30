import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import { getPropertyOrigin, getSharedAccountLoginUrl, getSharedAccountPropertyUrl } from "@/lib/property/links";

const property = getDivisionConfig("property");

const footerColumns = [
  {
    title: "Discover",
    links: [
      { href: "/search", label: "Search listings" },
      { href: "/managed", label: "Managed properties" },
      { href: "/trust", label: "Trust standards" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Owners and agents",
    links: [
      { href: "/submit", label: "Submit a listing" },
      { href: "/agent", label: "Agent surface" },
      { href: getSharedAccountPropertyUrl("viewings"), label: "Viewings and inquiries" },
      { href: getSharedAccountPropertyUrl("listings"), label: "Listing activity" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: getSharedAccountPropertyUrl(), label: "Property activity" },
      {
        href: getSharedAccountLoginUrl({ propertyOrigin: getPropertyOrigin() }),
        label: "HenryCo account sign-in",
      },
    ],
  },
];

export function PropertySiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--property-line)] bg-[linear-gradient(180deg,rgba(17,12,9,0.14),rgba(17,12,9,0.52))]">
      <div
        aria-hidden
        className="pointer-events-none mx-auto h-px max-w-[92rem] bg-gradient-to-r from-transparent via-[var(--property-accent-strong)]/40 to-transparent"
      />
      <div className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <div className="property-kicker">{property.name}</div>
            <p className="max-w-md text-sm leading-7 text-[var(--property-ink-soft)]">
              Property discovery with tighter moderation and calmer inquiry handling — built for
              serious renters, buyers, owners, and operators.
            </p>
            <div className="space-y-1.5 text-sm text-[var(--property-ink-soft)]">
              <p className="font-medium text-[var(--property-ink)]">{property.supportEmail}</p>
              <p>{property.supportPhone}</p>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                {column.title}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {column.links.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-[var(--property-ink-soft)] transition hover:text-[var(--property-ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-3 border-t border-[var(--property-line)] pt-5 text-xs text-[var(--property-ink-soft)]/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>&copy; {new Date().getFullYear()} {property.name}. All rights reserved.</span>
            <Link href="/trust" className="transition hover:text-[var(--property-ink)]">
              Trust
            </Link>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--property-accent-strong)]" />
            Designed and built in-house by HenryCo Studio for the HenryCo ecosystem
          </span>
        </div>
      </div>
    </footer>
  );
}
