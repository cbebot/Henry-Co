"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { StudioListbox } from "@/components/studio/studio-listbox";
import { StudioReferenceAttachments } from "@/components/studio/studio-reference-attachments";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import type { StudioTeamProfile } from "@/lib/studio/types";

/**
 * The composer's submit block — the activation step's real inputs, kept
 * name-for-name: team pick (posted via the shell's preferredTeamId mirror,
 * exactly like the wizard), referenceLinks / referenceFiles, the contact
 * fields, the depositNow commitment, and the submit button.
 */
export function SubmitBlock({
  id,
  teams,
  selectedTeamId,
  setSelectedTeamId,
}: {
  id: string;
  teams: StudioTeamProfile[];
  selectedTeamId: string;
  setSelectedTeamId: (value: string) => void;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: `${team.name} · ${team.availability}`,
  }));
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  const nextSteps = [
    t("A senior lead is assigned by name and confirms scope with you inside one business day."),
    t("You receive a proposal link, workspace, and payment reference — never a silent inbox."),
    t("Deposit secures the lane; we explain domain, hosting, and go-live before anything ships."),
  ];

  return (
    // data-allow-enter-submit: the composer form swallows implicit Enter
    // submits from stray text inputs (one screen, many fields); the contact
    // fields next to the real submit button keep the native behaviour.
    <section id={id} data-allow-enter-submit className="studio-panel rounded-[1.6rem] p-5 sm:p-6">
      <div className="space-y-6">
        <div>
          <div className="studio-kicker">{t("Team fit")}</div>
          <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
            {t(
              "Pick a team, or let Henry Onyx match the strongest fit to your scope, urgency, and industry.",
            )}
          </p>
          <div className="mt-3">
            <StudioListbox
              label={t("Preferred team")}
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              placeholder={t("Let Henry Onyx recommend the best-fit team")}
              options={teamOptions}
            />
          </div>
          {selectedTeam ? (
            <p className="mt-3 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
              {selectedTeam.summary}
            </p>
          ) : null}
        </div>

        <div>
          <div className="studio-kicker">{t("References & inspiration")}</div>
          <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
            {t(
              "Optional, but it sharpens the proposal. Links and files attach to your Studio record.",
            )}
          </p>
          <div className="mt-4">
            <StudioReferenceAttachments />
          </div>
        </div>

        <div>
          <div className="studio-kicker">{t("Your details")}</div>
          <div className="mt-3 grid gap-3">
            <input
              name="customerName"
              required
              className="studio-input rounded-[1.2rem] px-4 py-3"
              placeholder={t("Full name")}
              autoComplete="name"
            />
            <input
              name="companyName"
              className="studio-input rounded-[1.2rem] px-4 py-3"
              placeholder={t("Company, school, or brand (optional)")}
              autoComplete="organization"
            />
            <input
              name="email"
              type="email"
              required
              className="studio-input rounded-[1.2rem] px-4 py-3"
              placeholder={t("Best email for updates")}
              autoComplete="email"
            />
            <input
              name="phone"
              className="studio-input rounded-[1.2rem] px-4 py-3"
              placeholder={t("WhatsApp or phone (optional)")}
              autoComplete="tel"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
          <input type="checkbox" name="depositNow" className="mt-1" />
          <span>
            {t(
              "I am ready to secure a deposit-backed lane as soon as Henry Onyx confirms scope and pricing with me.",
            )}
          </span>
        </label>

        <StudioSubmitButton
          label={t("Submit Studio brief")}
          pendingLabel={t("Building your Studio brief...")}
        />

        <p className="text-xs leading-5 text-[var(--studio-ink-soft)]">
          {t(
            "Nothing goes live until you approve scope and payment. You can still adjust references or details with your lead before the deposit lands.",
          )}
        </p>

        <div className="rounded-[1.5rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] p-5">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-signal)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("What happens after you submit")}
          </div>
          <div className="mt-4 space-y-3">
            {nextSteps.map((item) => (
              <div
                key={item}
                className="flex gap-3 text-[13px] leading-6 text-[var(--studio-ink-soft)]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
