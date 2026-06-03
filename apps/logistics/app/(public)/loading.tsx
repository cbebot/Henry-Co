import { PublicRouteLoader } from "@henryco/ui/public-shell";

// Public loading state — renders INSIDE the (public) shell's .home-accent-scope,
// so the shared loader inherits the light --home-* theme (no dark flash).
export default function LogisticsPublicLoading() {
  return <PublicRouteLoader />;
}
