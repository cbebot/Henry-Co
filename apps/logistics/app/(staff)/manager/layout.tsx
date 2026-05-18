import { headers } from "next/headers";
import { WorkspaceShell } from "@henryco/workspace-shell";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import { getAccountUrl } from "@henryco/config";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { requireLogisticsRoles } from "@/lib/logistics/auth";
import {
  getManagerBrand,
  getManagerMobileNav,
  getManagerNavItems,
} from "@/lib/logistics/operator-navigation";

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

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireLogisticsRoles(
    ["dispatch_manager", "logistics_owner", "finance_ops"],
    "/manager",
  );
  const pathname = await currentPathname();
  const locale = await getLogisticsPublicLocale();

  return (
    <>
      <WorkspaceShell
        division="logistics-dispatch"
        brand={getManagerBrand(locale)}
        viewer={{
          fullName: viewer.user?.fullName ?? null,
          email: viewer.user?.email ?? null,
          avatarUrl: null,
        }}
        navigation={getManagerNavItems(locale)}
        mobileNavigation={getManagerMobileNav(locale)}
        notificationsHref="/manager"
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
