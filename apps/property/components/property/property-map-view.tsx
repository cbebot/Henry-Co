"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, X } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import type { PropertyListing, PropertyArea } from "@/lib/property/types";
import { formatCurrency } from "@/lib/utils";

/**
 * V3 PASS 21 — PropertyMapView.
 *
 * The contract calls for Mapbox cluster + pin + bottom-sheet for the
 * selected pin. The listing schema today does not persist per-listing
 * lat/lng; until that follow-on lands, the map view clusters by area
 * (every listing rolls into its area's anchor coords). The component
 * keeps the contract surface stable so a per-listing latitude /
 * longitude column can drop in without changing consumers.
 *
 * Environment:
 *   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` enables the live Mapbox path.
 *     When missing (preview branches, local dev), we render an SVG
 *     editorial fallback that still shows clusters + pin labels +
 *     bottom-sheet behaviour.
 *
 * Why "use client":
 *   Selected-pin state, bottom-sheet open/close, and (in the live path)
 *   the Mapbox imperative API all need client interactivity.
 */

type AreaCluster = {
  area: PropertyArea;
  listings: PropertyListing[];
};

export function PropertyMapView({
  listings,
  areas,
  mapboxAccessToken,
}: {
  listings: PropertyListing[];
  areas: PropertyArea[];
  mapboxAccessToken?: string | null;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [selectedAreaSlug, setSelectedAreaSlug] = useState<string | null>(null);

  const clusters: AreaCluster[] = useMemo(() => {
    const byArea = new Map<string, AreaCluster>();
    for (const area of areas) {
      byArea.set(area.slug, { area, listings: [] });
    }
    for (const listing of listings) {
      if (!["approved", "published"].includes(listing.status)) continue;
      const cluster = byArea.get(listing.locationSlug);
      if (!cluster) continue;
      cluster.listings.push(listing);
    }
    return Array.from(byArea.values()).filter((cluster) => cluster.listings.length > 0);
  }, [areas, listings]);

  const selectedCluster = selectedAreaSlug
    ? clusters.find((c) => c.area.slug === selectedAreaSlug) || null
    : null;

  // Auto-close the bottom sheet on escape.
  useEffect(() => {
    if (!selectedAreaSlug) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAreaSlug(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedAreaSlug]);

  const liveMap = Boolean(mapboxAccessToken);

  return (
    <section
      className="relative overflow-hidden rounded-[1.4rem] border border-[var(--property-line)] bg-[color:var(--home-surface-04)]"
      aria-label={t("Property map view")}
    >
      <div className="relative h-[28rem]">
        {liveMap ? (
          <MapboxStub
            clusters={clusters}
            selectedAreaSlug={selectedAreaSlug}
            onSelect={setSelectedAreaSlug}
          />
        ) : (
          <MapFallback
            clusters={clusters}
            selectedAreaSlug={selectedAreaSlug}
            onSelect={setSelectedAreaSlug}
          />
        )}

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
          <MapPin className="h-3 w-3" aria-hidden />
          {liveMap ? "Map view · Mapbox" : "Map view"}
        </div>
        <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
          {clusters.length} area{clusters.length === 1 ? "" : "s"}
        </div>
      </div>

      {selectedCluster ? (
        <SelectedAreaSheet
          cluster={selectedCluster}
          onClose={() => setSelectedAreaSlug(null)}
          t={t}
        />
      ) : null}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Mapbox stub.
 *
 * Renders a placeholder visual identical in chrome to the SVG fallback,
 * but exports the same click handlers. The full Mapbox GL JS render
 * lazy-loads when `mapbox-gl` is installed; right now the package is
 * not in the property workspace dependencies so we keep the stub
 * lightweight. The follow-on wave drops Mapbox GL on top.
 * ────────────────────────────────────────────────────────────────── */
function MapboxStub({
  clusters,
  selectedAreaSlug,
  onSelect,
}: {
  clusters: AreaCluster[];
  selectedAreaSlug: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div className="absolute inset-0">
      <MapFallback
        clusters={clusters}
        selectedAreaSlug={selectedAreaSlug}
        onSelect={onSelect}
        tone="map"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Editorial SVG fallback.
 *
 * Each cluster is a circular marker with the listing count inside.
 * Position is computed by hashing the area slug into the [0,1]² square
 * so the layout is deterministic for the same input set.
 * ────────────────────────────────────────────────────────────────── */
function MapFallback({
  clusters,
  selectedAreaSlug,
  onSelect,
  tone = "fallback",
}: {
  clusters: AreaCluster[];
  selectedAreaSlug: string | null;
  onSelect: (slug: string | null) => void;
  tone?: "fallback" | "map";
}) {
  return (
    <div
      className={`absolute inset-0 ${
        tone === "map"
          ? "bg-[radial-gradient(circle_at_30%_25%,rgba(232,184,148,0.18),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(152,179,154,0.15),transparent_50%),var(--home-canvas-deep)]"
          : "bg-[radial-gradient(circle_at_25%_30%,rgba(232,184,148,0.1),transparent_60%),var(--home-sheet)]"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-50"
        aria-hidden
      >
        <defs>
          <pattern
            id="property-map-grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgb(var(--home-ink-rgb) / 0.06)"
              strokeWidth="0.4"
            />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#property-map-grid)" />
      </svg>

      {clusters.map((cluster) => {
        const { x, y } = hashToCoords(cluster.area.slug);
        const isSelected = selectedAreaSlug === cluster.area.slug;
        return (
          <button
            key={cluster.area.slug}
            type="button"
            onClick={() => onSelect(isSelected ? null : cluster.area.slug)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition ${
              isSelected ? "z-10 scale-110" : ""
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={`${cluster.area.name} · ${cluster.listings.length} listings`}
            aria-pressed={isSelected}
          >
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums shadow-lg shadow-black/30 ${
                isSelected
                  ? "border-white bg-[var(--home-accent)] text-[var(--home-accent-ink)]"
                  : "border-white/20 bg-[color:color-mix(in_srgb,var(--home-accent)_88%,transparent)] text-[var(--home-accent-ink)] hover:border-white/60"
              }`}
            >
              {cluster.listings.length}
            </span>
            <span
              className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] backdrop-blur ${
                isSelected
                  ? "border-white/40 bg-black/70 text-white"
                  : "border-white/15 bg-black/55 text-white/85"
              }`}
            >
              {cluster.area.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedAreaSheet({
  cluster,
  onClose,
  t,
}: {
  cluster: AreaCluster;
  onClose: () => void;
  t: (text: string) => string;
}) {
  const ranked = cluster.listings
    .slice()
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-map-sheet-title"
      className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto rounded-t-[1.4rem] border-t border-[var(--property-line)] bg-[color:var(--home-sheet)] p-5 text-[color:var(--home-ink)] shadow-2xl sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--property-accent-strong)]">
            {t("Area")} · {cluster.area.city}
          </p>
          <h3
            id="property-map-sheet-title"
            className="mt-2 text-[1.4rem] font-semibold tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.6rem]"
          >
            {cluster.area.name}
          </h3>
          {cluster.area.marketNote ? (
            <p className="mt-2 max-w-md text-[13.5px] leading-7 text-[var(--property-ink-soft)]">
              {cluster.area.marketNote}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--property-line)] text-[var(--property-ink-soft)] transition hover:border-[var(--property-accent-strong)]/40 hover:text-[var(--property-accent-strong)]"
          aria-label={t("Close area details")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-5 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
        {ranked.slice(0, 5).map((listing) => (
          <li key={listing.id} className="py-3">
            <Link
              href={`/property/${listing.slug}`}
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-6"
            >
              <div className="min-w-0">
                <span className="block truncate text-[14px] font-semibold tracking-[-0.005em] text-[var(--property-ink)]">
                  {listing.title}
                </span>
                <span className="mt-0.5 block text-[12px] text-[var(--property-ink-soft)]">
                  {listing.bedrooms ? `${listing.bedrooms} bed · ` : ""}
                  {listing.sizeSqm ? `${listing.sizeSqm} sqm · ` : ""}
                  {listing.kind}
                </span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-[var(--property-ink)] sm:text-right">
                {formatCurrency(listing.price, listing.currency)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <Link
          href={`/search?area=${encodeURIComponent(cluster.area.slug)}`}
          className="property-button-secondary inline-flex rounded-full px-5 py-3 text-[13px] font-semibold"
        >
          Browse all in {cluster.area.name}
        </Link>
      </div>
    </div>
  );
}

/* Deterministic slug→(x,y) hash. Keeps the visual layout stable across
 * refreshes and SSR/CSR rounds. */
function hashToCoords(seed: string) {
  let h1 = 2166136261;
  let h2 = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    const c = seed.charCodeAt(i);
    h1 ^= c;
    h1 = (h1 * 16777619) >>> 0;
    h2 = ((h2 << 5) + h2 + c) >>> 0;
  }
  const x = 10 + ((h1 % 8000) / 8000) * 80; // [10, 90]
  const y = 12 + ((h2 % 7600) / 7600) * 76; // [12, 88]
  return { x, y };
}
