import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { StudioDomainLaunchSection } from "@/components/studio/studio-domain-launch";
import { StudioListbox } from "@/components/studio/studio-listbox";
import { StudioReferenceAttachments } from "@/components/studio/studio-reference-attachments";
import type { StudioModifierOption } from "@/lib/studio/request-config";

function modifierLabel(option: StudioModifierOption) {
  if (!option.value) return option.label;
  if (option.modifierType === "percent") {
    return `${option.label} · +${Math.round(option.value * 100)}%`;
  }
  return `${option.label} · +₦${Math.round(option.value).toLocaleString("en-NG")}`;
}

export function StudioRequestCommercialStep({
  requestConfig,
  businessType,
  setBusinessType,
  budgetBand,
  setBudgetBand,
  urgency,
  setUrgency,
  timeline,
  setTimeline,
  goals,
  setGoals,
  scopeNotes,
  setScopeNotes,
  inspirationSummary,
  setInspirationSummary,
}: Pick<
  RequestBuilderSelectionProps,
  | "requestConfig"
  | "businessType"
  | "setBusinessType"
  | "budgetBand"
  | "setBudgetBand"
  | "urgency"
  | "setUrgency"
  | "timeline"
  | "setTimeline"
  | "goals"
  | "setGoals"
  | "scopeNotes"
  | "setScopeNotes"
  | "inspirationSummary"
  | "setInspirationSummary"
>) {
  const urgencyOptions = requestConfig.urgencyOptions.filter((item) => item.isActive !== false);
  const timelineOptions = requestConfig.timelineOptions.filter((item) => item.isActive !== false);

  return (
    <div className="space-y-8">
      <StudioDomainLaunchSection />

      <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
        <div className="studio-kicker">Commercial context</div>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          These answers shape timeline and resourcing. Plain language is perfect—your delivery lead will confirm
          details after submit.
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <StudioListbox
            name="businessType"
            label="Business type"
            required
            value={businessType}
            onChange={setBusinessType}
            placeholder="Select business type"
            options={requestConfig.businessOptions.map((item) => ({ value: item, label: item }))}
          />
          <StudioListbox
            name="budgetBand"
            label="Budget range"
            required
            value={budgetBand}
            onChange={setBudgetBand}
            placeholder="Select budget range"
            options={requestConfig.budgetOptions.map((item) => ({ value: item, label: item }))}
          />
          <StudioListbox
            name="urgency"
            label="Urgency"
            required
            value={urgency}
            onChange={setUrgency}
            placeholder="Select urgency"
            options={urgencyOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
          />
          <StudioListbox
            name="timeline"
            label="Timeline expectation"
            required
            value={timeline}
            onChange={setTimeline}
            placeholder="Select timeline"
            options={timelineOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div>
            <label htmlFor="studio-goals" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              What should this achieve?
            </label>
            <textarea
              id="studio-goals"
              name="goals"
              required
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder="e.g. More qualified leads, calmer operations, clearer client onboarding…"
            />
          </div>
          <div>
            <label htmlFor="studio-scope-notes" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              What needs to exist when we are done?
            </label>
            <textarea
              id="studio-scope-notes"
              name="scopeNotes"
              required
              value={scopeNotes}
              onChange={(event) => setScopeNotes(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder="Pages, features, integrations, languages, admin tools—bullet points are fine."
            />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <StudioReferenceAttachments />

          <div>
            <label
              htmlFor="studio-inspiration-summary"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]"
            >
              Anything else we should study?
            </label>
            <textarea
              id="studio-inspiration-summary"
              name="inspirationSummary"
              value={inspirationSummary}
              onChange={(event) => setInspirationSummary(event.target.value)}
              className="studio-textarea mt-2 min-h-[280px] rounded-[1.6rem] px-4 py-4"
              placeholder="Tone, audience, things to avoid, brand words you love, or “make it feel like X but more premium.”"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
