"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCcw } from "lucide-react";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(defaults?.q || "");
  const [kind, setKind] = useState(defaults?.kind || "");
  const [area, setArea] = useState(defaults?.area || "");
  const [managed, setManaged] = useState(defaults?.managed === "1");
  const [furnished, setFurnished] = useState(defaults?.furnished === "1");
  const searchId = useId();
  const kindId = useId();
  const areaId = useId();
  const managedId = useId();
  const furnishedId = useId();
  const helpId = useId();

  function persistPrefs(next: { area: string; kind: string; q: string }) {
    if (typeof window === "undefined") return;
    try {
      if (!next.area) return;
      const areaName = areas.find((a) => a.slug === next.area)?.name || next.area;
      const payload: PropertySearchPrefsPayload = {
        areaSlug: next.area,
        areaName,
        kind: next.kind || undefined,
        q: next.q || undefined,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(PROPERTY_SEARCH_PREFS_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / privacy mode */
    }
  }

  function navigate(next?: {
    q?: string;
    kind?: string;
    area?: string;
    managed?: boolean;
    furnished?: boolean;
  }) {
    const state = {
      q: next?.q ?? q,
      kind: next?.kind ?? kind,
      area: next?.area ?? area,
      managed: next?.managed ?? managed,
      furnished: next?.furnished ?? furnished,
    };
    const params = new URLSearchParams();
    if (state.q.trim()) params.set("q", state.q.trim());
    if (state.kind.trim()) params.set("kind", state.kind.trim());
    if (state.area.trim()) params.set("area", state.area.trim());
    if (state.managed) params.set("managed", "1");
    if (state.furnished) params.set("furnished", "1");

    persistPrefs({ area: state.area, kind: state.kind, q: state.q });

    const href = params.size ? `/search?${params.toString()}` : "/search";
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  const hasActiveFilters = Boolean(q.trim() || kind || area || managed || furnished);

  return (
    <form
      className="property-paper grid gap-4 rounded-[1.9rem] p-5 lg:grid-cols-[1.4fr,0.9fr,0.9fr,auto]"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        navigate();
      }}
      aria-busy={isPending}
      aria-describedby={helpId}
    >
      <label className="block" htmlFor={searchId}>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Search
        </span>
        <input
          id={searchId}
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Ikoyi penthouse, serviced residence, office suite..."
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block" htmlFor={kindId}>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Category
        </span>
        <select
          id={kindId}
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
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

      <label className="block" htmlFor={areaId}>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Area
        </span>
        <select
          id={areaId}
          name="area"
          value={area}
          onChange={(event) => setArea(event.target.value)}
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
          disabled={isPending}
          className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          {isPending ? "Updating results" : submitLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setQ("");
            setKind("");
            setArea("");
            setManaged(false);
            setFurnished(false);
            navigate({ q: "", kind: "", area: "", managed: false, furnished: false });
          }}
          disabled={!hasActiveFilters || isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--property-line)] px-4 py-2 text-xs font-semibold text-[var(--property-ink-soft)] transition hover:border-[var(--property-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Reset filters
        </button>
        <fieldset className="flex flex-wrap gap-3 text-xs text-[var(--property-ink-soft)]">
          <legend className="sr-only">Property filters</legend>
          <label className="inline-flex items-center gap-2" htmlFor={managedId}>
            <input
              id={managedId}
              type="checkbox"
              name="managed"
              value="1"
              checked={managed}
              onChange={(event) => setManaged(event.target.checked)}
            />
            Managed only
          </label>
          <label className="inline-flex items-center gap-2" htmlFor={furnishedId}>
            <input
              id={furnishedId}
              type="checkbox"
              name="furnished"
              value="1"
              checked={furnished}
              onChange={(event) => setFurnished(event.target.checked)}
            />
            Furnished
          </label>
        </fieldset>
        <p id={helpId} className="text-xs text-[var(--property-ink-muted)]" aria-live="polite">
          {isPending
            ? "Refreshing results without losing your place."
            : "Filters stay in the URL so you can share the exact search or come back to it later."}
        </p>
      </div>
    </form>
  );
}
