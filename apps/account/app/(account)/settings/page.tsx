import { Settings } from "lucide-react";
import { getAccountCopy } from "@henryco/i18n";
import { requireAccountUser } from "@/lib/auth";
import { getProfile, getPreferences } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import PageHeader from "@/components/layout/PageHeader";
import ProfileForm from "@/components/settings/ProfileForm";
import PreferencesForm from "@/components/settings/PreferencesForm";
import NotificationSignalSettingsCard from "@/components/settings/NotificationSignalSettingsCard";
import PrivacyDataControls from "@/components/settings/PrivacyDataControls";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  const [profile, preferences] = await Promise.all([getProfile(user.id), getPreferences(user.id)]);
  const copy = getAccountCopy(locale);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.settings.pageTitle}
        description={copy.settings.pageDescription}
        icon={Settings}
      />

      {/* Profile */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">{copy.settings.profileSectionKicker}</p>
        <ProfileForm profile={profile} email={user.email} effectiveLocale={locale} />
      </section>

      {/* Notification Preferences */}
      <section className="acct-card p-5">
        <p className="acct-kicker mb-4">{copy.settings.notificationsSectionKicker}</p>
        <div className="space-y-4">
          <NotificationSignalSettingsCard />
          <PreferencesForm preferences={preferences} />
        </div>
      </section>

      <PrivacyDataControls />
    </div>
  );
}
