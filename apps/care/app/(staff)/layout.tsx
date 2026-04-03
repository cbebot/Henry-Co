import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDivisionConfig } from "@henryco/config";
import StaffShell from "@/components/staff/staff-shell";
import ImpersonationBanner from "@/components/staff/ImpersonationBanner";
import TourProvider from "@/components/tour/TourProvider";
import TourOverlay from "@/components/tour/TourOverlay";
import TourWelcomePrompt from "@/components/tour/TourWelcomePrompt";
import HelpButton from "@/components/tour/HelpButton";
import { getTourForScope } from "@/lib/tour/machines";
import { STAFF_LOGIN_ROUTE } from "@/lib/auth/routes";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { getCareSettings } from "@/lib/care-data";
import { getRoleNotificationCenter } from "@/lib/notifications";
import {
  getRoleNavSections,
  normalizeStaffRole,
  quickLinks,
} from "@/lib/staff-shell";
import type { TourScope } from "@/lib/tour/engine";

const care = getDivisionConfig("care");

export default async function StaffShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [auth, settings] = await Promise.all([getAuthenticatedProfile(), getCareSettings()]);

  if (!auth?.user || !auth.profile) {
    redirect(STAFF_LOGIN_ROUTE);
  }

  const role = normalizeStaffRole(auth.profile.role);
  const center = await getRoleNotificationCenter({
    role,
    userId: auth.profile.id,
  });

  const cookieStore = await cookies();
  const impersonationRaw = cookieStore.get("care_impersonation_owner")?.value;
  let impersonation: { targetName: string; targetRole: string } | null = null;
  if (impersonationRaw) {
    try {
      impersonation = JSON.parse(impersonationRaw);
    } catch {
      // ignore
    }
  }

  const tourScope = role as TourScope;
  const tourMachine = getTourForScope(tourScope);

  return (
    <TourProvider scope={tourScope} machine={tourMachine}>
      <StaffShell
        role={role}
        brandName={care.name}
        logoUrl={settings.logo_url}
        userEmail={auth.user.email ?? null}
        profileName={auth.profile.full_name ?? null}
        center={center}
        sections={getRoleNavSections(role, center.unreadCount)}
        quickLinks={quickLinks}
      >
        {children}
        {impersonation && (
          <ImpersonationBanner
            targetName={impersonation.targetName}
            targetRole={impersonation.targetRole}
          />
        )}
      </StaffShell>
      <TourOverlay />
      {tourMachine ? <TourWelcomePrompt machine={tourMachine} scope={tourScope} /> : null}
      <HelpButton machine={tourMachine} scope={tourScope} />
    </TourProvider>
  );
}
