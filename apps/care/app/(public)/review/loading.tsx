import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function ReviewLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care reviews"
        title="Preparing the verified review desk"
        subtitle="Loading review guidance, verification cues, and the live submission surface."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
