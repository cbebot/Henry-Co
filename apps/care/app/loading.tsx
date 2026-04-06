import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function RootLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care"
        title="Loading Henry & Co. Care"
        subtitle="Preparing your bookings, tracking, and support services."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
