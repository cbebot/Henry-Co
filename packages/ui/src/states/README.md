# `@henryco/ui/states` — list-state primitives

Owner-named anti-pattern (V3-05): lists conflate "loading", "you have
nothing yet", "no matches for your filter", and "the fetch errored" into
one ambiguous empty surface. The user can't tell whether they're waiting,
whether the system has nothing for them, whether their filter is wrong,
or whether something broke. The cure is four explicit branches with
semantically distinct copy + CTA + ARIA role.

## The four states

| State | When | Copy intent | CTA | Role | aria-live |
|---|---|---|---|---|---|
| `loading` | Fetch in flight | None — shape only | None | `status` | `polite` |
| `empty-yet` | Fetch succeeded, zero results, no filters | "Nothing here yet" | "Add the first item" | `status` | `polite` |
| `empty-no-match` | Fetch succeeded, zero results, filters applied | "No matches" | "Reset filters" | `status` | `polite` |
| `error` | Fetch failed | "Something went wrong" | "Try again" | `alert` | `assertive` |

Never use "Loading X" / "Preparing X" / "Warming up" / "Just a moment"
copy for the loading branch. Loading is signified by SHAPE
(`StructuredSkeleton`), not by language. The component composes
`StructuredSkeleton` directly — pass `loadingVariant` to control the
silhouette (`card-list`, `form`, `detail`, `kpi-tile`).

## Usage

```tsx
import { ListStates } from "@henryco/ui/states";

function ProductList({ products, filters, fetchError, isLoading, onResetFilters, onRetry }) {
  const state = isLoading
    ? "loading"
    : fetchError
      ? "error"
      : products.length === 0
        ? filters.hasAny ? "empty-no-match" : "empty-yet"
        : null;

  if (state === null) {
    return <ProductGrid items={products} />;
  }

  return (
    <ListStates
      state={state}
      surface="marketplace.product-list"
      loadingVariant="card-list"
      emptyYet={{
        title: "No products in this collection yet",
        body: "Stores curating this collection will appear here. Browse other collections meanwhile.",
        ctaHref: "/collections",
        ctaLabel: "Explore collections",
      }}
      emptyNoMatch={{
        title: "No products match these filters",
        body: "Try clearing a filter or two — there may be hidden inventory close by.",
        ctaLabel: "Reset filters",
        onCta: onResetFilters,
      }}
      error={{
        title: "We could not load the catalogue",
        body: "We retried twice on your behalf. Try again or refresh the page.",
        retryLabel: "Try again",
        onRetry,
      }}
    />
  );
}
```

## Why this pattern

- **Loading** is shape, not text. Users see the layout that's about to
  mount before SSR streams in — no warmup theater.
- **Empty-yet** invites the first action — the bar is intentionally
  low because the system has nothing for the user yet.
- **Empty-no-match** points at the filter, not at the system — the
  retry CTA is "reset filters" not "try again".
- **Error** uses `role="alert"` + `aria-live="assertive"` because
  the user has done nothing wrong and needs to know the system did.

## Telemetry

When `state === "loading"`, the underlying `StructuredSkeleton` emits:
- `henry.ui.skeleton.shown` on mount (surface + variant)
- `henry.ui.skeleton.exceeded_threshold` after 3s (surface + duration)

The owner-workspace slow-surface tile (V3-05 priority-2 scaffold)
queries `henry_events` for `exceeded_threshold` rows and surfaces the
top offending surfaces.
