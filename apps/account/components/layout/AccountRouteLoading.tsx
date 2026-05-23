import { StructuredSkeleton } from "@henryco/ui";

/**
 * V3-05 (S2) — Account route fallback.
 *
 * Previously rendered a centered branded spinner with `title` + `description`
 * props that paint as text on first response. Even with restrained copy
 * ("Loading Learn" + "Loading your courses, progress signals, and
 * certificates.") this still reads as warmup theater the moment the route
 * fallback is shown across every account section.
 *
 * Replaced with `StructuredSkeleton variant="card-list"` so the user sees
 * the SHAPE of the account view that's about to mount (rows of cards
 * matching wallet / jobs / learn / studio tiles) instead of natural-
 * language warmup copy. After 3s the StructuredSkeleton itself surfaces
 * a "Still loading — this is taking longer than usual" panel (via the
 * V3-05 telemetry-aware primitive), so genuinely slow surfaces still
 * announce themselves correctly.
 *
 * Props `title` / `description` are kept on the type for backwards
 * compatibility with the dozens of call sites but are intentionally
 * ignored at the visible layer. They become a `surface` hint for the
 * skeleton telemetry — `title` (e.g. "Loading Learn") is stripped of
 * the "Loading " prefix and used as the surface id.
 */
export default function AccountRouteLoading({
  title,
  description: _description,
}: {
  title?: string;
  description?: string;
}) {
  const surface = title
    ? title.replace(/^Loading\s+/i, "account.").toLowerCase().replace(/\s+/g, "-")
    : "account.unknown";
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <StructuredSkeleton variant="card-list" surface={surface} count={4} />
      </div>
    </div>
  );
}
