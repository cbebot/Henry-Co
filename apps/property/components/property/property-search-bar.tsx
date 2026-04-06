"use client";

import { ArrowRight } from "lucide-react";
import type { PropertyArea } from "@/lib/property/types";
import { PROPERTY_SEARCH_PREFS_KEY, type PropertySearchPrefsPayload } from "@/lib/property/prefs";

export function PropertySearchBar({
  areas,
  defaults,
  submitLabel = "Search properties",
}: {
  areas: PropertyArea[];
  defaults?: { q?: string; kind?: string; area?: string; managed?: string; furnished?: string };
  submitLabel?: string;
}) {
  function persistPrefs(form: HTMLFormElement) {
    if (typeof window === "undefined") return;
    try {
      const fd = new FormData(form);
      const area = String(fd.get("area") || "").trim();
      const kind = String(fd.get("kind") || "").trim();
      const q = String(fd.get("q") || "").trim();
      if (!area) return;
      const areaName = areas.find((a) => a.slug === area)?.name || area;
      const payload: PropertySearchPrefsPayload = {
        areaSlug: area,
        areaName,
        kind: kind || undefined,
        q: q || undefined,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(PROPERTY_SEARCH_PREFS_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / privacy mode */
    }
  }

  return (
    <form
      action="/search"
      method="GET"
      className="property-paper grid gap-4 rounded-[1.9rem] p-5 lg:grid-cols-[1.4fr,0.9fr,0.9fr,auto]"
      onSubmit={(e) => persistPrefs(e.currentTarget)}
    >
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Search
        </span>
        <input
          name="q"
          defaultValue={defaults?.q || ""}
          placeholder="Ikoyi penthouse, serviced residence, office suite..."
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Category
        </span>
        <select
          name="kind"
          defaultValue={defaults?.kind || ""}
          className="property-select mt-2 rounded-2xl px-4 py-3"
        >
          <option value="">All categories</option>
          <option value="rent">Residential rent</option>
          <option value="sale">Residential sale</option>
          <option value="commercial">Commercial</option>
          <option value="managed">Managed</option>
          <option value="shortlet">Short-let</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Area
        </span>
        <select
          name="area"
          defaultValue={defaults?.area || ""}
          className="property-select mt-2 rounded-2xl px-4 py-3"
        >
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.slug}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col justify-end gap-3">
        <button
          type="submit"
          className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--property-ink-soft)]">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="managed" value="1" defaultChecked={defaults?.managed === "1"} />
            Managed only
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="furnished"
              value="1"
              defaultChecked={defaults?.furnished === "1"}
            />
            Furnished
          </label>
        </div>
      </div>
    </form>
  );
}
