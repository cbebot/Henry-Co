import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function AboutLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care"
        title="Preparing the Care story"
        subtitle="Loading the service story, operating standards, and the next public section."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
