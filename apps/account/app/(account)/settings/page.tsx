import { translateSurfaceLabel } from "@henryco/i18n";
import { toBrandName } from "@henryco/config";
import {
  HeroCard,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getProfile, getPreferences } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import ProfileForm from "@/components/settings/ProfileForm";
import PreferencesForm from "@/components/settings/PreferencesForm";
import NotificationSignalSettingsCard from "@/components/settings/NotificationSignalSettingsCard";
import PrivacyDataControls from "@/components/settings/PrivacyDataControls";

import "@/components/settings/editorial.css";
import {
  DIVISION_ACCENT_VAR,
  DIVISION_LABEL,
  DIVISION_ORDER,
  activeChannels,
  activeDivisions,
  identityBlurb,
  identityHeadline,
  identityState,
  profileCompleteness,
  regionFingerprint,
} from "@/components/settings/helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: toBrandName("Settings · Henry Onyx"),
  description:
    "Identity, channels and per-division reach — every change syncs instantly across Care, Marketplace, Studio, Jobs, Learn, Property and Logistics.",
};

/**
 * Settings landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2D). Lifts SettingsHero into the
 * shared <HeroCard variant="paired" /> primitive. Preserves the three forms
 * (Profile, Notifications, Privacy) verbatim.
 */
export default async function SettingsPage() {
  const [user, locale] = await Promise.all([requireAccountUser(), getAccountAppLocale()]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [profile, preferences] = await Promise.all([
    getProfile(user.id),
    getPreferences(user.id),
  ]);
  const state = identityState(profile, preferences);
  const headline = identityHeadline(state, profile, preferences);
  const blurb = identityBlurb(state);
  const { filled: completenessFilled, total: completenessTotal } = profileCompleteness(profile);
  const channels = activeChannels(preferences);
  const divisions = activeDivisions(preferences);
  const region = regionFingerprint(profile);

  const verificationLabel =
    state === "unverified"
      ? t("Setup pending")
      : state === "verified-base"
        ? t("Base verified")
        : state === "power-user"
          ? t("Power-user tier")
          : t("Verified rich");

  // ── Tiles ────────────────────────────────────────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: t("Profile"),
      value: `${completenessFilled} / ${completenessTotal}`,
      foot:
        completenessFilled === completenessTotal
          ? t("Every field filled")
          : completenessFilled === 0
            ? t("Start with your full name")
            : `${completenessTotal - completenessFilled} ${t("to add")}`,
      tone: completenessFilled === completenessTotal ? "accent" : "default",
    },
    {
      label: t("Channels"),
      value: channels.count,
      foot:
        channels.count === 0
          ? t("Turn on at least one channel")
          : `${channels.count}/${channels.total} ${t("active")}`,
      tone: channels.count > 0 ? "active" : "warning",
    },
    {
      label: t("Region"),
      value: region.country ?? region.language ?? "—",
      foot: region.language ?? undefined,
    },
  ];

  // ── Division breakdown ──────────────────────────────────────────
  const enabledDivisionKeys = DIVISION_ORDER.filter(
    (key) => divisions.perDivision[key],
  );
  const breakdown: ReadonlyArray<HeroCardBreakdownRow> = enabledDivisionKeys.map((key) => ({
    label: DIVISION_LABEL[key],
    count: 1,
    color: `var(${DIVISION_ACCENT_VAR[key]})`,
  }));

  return (
    <DivisionLanding
      className="acct-settings acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={
            state === "unverified"
              ? "empty"
              : state === "power-user"
                ? "calm"
                : "active"
          }
          eyebrow={t(toBrandName("Henry Onyx · identity & preferences"))}
          headline={t(toBrandName(headline))}
          blurb={t(toBrandName(blurb))}
          ariaLabel={t("Identity & preferences overview")}
          ariaTilesLabel={t("Identity capability snapshot")}
          tiles={tiles}
          belowTiles={
            /* In-page quick-nav (redesign 2026-07-08): the settings spread is
               ~5,000px — the opener now hands the reader straight to each
               section. Labels reuse the translated section titles. */
            <nav
              aria-label={t("Settings sections")}
              className="flex flex-wrap gap-2"
            >
              {[
                { href: "#acct-settings-profile", label: t("Profile") },
                { href: "#acct-settings-notifications", label: t("Notifications") },
                { href: "#acct-settings-privacy", label: t("Privacy & data") },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--acct-line)] px-3.5 text-xs font-semibold text-[var(--acct-muted)] transition-colors hover:border-[var(--acct-gold)] hover:text-[var(--acct-ink)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          }
          side={{
            kicker: verificationLabel,
            title: t("By division"),
            body:
              enabledDivisionKeys.length === 0
                ? t("Toggle the divisions you want to hear from in Notifications below.")
                : `${enabledDivisionKeys.length} ${t("divisions reach you")}`,
            breakdown:
              breakdown.length > 0
                ? {
                    label: t("By division"),
                    rows: breakdown,
                    ariaLabel: t("Divisions reaching you"),
                  }
                : undefined,
          }}
        />
      }
      sections={[
        {
          id: "acct-settings-profile",
          title: t("Profile"),
          meta: t("Identity"),
          content: (
            <div className="acct-settings__card">
              <p className="acct-settings__card-kicker">{t(toBrandName("Who you are on Henry Onyx"))}</p>
              <ProfileForm profile={profile} email={user.email} effectiveLocale={locale} />
            </div>
          ),
        },
        {
          id: "acct-settings-notifications",
          title: t("Notifications"),
          meta: t("Signal · channels"),
          content: (
            <div className="acct-settings__card">
              <p className="acct-settings__card-kicker">{t(toBrandName("How Henry Onyx reaches you"))}</p>
              <div className="space-y-4">
                <NotificationSignalSettingsCard />
                <PreferencesForm preferences={preferences} />
              </div>
            </div>
          ),
        },
        {
          id: "acct-settings-privacy",
          title: t("Privacy & data"),
          meta: t("Controls"),
          content: <PrivacyDataControls />,
        },
      ]}
    />
  );
}
