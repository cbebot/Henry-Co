/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ArrowRight, LifeBuoy, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { getHubUrl } from "@henryco/config";
import type { DivisionPublicConfig } from "@/components/public/CareNavbar";

function FooterBrandMark({
  name,
  shortName,
  logoUrl,
}: {
  name: string;
  shortName?: string;
  logoUrl?: string | null;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);
  const fallback = (shortName || name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
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
        <span className="text-sm font-black tracking-tight text-white">{fallback || "HC"}</span>
      )}
    </div>
  );
}

export default function CareFooter({ division }: { division: DivisionPublicConfig }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-black/8 bg-[#071020] text-white backdrop-blur-2xl">
      <div className="mx-auto grid max-w-[88rem] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div className="care-dash-card rounded-[2rem] p-7">
          <div className="flex items-center gap-3">
            <FooterBrandMark
              name={division.name}
              shortName={division.shortName}
              logoUrl={division.logoUrl}
            />
            <div>
              <div className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.03em]">
                {division.name}
              </div>
              <div className="text-sm text-white/56">
                Garment care, home cleaning, office cleaning, and pickup delivery
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-7 text-white/66">
            HenryCo Care helps clients keep wardrobes, homes, and workplaces in excellent
            condition with clear booking, dependable timing, careful handling, and responsive
            support from the first request to the final finish.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                <LifeBuoy className="h-4 w-4" />
                Care desk
              </div>
              <div className="mt-3 text-sm text-white/72">
                {division.supportEmail ?? "care@henrycogroup.com"}
              </div>
              <div className="mt-1 text-sm text-white/72">
                {division.supportPhone ?? "+234 000 000 0000"}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
                Why clients return
              </div>
              <div className="mt-3 text-sm text-white/72">
                Clear booking, visible progress, professional handling, and a finish that feels complete.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
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
            title="Company"
            items={[
              { href: "/about", label: "About HenryCo Care" },
              { href: "/contact", label: "Contact and support" },
              { href: "/book", label: "Book a service" },
              { href: "/track", label: "Track a booking" },
            ]}
          />

          <div className="care-dash-card rounded-[2rem] p-6 sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Start with confidence
            </div>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em] text-white">
              Book once, stay informed, and keep support close.
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Whether the request is for garment pickup and delivery, home cleaning, or office
              cleaning, the experience stays clear, polished, and easy to follow.
            </p>

            <Link
              href="/book"
              className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              Book now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[84rem] flex-col gap-3 px-5 py-5 text-xs uppercase tracking-[0.16em] text-white/46 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>© {year} {division.name}. Premium care services for garments, homes, and workplaces.</div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-4 normal-case tracking-normal">
              <a
                href={getHubUrl("/terms")}
                className="text-white/70 underline-offset-4 transition hover:text-white hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms
              </a>
              <a
                href={getHubUrl("/privacy")}
                className="text-white/70 underline-offset-4 transition hover:text-white hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy
              </a>
            </div>
            <div>Pickup delivery • Home cleaning • Office cleaning • Steady support</div>
          </div>
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
  items: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="care-dash-card rounded-[2rem] p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
        {title}
      </div>
      <div className="mt-4 grid gap-3 text-sm text-white/72">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="transition hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
