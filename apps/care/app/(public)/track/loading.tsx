import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function TrackLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care tracking"
        title="Pulling your live service timeline"
        subtitle="Loading the latest booking stage, payment context, and the correct service timeline."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
