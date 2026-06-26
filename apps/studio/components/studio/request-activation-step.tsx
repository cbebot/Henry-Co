import { CheckCircle2 } from "lucide-react";
import { getStudioRequestCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { StudioListbox } from "@/components/studio/studio-listbox";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";

export function StudioRequestActivationStep({
  teams,
  selectedTeamId,
  setSelectedTeamId,
}: Pick<RequestBuilderSelectionProps, "teams" | "selectedTeamId" | "setSelectedTeamId">) {
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  const outcomePoints = [
    copy.activation.outcomePoint1,
    copy.activation.outcomePoint2,
    copy.activation.outcomePoint3,
  ];
  const teamOptions = [
    { value: "", label: copy.activation.teamRecommendPlaceholder },
    ...teams.map((team) => ({
      value: team.id,
      label: `${team.name} · ${team.availability}`,
    })),
  ];
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  return (
    <section className="studio-panel rounded-[1.6rem] p-5 sm:p-7">
      <div className="studio-kicker">{copy.activation.reviewSend}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {copy.activation.teamFit}
            </div>
            <div className="mt-3">
              <StudioListbox
                name="preferredTeamPick"
                label={copy.activation.preferredTeam}
                value={selectedTeamId}
                onChange={setSelectedTeamId}
                placeholder={copy.activation.teamRecommendPlaceholder}
                options={teamOptions}
              />
            </div>
            {selectedTeam ? (
              <div className="mt-4 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-[var(--studio-ink)]">
                    {selectedTeam.name}
                  </div>
                  <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                    {selectedTeam.availability}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {selectedTeam.summary}
                </p>
              </div>
            ) : (
              <p className="mt-3 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                {copy.activation.matchStrongest}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <input name="customerName" required className="studio-input rounded-[1.2rem] px-4 py-3" placeholder={copy.activation.fullName} />
            <input name="companyName" className="studio-input rounded-[1.2rem] px-4 py-3" placeholder={copy.activation.companyOptional} />
            <input name="email" type="email" required className="studio-input rounded-[1.2rem] px-4 py-3" placeholder={copy.activation.bestEmail} />
            <input name="phone" className="studio-input rounded-[1.2rem] px-4 py-3" placeholder={copy.activation.whatsappOrPhone} />
          </div>

          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
            <input type="checkbox" name="depositNow" className="mt-1" />
            {copy.activation.depositConsent}
          </label>

          <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-lg font-semibold text-[var(--studio-ink)]">{copy.activation.whatHappensTitle}</div>
            <div className="mt-4 space-y-3">
              {outcomePoints.map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs leading-5 text-[var(--studio-ink-soft)]">
            {copy.activation.nothingGoesLive}
          </p>

          <StudioSubmitButton label={copy.activation.submitLabel} pendingLabel={copy.activation.submitPendingLabel} />
        </div>
      </div>
    </section>
  );
}
