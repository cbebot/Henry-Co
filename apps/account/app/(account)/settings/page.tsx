import { requireAccountUser } from "@/lib/auth";
import { getProfile, getPreferences } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import ProfileForm from "@/components/settings/ProfileForm";
import PreferencesForm from "@/components/settings/PreferencesForm";
import NotificationSignalSettingsCard from "@/components/settings/NotificationSignalSettingsCard";
import PrivacyDataControls from "@/components/settings/PrivacyDataControls";

import "@/components/settings/editorial.css";
import { SettingsHero } from "@/components/settings/SettingsHero";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings · HenryCo",
  description:
    "Identity, channels and per-division reach — every change syncs instantly across Care, Marketplace, Studio, Jobs, Learn, Property and Logistics.",
};

/**
 * V3 follow-up — /settings editorial premium rebuild.
 *
 * Replaces the generic <PageHeader> chrome with <SettingsHero>: eyebrow,
 * state-driven headline, capability tiles (profile completeness,
 * notification channels active, region fingerprint) and a "By division"
 * side panel. The three existing form cards (Profile, Notification
 * Preferences, Privacy) are preserved verbatim — the upgrade is purely
 * additive premium chrome.
 */
export default async function SettingsPage() {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  const [profile, preferences] = await Promise.all([
    getProfile(user.id),
    getPreferences(user.id),
  ]);

  return (
    <div className="acct-settings acct-fade-in">
      <SettingsHero profile={profile} preferences={preferences} />

      <section aria-labelledby="acct-settings-profile">
        <div className="acct-settings__section-head">
          <h2 id="acct-settings-profile" className="acct-settings__section-title">
            Profile
          </h2>
          <span className="acct-settings__section-meta">Identity</span>
        </div>
        <div className="acct-settings__card">
          <p className="acct-settings__card-kicker">Who you are on HenryCo</p>
          <ProfileForm profile={profile} email={user.email} effectiveLocale={locale} />
        </div>
      </section>

      <section aria-labelledby="acct-settings-notifications">
        <div className="acct-settings__section-head">
          <h2 id="acct-settings-notifications" className="acct-settings__section-title">
            Notifications
          </h2>
          <span className="acct-settings__section-meta">Signal · channels</span>
        </div>
        <div className="acct-settings__card">
          <p className="acct-settings__card-kicker">How HenryCo reaches you</p>
          <div className="space-y-4">
            <NotificationSignalSettingsCard />
            <PreferencesForm preferences={preferences} />
          </div>
        </div>
      </section>

      <section aria-labelledby="acct-settings-privacy">
        <div className="acct-settings__section-head">
          <h2 id="acct-settings-privacy" className="acct-settings__section-title">
            Privacy & data
          </h2>
          <span className="acct-settings__section-meta">Controls</span>
        </div>
        <PrivacyDataControls />
      </section>
    </div>
  );
}
