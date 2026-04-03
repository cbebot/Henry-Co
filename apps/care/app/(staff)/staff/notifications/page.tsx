import type { Metadata } from "next";
import NotificationCenterPanel from "@/components/staff/NotificationCenterPanel";
import { requireRoles } from "@/lib/auth/server";
import { getRoleNotificationCenter } from "@/lib/notifications";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Notifications | Henry & Co. Fabric Care",
  description: "Assigned service execution alerts for home and office field staff.",
};

export default async function StaffNotificationsPage() {
  const auth = await requireRoles(["owner", "manager", "staff"]);
  await logProtectedPageAccess("/staff/notifications");

  const center = await getRoleNotificationCenter({
    role: "staff",
    userId: auth.profile.id,
  });

  return (
    <div className="space-y-8">
      <NotificationCenterPanel center={center} sourceRoute="/staff/notifications" />
    </div>
  );
}
