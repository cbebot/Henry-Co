import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PricingLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care pricing"
        title="Loading live pricing context"
        subtitle="Pulling the current service catalog, pricing visibility, and rate detail."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
