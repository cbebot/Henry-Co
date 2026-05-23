/**
 * @henryco/ui loading primitives.
 *
 * - `HenryCoBrandedSpinner` / `HenryCoActivityIndicator` — branded amber
 *   glyph. Use for inline pending states inside buttons + composer chrome.
 * - `ButtonPendingContent` / `FormPendingButton` — form-action helpers.
 * - `StructuredSkeleton` — V3-05 in-page loading shape. Use as the
 *   default for `<Suspense>` fallbacks and in-flight list/form/detail
 *   wrappers. Replaces "Loading X" / "Preparing X" warmup copy.
 *
 * Note: route-level loading (Next.js `loading.tsx`) continues to use
 * `PublicRouteLoader` from `@henryco/ui` (the thin top progress bar
 * established by PERF-01). StructuredSkeleton extends that primitive;
 * it does not replace it.
 */
export { HenryCoActivityIndicator } from "./HenryCoActivityIndicator";
export { HenryCoBrandedSpinner } from "./HenryCoBrandedSpinner";
export { ButtonPendingContent } from "./ButtonPendingContent";
export { FormPendingButton } from "./FormPendingButton";
export {
  StructuredSkeleton,
  type StructuredSkeletonProps,
  type StructuredSkeletonTone,
  type StructuredSkeletonVariant,
} from "./structured-skeleton";
