import { headers } from "next/headers";
import { WorkspaceShell } from "@henryco/workspace-shell";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import { getAccountUrl } from "@henryco/config";
import { requireLogisticsRoles } from "@/lib/logistics/auth";
import {
  OWNER_BRAND,
  OWNER_MOBILE_NAV,
  ownerNavItems,
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

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireLogisticsRoles(["logistics_owner"], "/owner");
  const pathname = await currentPathname();

  return (
    <>
      <WorkspaceShell
        division="logistics-business"
        brand={OWNER_BRAND}
        viewer={{
          fullName: viewer.user?.fullName ?? null,
          email: viewer.user?.email ?? null,
          avatarUrl: null,
        }}
        navigation={ownerNavItems}
        mobileNavigation={OWNER_MOBILE_NAV}
        notificationsHref="/owner"
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
