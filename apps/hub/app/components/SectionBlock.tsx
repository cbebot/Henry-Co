"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { CompanyPageItem, CompanyPageSection } from "../lib/company-pages";

function itemKey(item: CompanyPageItem, index: number) {
  return item.id || item.href || item.label || item.title || `item-${index + 1}`;
}

/**
 * Editorial company-page section.
 *
 * PR #177 replaced the "wall of glass cards" with a ruled editorial register;
 * V3-PUBLIC-DESIGN-01 then moved it onto the shared `--home-*` token system so it
 * is theme-aware (warm paper ⇄ near-black) and uses the brand accent
 * (--home-accent-text) instead of the divergent hardcoded gold. Section heads use
 * the editorial serif (.home-headline → Fraunces); dense register rows stay system
 * sans for legibility across long legal documents. Section `id`s, field shapes, and
 * the layout enum are unchanged — presentation only; the statute-cited CMS copy
 * renders identically, now with real hierarchy AND theme parity.
 */
export default function SectionBlock({
  section,
  index,
}: {
  section: CompanyPageSection;
  index: number;
}) {
  const items = Array.isArray(section.items) ? section.items : [];
  const sectionNumber = String(index + 1).padStart(2, "0");
  const hasHeader = Boolean(section.eyebrow || section.title || section.body);

  return (
    <section
      id={section.id || `section-${index + 1}`}
      className="relative scroll-mt-28 border-t border-[color:var(--home-line-12)] pt-10 first:border-t-0 first:pt-0"
    >
      {hasHeader ? (
        <div className="flex gap-4 sm:gap-6">
          <span
            aria-hidden
            className="home-num hidden shrink-0 select-none pt-1.5 text-xs tracking-widest text-[color:var(--home-accent-text)] opacity-70 sm:block"
          >
            {sectionNumber}
          </span>
          <div className="max-w-3xl">
            {section.eyebrow ? (
              <div className="home-eyebrow text-[color:var(--home-accent-text)]">
                {section.eyebrow}
              </div>
            ) : null}
            {section.title ? (
              <h2 className="home-headline mt-3 text-balance">{section.title}</h2>
            ) : null}
            {section.body ? (
              // READING-01: long-form section prose reads in the editorial serif
              // (.hc-prose → Fraunces, 18px / 1.6 / capped measure) — the
              // reference reading feel. Register rows below stay system sans.
              <p className="hc-prose mt-3 text-[color:var(--home-ink-70)]">
                {section.body}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {section.image_url ? (
        <div className="mt-7 overflow-hidden rounded-2xl border border-[color:var(--home-line)]">
          <Image
            src={section.image_url}
            alt={section.title || "Section visual"}
            width={960}
            height={540}
            unoptimized
            className="h-[260px] w-full object-cover sm:h-[340px]"
          />
        </div>
      ) : null}

      {items.length ? (
        <div
          className={`divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)] ${
            hasHeader ? "mt-7" : "mt-2"
          }`}
        >
          {items.map((item, itemIndex) => (
            <SectionItem key={itemKey(item, itemIndex)} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * One register row. A heading (the item's title/label — rendered as the link
 * itself when an href is present, so the affordance is the descriptive text
 * instead of a generic "Open link"), an optional right-aligned ledger value,
 * and optional prose beneath.
 */
function SectionItem({ item }: { item: CompanyPageItem }) {
  const heading = item.title || item.label;
  const href = item.href?.trim();

  return (
    <div className="py-4">
      <div className="flex items-baseline justify-between gap-4">
        {heading ? (
          href ? (
            <a
              href={href}
              className="home-focus group inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-[color:var(--home-ink)] transition-colors hover:text-[color:var(--home-accent-text)]"
            >
              {heading}
              <ArrowUpRight
                className="h-3.5 w-3.5 text-[color:var(--home-accent-text)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          ) : (
            <h3 className="text-[15px] font-semibold tracking-tight text-[color:var(--home-ink)]">
              {heading}
            </h3>
          )
        ) : null}
        {item.value ? (
          <span className="home-num shrink-0 text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink-80)]">
            {item.value}
          </span>
        ) : null}
      </div>
      {item.body ? (
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--home-ink-65)]">
          {item.body}
        </p>
      ) : null}
    </div>
  );
}
