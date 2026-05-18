import { headers } from "next/headers";
import { WorkspaceShell } from "@henryco/workspace-shell";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import { getAccountUrl } from "@henryco/config";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { requireLogisticsRoles } from "@/lib/logistics/auth";
import {
  getRiderBrand,
  getRiderMobileNav,
  getRiderNavItems,
} from "@/lib/logistics/operator-navigation";

/**
 * V3 PASS 21 — Rider workspace layout.
 *
 * Auth gate: requires a viewer with the `rider`, `dispatch_manager`,
 * or `logistics_owner` role (the upper roles get rider-visibility for
 * supervision). Customers are redirected to /customer.
 *
 * Chrome: @henryco/workspace-shell engine, division=logistics-rider,
 * NotificationsToastViewport audience=staff so dispatch alerts toast.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function currentPathname(): Promise<string> {
  try {
    const headerStore = await headers();
    return (
      headerStore.get("x-pathname") ||
      headerStore.get("x-invoke-path") ||
      headerStore.get("next-url") ||
      ""
    );
  } catch {
    return "";
  }
}

export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireLogisticsRoles(
    ["rider", "dispatch_manager", "logistics_owner"],
    "/rider",
  );
  const pathname = await currentPathname();
  const locale = await getLogisticsPublicLocale();

  return (
    <>
      <WorkspaceShell
        division="logistics-rider"
        brand={getRiderBrand(locale)}
        viewer={{
          fullName: viewer.user?.fullName ?? null,
          email: viewer.user?.email ?? null,
          avatarUrl: null,
        }}
        navigation={getRiderNavItems(locale)}
        mobileNavigation={getRiderMobileNav(locale)}
        notificationsHref="/rider/notifications"
        profileHref={getAccountUrl("/security")}
        accountSettingsUrl={getAccountUrl("/")}
        pathname={pathname}
      >
        {children}
      </WorkspaceShell>
      <NotificationsToastViewport audience="staff" />
    </>
  );
}
