import { BellRing } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getPreferences } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import NotificationPreferencesForm from "@/components/settings/notification-preferences/NotificationPreferencesForm";

export const dynamic = "force-dynamic";

// V2-NOT-01-C: dedicated notifications preferences surface. Lives alongside
// the existing /settings page (which still owns profile + privacy controls)
// rather than replacing it — the cluster of fields here is large enough that
// a single combined page would dilute scanability.
//
// All controls map 1:1 to the /api/notifications/preferences PATCH endpoint
// which validates every field server-side before writing.

export default async function NotificationsSettingsPage() {
  const user = await requireAccountUser();
  const preferences = await getPreferences(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Notifications"
        description="Choose how HenryCo reaches you. Mute the noise, keep the signal — preferences sync instantly across every division."
        icon={BellRing}
      />

      <NotificationPreferencesForm initialPreferences={preferences} />
    </div>
  );
}
