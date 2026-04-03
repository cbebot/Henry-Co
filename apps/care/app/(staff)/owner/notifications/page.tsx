import type { Metadata } from "next";
import NotificationCenterPanel from "@/components/staff/NotificationCenterPanel";
import { requireRoles } from "@/lib/auth/server";
import { getRoleNotificationCenter } from "@/lib/notifications";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Notifications | Henry & Co. Fabric Care",
  description: "Critical owner-facing finance, staffing, messaging, and system alerts.",
};

export default async function OwnerNotificationsPage() {
  const auth = await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/notifications");

  const center = await getRoleNotificationCenter({
    role: "owner",
    userId: auth.profile.id,
  });

  return (
    <div className="space-y-8">
      <NotificationCenterPanel center={center} sourceRoute="/owner/notifications" />
    </div>
  );
}
