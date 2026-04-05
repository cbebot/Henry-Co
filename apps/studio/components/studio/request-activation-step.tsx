import { CheckCircle2 } from "lucide-react";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { joinClassNames } from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";

export function StudioRequestActivationStep({
  teams,
  selectedTeamId,
  setSelectedTeamId,
}: Pick<RequestBuilderSelectionProps, "teams" | "selectedTeamId" | "setSelectedTeamId">) {
  const outcomePoints = [
    "Your domain choices from the last step travel with the brief—we confirm registration and DNS with you before launch.",
    "You receive a real Studio record: proposal, workspace, and payment checkpoints—not a forgotten form submission.",
    "Deposits secure your slot; proof upload keeps finance fast; milestones and files stay in one client-grade portal.",
  ];

  return (
    <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
      <div className="studio-kicker">Review & send</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelectedTeamId("")}
            className={joinClassNames(
              "w-full rounded-[1.5rem] border p-4 text-left transition duration-200",
              selectedTeamId === ""
                ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                : "border-[var(--studio-line)] bg-black/10"
            )}
          >
            Let HenryCo recommend the best-fit team
          </button>

          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeamId(team.id)}
              className={joinClassNames(
                "w-full rounded-[1.5rem] border p-4 text-left transition duration-200",
                selectedTeamId === team.id
                  ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                  : "border-[var(--studio-line)] bg-black/10"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-[var(--studio-ink)]">{team.name}</div>
                <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                  {team.availability}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{team.summary}</p>
            </button>
          ))}
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <input name="customerName" required className="studio-input rounded-[1.2rem] px-4 py-3" placeholder="Full name" />
            <input name="companyName" className="studio-input rounded-[1.2rem] px-4 py-3" placeholder="Company, school, or brand (optional)" />
            <input name="email" type="email" required className="studio-input rounded-[1.2rem] px-4 py-3" placeholder="Best email for updates" />
            <input name="phone" className="studio-input rounded-[1.2rem] px-4 py-3" placeholder="WhatsApp or phone (helps for quick clarifications)" />
          </div>

          <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
            <input type="checkbox" name="depositNow" className="mt-1" />
            I am ready to secure a deposit-backed lane as soon as HenryCo confirms scope and pricing with me.
          </label>

          <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-lg font-semibold text-[var(--studio-ink)]">What happens after submission</div>
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
            Nothing goes live until you approve scope and payment. You can still adjust references or contact
            details with your lead before the deposit lands—this submission only opens your structured Studio
            record.
          </p>

          <StudioSubmitButton label="Submit Studio brief" pendingLabel="Building your Studio brief..." />
        </div>
      </div>
    </section>
  );
}
