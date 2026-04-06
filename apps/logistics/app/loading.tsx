import { PublicRouteLoader } from "@henryco/ui/public-shell";

export default function LogisticsLoading() {
  return (
    <PublicRouteLoader
      tone="onDark"
      title="Loading logistics"
      subtitle="Preparing shipping, tracking, and delivery services."
    />
  );
}
