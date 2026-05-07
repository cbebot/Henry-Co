"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { CompanyPageItem, CompanyPageSection } from "../lib/company-pages";

function itemKey(item: CompanyPageItem, index: number) {
  return item.id || item.href || item.label || item.title || `item-${index + 1}`;
}

export default function SectionBlock({
  section,
  index,
}: {
  section: CompanyPageSection;
  index: number;
}) {
  const layout = section.layout || "default";
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <section
      id={section.id || `section-${index + 1}`}
      className="relative scroll-mt-28 rounded-[34px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_14px_32px_rgba(0,0,0,0.16)] backdrop-blur-0 md:shadow-[0_24px_100px_rgba(0,0,0,0.18)] md:backdrop-blur-xl sm:p-8"
    >
      {(section.eyebrow || section.title || section.body) && (
        <div className="max-w-3xl">
          {section.eyebrow ? (
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/56">
              {section.eyebrow}
            </div>
          ) : null}

          {section.title ? (
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {section.title}
            </h2>
          ) : null}

          {section.body ? (
            <p className="mt-3 text-sm leading-8 text-white/66 sm:text-base">
              {section.body}
            </p>
          ) : null}
        </div>
      )}

      {section.image_url ? (
        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
          <Image
            src={section.image_url}
            alt={section.title || "Section visual"}
            width={960}
            height={540}
            unoptimized
            className="h-[280px] w-full object-cover sm:h-[360px]"
          />
        </div>
      ) : null}

      {layout === "cards" || layout === "grid" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, itemIndex) => (
            <CardItem key={itemKey(item, itemIndex)} item={item} />
          ))}
        </div>
      ) : layout === "legal" ? (
        <div className="mt-8 space-y-4">
          {items.map((item, itemIndex) => (
            <LegalItem key={itemKey(item, itemIndex)} item={item} />
          ))}
        </div>
      ) : layout === "timeline" ? (
        <div className="mt-8 space-y-4">
          {items.map((item, itemIndex) => (
            <TimelineItem key={itemKey(item, itemIndex)} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, itemIndex) => (
            <StatCard key={itemKey(item, itemIndex)} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function CardItem({ item }: { item: CompanyPageItem }) {
  const content = item.title || item.label || "Item";
  const href = item.href?.trim();

  return (
    <article className="rounded-[28px] border border-white/10 bg-black/25 p-5">
      <div className="text-lg font-semibold text-white">{content}</div>

      {item.body ? (
        <p className="mt-3 text-sm leading-7 text-white/66">{item.body}</p>
      ) : null}

      {item.value ? (
        <div className="mt-4 text-sm font-medium text-white/82">{item.value}</div>
      ) : null}

      {href ? (
        <a
          href={href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--accent)]"
        >
          Open link
          <ArrowRight className="h-4 w-4" />
        </a>
      ) : null}
    </article>
  );
}

function LegalItem({ item }: { item: CompanyPageItem }) {
  const heading = item.title || item.label || "Clause";

  return (
    <article className="rounded-[28px] border border-white/10 bg-black/25 p-5">
      <div className="text-base font-semibold text-white">{heading}</div>

      {item.body ? (
        <p className="mt-3 text-sm leading-8 text-white/66">{item.body}</p>
      ) : null}

      {item.value ? (
        <p className="mt-3 text-sm leading-8 text-white/66">{item.value}</p>
      ) : null}
    </article>
  );
}

function TimelineItem({ item }: { item: CompanyPageItem }) {
  return (
    <div className="flex gap-4 rounded-[28px] border border-white/10 bg-black/25 p-5">
      <div className="mt-1 h-3 w-3 rounded-full bg-[color:var(--accent)] shadow-[0_0_18px_rgba(201,162,39,0.5)]" />
      <div className="min-w-0">
        <div className="text-base font-semibold text-white">
          {item.title || item.label || "Milestone"}
        </div>
        {item.body ? (
          <p className="mt-2 text-sm leading-7 text-white/66">{item.body}</p>
        ) : null}
        {item.value ? (
          <div className="mt-2 text-sm font-medium text-white/82">{item.value}</div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ item }: { item: CompanyPageItem }) {
  const heading = item.label || item.title || "Detail";

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
        {heading}
      </div>

      {item.value ? (
        <div className="mt-2 text-xl font-semibold tracking-tight text-white">
          {item.value}
        </div>
      ) : null}

      {item.title && item.title !== heading ? (
        <div className="mt-2 text-base font-semibold text-white">{item.title}</div>
      ) : null}

      {item.body ? (
        <p className="mt-3 text-sm leading-7 text-white/66">{item.body}</p>
      ) : null}

      {item.href ? (
        <a
          href={item.href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--accent)]"
        >
          Open link
          <ChevronRight className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}
