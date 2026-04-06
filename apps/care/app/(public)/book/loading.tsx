import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function BookLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care booking"
        title="Preparing your booking workspace"
        subtitle="Loading service pricing, payment guidance, and the live booking form."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
