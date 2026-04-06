import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PublicLoading() {
  return (
    <main className="care-page min-h-screen bg-[#08101C] px-5 py-6 sm:px-8 sm:py-8">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="Henry & Co. Care"
        title="Preparing the public Care experience"
        subtitle="Loading live service menus, pricing context, and the next polished route."
        spinnerClassName="text-[color:var(--accent)]"
      />
    </main>
  );
}
