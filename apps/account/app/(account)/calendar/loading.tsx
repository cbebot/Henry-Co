import { PublicRouteLoader } from "@henryco/ui/public-shell";

/**
 * Account calendar route-segment loader — the calm hairline progress rail only
 * (variant="rail"). The account hub is flow mode: the Onyx brand moment is
 * reserved for public/discovery surfaces; here we keep the minimal PERF-01
 * signal so high-frequency nav never feels laggy.
 */
export default function CalendarLoading() {
  return <PublicRouteLoader variant="rail" />;
}
