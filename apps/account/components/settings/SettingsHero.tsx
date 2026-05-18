import { translateSurfaceLabel } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  activeChannels,
  activeDivisions,
  DIVISION_ACCENT_VAR,
  DIVISION_LABEL,
  DIVISION_ORDER,
  identityBlurb,
  identityHeadline,
  identityState,
  profileCompleteness,
  regionFingerprint,
  type SettingsPreferences,
  type SettingsProfile,
} from "./helpers";

type Props = {
  profile: SettingsProfile;
  preferences: SettingsPreferences;
};

/**
 * V3 follow-up — Settings hero (server component).
 *
 * Editorial-premium hero for /settings. Same compositional vocabulary
 * as InboxHero / CalendarHero: eyebrow + state-driven headline +
 * capability tiles + "By division" side panel. No client state.
 */
export async function SettingsHero({ profile, preferences }: Props) {
  const locale = await getAccountAppLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const state = identityState(profile, preferences);
  const headline = identityHeadline(state, profile, preferences);
  const blurb = identityBlurb(state);

  const { filled: completenessFilled, total: completenessTotal } =
    profileCompleteness(profile);
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

  return (
    <section className="acct-settings__hero" aria-label={t("Identity & preferences overview")}>
      <div className="acct-settings__hero-inner">
        <div>
          <span className="acct-settings__eyebrow">
            <span className="acct-settings__eyebrow-dot" aria-hidden />
            {t("HenryCo · identity & preferences")}
          </span>
          <h1 className="acct-settings__headline">{t(headline)}</h1>
          <p className="acct-settings__blurb">{t(blurb)}</p>

          <div
            className="acct-settings__hero-tiles"
            role="list"
            aria-label={t("Identity capability snapshot")}
          >
            <div className="acct-settings__hero-tile" role="listitem">
              <span className="acct-settings__hero-tile-label">{t("Profile")}</span>
              <span className="acct-settings__hero-tile-value acct-settings__hero-tile-value--fraction">
                {completenessFilled}
                <span className="acct-settings__hero-tile-value-suffix">
                  / {completenessTotal}
                </span>
              </span>
              <span className="acct-settings__hero-tile-foot">
                {completenessFilled === completenessTotal
                  ? t("Every field filled")
                  : completenessFilled === 0
                    ? t("Start with your full name")
                    : `${completenessTotal - completenessFilled} ${completenessTotal - completenessFilled === 1 ? t("field left") : t("fields left")}`}
              </span>
            </div>
            <div className="acct-settings__hero-tile" role="listitem">
              <span className="acct-settings__hero-tile-label">{t("Channels")}</span>
              <span className="acct-settings__hero-tile-value acct-settings__hero-tile-value--fraction">
                {channels.count}
                <span className="acct-settings__hero-tile-value-suffix">
                  / {channels.total}
                </span>
              </span>
              <span className="acct-settings__hero-tile-foot">
                {channels.count === 0
                  ? t("Pick how HenryCo reaches you")
                  : channels.count === 1
                    ? t("Email only — add a fallback")
                    : t("Email · push · WhatsApp · SMS · in-app")}
              </span>
            </div>
            <div className="acct-settings__hero-tile" role="listitem">
              <span className="acct-settings__hero-tile-label">{t("Region")}</span>
              <span className="acct-settings__hero-tile-value acct-settings__hero-tile-value--fraction">
                {region.filled}
                <span className="acct-settings__hero-tile-value-suffix">
                  / 3
                </span>
              </span>
              <span className="acct-settings__hero-tile-foot">
                {region.filled === 3
                  ? `${region.country} · ${region.language}`
                  : region.filled === 2
                    ? t("One field left for full localisation")
                    : t("Country, language, timezone pending")}
              </span>
            </div>
          </div>
        </div>

        <aside className="acct-settings__hero-side" aria-label={t("Per-division signal status")}>
          <p className="acct-settings__hero-side-label">{t("By division")}</p>
          <p className="acct-settings__hero-side-title">
            {divisions.count === 0
              ? t("All divisions muted")
              : divisions.count === divisions.total
                ? t("Every division opted in")
                : `${divisions.count} ${t("of")} ${divisions.total} ${t("divisions on")}`}
          </p>
          <p className="acct-settings__hero-side-body">
            {verificationLabel} {t("— preferences sync instantly across HenryCo. Toggle a division below to mute or unmute its alerts.")}
          </p>
          <div role="list">
            {DIVISION_ORDER.map((key) => {
              const on = divisions.perDivision[key];
              return (
                <div className="acct-settings__div-row" role="listitem" key={key}>
                  <span
                    className="acct-settings__div-label"
                    style={{ color: `var(${DIVISION_ACCENT_VAR[key]})` }}
                  >
                    <span className="acct-settings__div-dot" aria-hidden />
                    {/* Override the parent's accent color back to the
                        natural foreground so the division name stays
                        readable in both modes. Previously used
                        bg-soft@88% which renders as near-black text in
                        dark mode (bg-soft is #141920 there) — fine —
                        but as near-white text in light mode against a
                        page that was already light. Switched to
                        --acct-ink for clean fg-on-page contrast in
                        both modes. */}
                    <span style={{ color: "var(--acct-ink)" }}>
                      {t(DIVISION_LABEL[key])}
                    </span>
                  </span>
                  <span
                    className="acct-settings__div-state"
                    data-state={on ? "on" : "off"}
                  >
                    {on ? t("On") : t("Muted")}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
