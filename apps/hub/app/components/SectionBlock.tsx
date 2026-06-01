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
 * Replaces the former "every section is a floating glass card, every item is a
 * dark rounded card in a 3-up grid" treatment with a ruled editorial document:
 * numbered sections separated by hairlines, with items rendered as a
 * hairline-divided register (heading · optional value · prose) rather than a
 * card grid. Section `id`s (anchor + scroll-spy targets), field shapes, and the
 * layout enum are all unchanged — this is a presentation layer only, so the
 * CMS-driven, statute-cited legal copy renders identically, just with real
 * editorial hierarchy instead of a monotonous card stack.
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
      className="relative scroll-mt-28 border-t border-white/12 pt-10 first:border-t-0 first:pt-0"
    >
      {hasHeader ? (
        <div className="flex gap-4 sm:gap-6">
          <span
            aria-hidden
            className="hidden shrink-0 select-none pt-1.5 font-mono text-xs tracking-widest text-[#d6a851]/70 sm:block"
          >
            {sectionNumber}
          </span>
          <div className="max-w-3xl">
            {section.eyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d6a851]">
                {section.eyebrow}
              </div>
            ) : null}
            {section.title ? (
              <h2 className="mt-3 text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {section.title}
              </h2>
            ) : null}
            {section.body ? (
              <p className="mt-3 text-[15px] leading-8 text-white/74">{section.body}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {section.image_url ? (
        <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
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
          className={`divide-y divide-white/10 border-y border-white/10 ${
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
              className="group inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-white transition-colors hover:text-[#e3b966]"
            >
              {heading}
              <ArrowUpRight
                className="h-3.5 w-3.5 text-[#d6a851] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          ) : (
            <h3 className="text-[15px] font-semibold tracking-tight text-white">{heading}</h3>
          )
        ) : null}
        {item.value ? (
          <span className="shrink-0 text-right text-sm font-semibold tracking-tight text-white/82">
            {item.value}
          </span>
        ) : null}
      </div>
      {item.body ? (
        <p className="mt-2 max-w-3xl text-sm leading-7 text-white/72">{item.body}</p>
      ) : null}
    </div>
  );
}
