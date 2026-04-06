"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { PropertyListingCard } from "@/components/property/ui";
import type { PropertyListing } from "@/lib/property/types";
import { PROPERTY_SEARCH_PREFS_KEY, type PropertySearchPrefsPayload } from "@/lib/property/prefs";

export function PropertyRecommendedForYou({
  listings,
}: {
  listings: PropertyListing[];
}) {
  const [prefs] = useState<PropertySearchPrefsPayload | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(PROPERTY_SEARCH_PREFS_KEY) : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PropertySearchPrefsPayload>;
      if (parsed && typeof parsed.areaSlug === "string" && parsed.areaSlug.trim()) {
        return {
          areaSlug: parsed.areaSlug.trim(),
          areaName: typeof parsed.areaName === "string" ? parsed.areaName : parsed.areaSlug.trim(),
          kind: typeof parsed.kind === "string" ? parsed.kind : undefined,
          q: typeof parsed.q === "string" ? parsed.q : undefined,
          updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const recs = useMemo(() => {
    if (!prefs?.areaSlug) return [];
    return listings
      .filter((l) => l.status === "approved" && l.locationSlug === prefs.areaSlug)
      .filter((l) => (prefs.kind ? l.kind === prefs.kind : true))
      .sort((a, b) => {
        const f = (x: PropertyListing) => (x.featured ? 1 : 0) + (x.promoted ? 1 : 0);
        return f(b) - f(a);
      })
      .slice(0, 3);
  }, [listings, prefs]);

  if (!prefs || recs.length === 0) return null;

  const searchHref = `/search?area=${encodeURIComponent(prefs.areaSlug)}${prefs.kind ? `&kind=${encodeURIComponent(prefs.kind)}` : ""}`;

  return (
    <section className="mx-auto mt-12 max-w-[92rem] px-5 sm:px-8 lg:px-10">
      <div className="property-panel rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="property-kicker flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--property-accent-strong)]" />
              Recommended for you
            </div>
            <h2 className="property-heading mt-3 max-w-2xl">
              Listings in {prefs.areaName}
              {prefs.kind ? ` · ${prefs.kind}` : ""}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--property-ink-soft)]">
              Based on your last area selection on this device. Clear your browser data to reset.
            </p>
          </div>
          <Link
            href={searchHref}
            className="property-button-secondary inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <MapPin className="h-4 w-4" />
            Open full search
          </Link>
        </div>
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {recs.map((listing) => (
            <PropertyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
