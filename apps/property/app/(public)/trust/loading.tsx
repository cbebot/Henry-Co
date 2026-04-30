import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertyTrustLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Loading trust standards"
        subtitle="Showing how listings are verified and how disputes are handled."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      />
    </main>
  );
}
