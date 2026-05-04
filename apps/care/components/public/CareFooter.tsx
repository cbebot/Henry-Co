/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import { getHubUrl } from "@henryco/config";
import type { DivisionPublicConfig } from "@/components/public/CareNavbar";
import { CareMonogram } from "@/components/brand/CareMonogram";

function FooterBrandMark({
  name,
  logoUrl,
  accent,
}: {
  name: string;
  shortName?: string;
  logoUrl?: string | null;
  accent?: string | null;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);

  return (
    <div
      className="
        grid h-10 w-10 place-items-center overflow-hidden rounded-xl
        border border-black/10 bg-white/72 text-zinc-950
        dark:border-white/10 dark:bg-white/[0.06] dark:text-white
      "
    >
      {cleanSrc && !isFailed ? (
        <img
          src={cleanSrc}
          alt={name}
          className="h-full w-full object-contain p-1"
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(cleanSrc)}
        />
      ) : (
        <CareMonogram size={26} accent={accent || "#6B7CFF"} />
      )}
    </div>
  );
}

export default function CareFooter({ division }: { division: DivisionPublicConfig }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className="
        mt-20 border-t backdrop-blur-2xl
        border-black/10 bg-[var(--care-bg-soft)] text-zinc-900
        dark:border-white/10 dark:bg-[#071020] dark:text-white
      "
    >
      <div
        aria-hidden
        className="pointer-events-none mx-auto h-px max-w-[88rem] bg-gradient-to-r from-transparent via-[color:var(--accent)]/40 to-transparent"
      />
      <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-10">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <FooterBrandMark
              name={division.name}
              shortName={division.shortName}
              logoUrl={division.logoUrl}
              accent={division.accent}
            />
            <div>
              <div className="text-base font-semibold tracking-[-0.01em] text-zinc-950 dark:text-white">
                {division.name}
              </div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
                Care
              </div>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-zinc-600 dark:text-white/66">
            Garment care, home cleaning, office cleaning, and pickup delivery — clear booking,
            careful handling, and responsive support from request to finish.
          </p>
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-zinc-900 dark:text-white">
              {division.supportEmail ?? "care@henrycogroup.com"}
            </p>
            <p className="text-zinc-500 dark:text-white/55">
              {division.supportPhone ?? "+234 000 000 0000"}
            </p>
          </div>
        </div>

        <FooterColumn
          title="Explore"
          items={[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services" },
            { href: "/pricing", label: "Pricing" },
            { href: "/review", label: "Reviews" },
          ]}
        />
        <FooterColumn
          title="Booking"
          items={[
            { href: "/book", label: "Book a service" },
            { href: "/track", label: "Track a booking" },
            { href: "/about", label: "About HenryCo Care" },
            { href: "/contact", label: "Contact and support" },
          ]}
        />
        <FooterColumn
          title="HenryCo"
          items={[
            { href: getHubUrl("/"), label: "HenryCo group", external: true },
            { href: getHubUrl("/preferences"), label: "Preferences", external: true },
            { href: getHubUrl("/privacy"), label: "Privacy", external: true },
            { href: getHubUrl("/terms"), label: "Terms", external: true },
          ]}
        />
      </div>

      <div className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-[88rem] flex-col items-start gap-3 px-5 py-5 text-xs text-zinc-500 dark:text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>© {year} {division.name}. All rights reserved.</div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]/85" />
            Designed and built in-house by HenryCo Studio for the HenryCo ecosystem
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/55">
        {title}
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        {items.map((item) =>
          item.external ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-600 transition hover:text-zinc-950 dark:text-white/75 dark:hover:text-white"
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-600 transition hover:text-zinc-950 dark:text-white/75 dark:hover:text-white"
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
