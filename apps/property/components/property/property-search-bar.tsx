"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCcw } from "lucide-react";
import type { PropertyArea } from "@/lib/property/types";
import { PROPERTY_SEARCH_PREFS_KEY, type PropertySearchPrefsPayload } from "@/lib/property/prefs";
import type { PropertyPublicCopy } from "@/lib/public-copy";

type PropertySearchDefaults = {
  q?: string;
  kind?: string;
  area?: string;
  managed?: string;
  furnished?: string;
};

export function PropertySearchBar({
  areas,
  defaults,
  submitLabel = "Search properties",
  copy,
}: {
  areas: PropertyArea[];
  defaults?: PropertySearchDefaults;
  submitLabel?: string;
  copy?: PropertyPublicCopy;
}) {
  const defaultsKey = [
    defaults?.q || "",
    defaults?.kind || "",
    defaults?.area || "",
    defaults?.managed || "",
    defaults?.furnished || "",
  ].join("|");

  return (
    <PropertySearchBarInner
      key={defaultsKey}
      areas={areas}
      defaults={defaults}
      submitLabel={submitLabel}
      copy={copy}
    />
  );
}

function PropertySearchBarInner({
  areas,
  defaults,
  submitLabel,
  copy,
}: {
  areas: PropertyArea[];
  defaults?: PropertySearchDefaults;
  submitLabel: string;
  copy?: PropertyPublicCopy;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultsState = {
    q: defaults?.q || "",
    kind: defaults?.kind || "",
    area: defaults?.area || "",
    managed: defaults?.managed === "1",
    furnished: defaults?.furnished === "1",
  };
  const defaultsKey = JSON.stringify(defaultsState);
  const [syncedDefaultsKey, setSyncedDefaultsKey] = useState(defaultsKey);
  const [q, setQ] = useState(defaultsState.q);
  const [kind, setKind] = useState(defaultsState.kind);
  const [area, setArea] = useState(defaultsState.area);
  const [managed, setManaged] = useState(defaultsState.managed);
  const [furnished, setFurnished] = useState(defaultsState.furnished);

  if (syncedDefaultsKey !== defaultsKey) {
    setSyncedDefaultsKey(defaultsKey);
    setQ(defaultsState.q);
    setKind(defaultsState.kind);
    setArea(defaultsState.area);
    setManaged(defaultsState.managed);
    setFurnished(defaultsState.furnished);
  }

  function persistPrefs(next: { area: string; kind: string; q: string }) {
    if (typeof window === "undefined") return;
    try {
      if (!next.area) return;
      const areaName = areas.find((item) => item.slug === next.area)?.name || next.area;
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
      onSubmit={(event) => {
        event.preventDefault();
        navigate();
      }}
      aria-busy={isPending}
    >
      <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          {copy?.searchBar.search ?? "Search"}
        </span>
        <input
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={copy?.searchBar.searchPlaceholder ?? "Ikoyi penthouse, serviced residence, office suite..."}
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          {copy?.searchBar.category ?? "Category"}
        </span>
        <select
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="property-select mt-2 rounded-2xl px-4 py-3"
        >
          <option value="">{copy?.searchBar.allCategories ?? "All categories"}</option>
          <option value="rent">{copy?.searchBar.residentialRent ?? "Residential rent"}</option>
          <option value="sale">{copy?.searchBar.residentialSale ?? "Residential sale"}</option>
          <option value="commercial">{copy?.searchBar.commercial ?? "Commercial"}</option>
          <option value="managed">{copy?.searchBar.managed ?? "Managed"}</option>
          <option value="shortlet">{copy?.searchBar.shortlet ?? "Short-let"}</option>
        </select>
      </label>

      <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          {copy?.searchBar.area ?? "Area"}
        </span>
        <select
          name="area"
          value={area}
          onChange={(event) => setArea(event.target.value)}
          className="property-select mt-2 rounded-2xl px-4 py-3"
        >
          <option value="">{copy?.searchBar.allAreas ?? "All areas"}</option>
          {areas.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
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
          {isPending ? (copy?.searchBar.updatingResults ?? "Updating results") : submitLabel}
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
          {copy?.searchBar.resetFilters ?? "Reset filters"}
        </button>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--property-ink-soft)]">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="managed"
              value="1"
              checked={managed}
              onChange={(event) => setManaged(event.target.checked)}
            />
            {copy?.searchBar.managedOnly ?? "Managed only"}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="furnished"
              value="1"
              checked={furnished}
              onChange={(event) => setFurnished(event.target.checked)}
            />
            {copy?.searchBar.furnished ?? "Furnished"}
          </label>
        </div>
        <p className="text-xs text-[var(--property-ink-muted)]" aria-live="polite">
          {isPending
            ? copy?.searchBar.refreshingResults ?? "Refreshing results without losing your place."
            : copy?.searchBar.shareableFilters ?? "Filters stay in the URL so you can share the exact search or come back to it later."}
        </p>
      </div>
    </form>
  );
}
