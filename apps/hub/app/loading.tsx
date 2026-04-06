import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function Loading() {
  return (
    <PublicRouteLoader
      tone="onDark"
      eyebrow="Henry & Co."
      title="Loading the HenryCo public hub"
      subtitle="Preparing divisions, shared preferences, and the current public route."
      className="min-h-screen bg-[#040814] px-6"
      spinnerClassName="text-[color:var(--accent,#C9A227)]"
    />
  );
}
