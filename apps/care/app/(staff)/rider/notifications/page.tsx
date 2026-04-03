import type { Metadata } from "next";
import NotificationCenterPanel from "@/components/staff/NotificationCenterPanel";
import { requireRoles } from "@/lib/auth/server";
import { getRoleNotificationCenter } from "@/lib/notifications";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider Notifications | Henry & Co. Fabric Care",
  description: "Pickup, delivery, and route-pressure alerts for rider operations.",
};

export default async function RiderNotificationsPage() {
  const auth = await requireRoles(["owner", "manager", "rider"]);
  await logProtectedPageAccess("/rider/notifications");

  const center = await getRoleNotificationCenter({
    role: "rider",
    userId: auth.profile.id,
  });

  return (
    <div className="space-y-8">
      <NotificationCenterPanel center={center} sourceRoute="/rider/notifications" />
    </div>
  );
}
