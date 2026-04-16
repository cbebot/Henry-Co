import { Settings } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getPreferences } from "@/lib/account-data";
import PageHeader from "@/components/layout/PageHeader";
import ProfileForm from "@/components/settings/ProfileForm";
import PreferencesForm from "@/components/settings/PreferencesForm";
import PrivacyDataControls from "@/components/settings/PrivacyDataControls";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAccountUser();
  const profile = await getProfile(user.id);
  const preferences = await getPreferences(user.id);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Settings & Preferences"
        description="Manage your profile, communication preferences, privacy controls, and manual data request paths."
        icon={Settings}
      />

      {/* Profile */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Profile Information</p>
        <ProfileForm profile={profile} email={user.email} />
      </section>

      {/* Notification Preferences */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">Notification Preferences</p>
        <PreferencesForm preferences={preferences} />
      </section>

      <PrivacyDataControls />
    </div>
  );
}
