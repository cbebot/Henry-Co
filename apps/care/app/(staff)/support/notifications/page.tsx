import type { Metadata } from "next";
import NotificationCenterPanel from "@/components/staff/NotificationCenterPanel";
import { requireRoles } from "@/lib/auth/server";
import { getRoleNotificationCenter } from "@/lib/notifications";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Notifications | Henry & Co. Fabric Care",
  description: "Support-facing inbox, reply, review, and receipt-verification alerts.",
};

export default async function SupportNotificationsPage() {
  const auth = await requireRoles(["owner", "manager", "support"]);
  await logProtectedPageAccess("/support/notifications");

  const center = await getRoleNotificationCenter({
    role: "support",
    userId: auth.profile.id,
  });

  return (
    <div className="space-y-8">
      <NotificationCenterPanel center={center} sourceRoute="/support/notifications" />
    </div>
  );
}
