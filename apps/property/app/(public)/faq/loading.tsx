import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function PropertyFaqLoading() {
  return (
    <main className="property-page property-shell">
      <PublicRouteLoader
        tone="onDark"
        eyebrow="HenryCo Property"
        title="Loading FAQ"
        subtitle="Pulling the latest answers from our property team."
        className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10"
        spinnerClassName="text-white/85"
      />
    </main>
  );
}
