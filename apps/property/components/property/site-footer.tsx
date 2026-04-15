import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      { href: getSharedAccountPropertyUrl("viewings"), label: "Viewings and inquiries" },
      {
        href: getSharedAccountLoginUrl({ propertyOrigin: getPropertyOrigin() }),
        label: "HenryCo account sign-in",
      },
    ],
  },
];

export function PropertySiteFooter() {
  return (
    <footer className="border-t border-[var(--property-line)] bg-[linear-gradient(180deg,rgba(17,12,9,0.14),rgba(17,12,9,0.52))]">
      <div className="mx-auto max-w-[92rem] px-5 py-14 sm:px-8 lg:px-10">
        <div className="property-panel rounded-[2.6rem] p-7 sm:p-10">
          <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="property-kicker">{property.name}</div>
              <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
                Premium property discovery with tighter moderation, calmer inquiry handling, and managed operations that continue after the listing goes live.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--property-ink-soft)]">
                HenryCo Property is built for serious renters, buyers, owners, and operators who
                want trust signals, clearer communication, and fewer low-information decisions.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="rounded-full bg-[linear-gradient(135deg,#fde8da_0%,#e9bb95_42%,#bb7542_100%)] px-5 py-3 text-sm font-semibold text-[#1c120d]"
                >
                  Browse listings
                </Link>
                <Link
                  href="/submit"
                  className="rounded-full border border-[var(--property-line)] px-5 py-3 text-sm font-semibold text-[var(--property-ink)]"
                >
                  Submit a property
                </Link>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <div className="property-kicker">{column.title}</div>
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
          </div>

          <div className="mt-10 grid gap-4 border-t border-[var(--property-line)] pt-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="text-sm leading-7 text-[var(--property-ink-soft)]">
              {property.supportEmail} · {property.supportPhone} · property.henrycogroup.com
            </div>
            <Link
              href={getSharedAccountPropertyUrl()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--property-ink)]"
            >
              Open property account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
