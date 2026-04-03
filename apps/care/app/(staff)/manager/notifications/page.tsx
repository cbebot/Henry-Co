import type { Metadata } from "next";
import NotificationCenterPanel from "@/components/staff/NotificationCenterPanel";
import { requireRoles } from "@/lib/auth/server";
import { getRoleNotificationCenter } from "@/lib/notifications";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manager Notifications | Henry & Co. Fabric Care",
  description: "Manager-facing queue pressure, staffing, payment, and escalation alerts.",
};

export default async function ManagerNotificationsPage() {
  const auth = await requireRoles(["owner", "manager"]);
  await logProtectedPageAccess("/manager/notifications");

  const center = await getRoleNotificationCenter({
    role: "manager",
    userId: auth.profile.id,
  });

  return (
    <div className="space-y-8">
      <NotificationCenterPanel center={center} sourceRoute="/manager/notifications" />
    </div>
  );
}
