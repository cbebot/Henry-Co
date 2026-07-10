import { translateSurfaceLabel } from "@henryco/i18n";
import { getHubPublicLocale } from "@/lib/locale-server";
import OwnerDashboardSkeleton from "../../components/OwnerDashboardSkeleton";

/**
 * Route-loading UI for the owner command center. The skeleton mirrors the real
 * shell (sidebar + topbar + panels) so a route change materializes in place —
 * the studio-app standard — instead of a blocking brand splash.
 */
export default async function Loading() {
  const locale = await getHubPublicLocale();
  const label = translateSurfaceLabel(locale, "Loading your command center");
  return <OwnerDashboardSkeleton label={label} />;
}
