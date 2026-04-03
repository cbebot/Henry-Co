import {
  budgetOptions,
  businessOptions,
  timelineOptions,
  urgencyOptions,
} from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";

export function StudioRequestCommercialStep({
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
  return (
    <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
      <div className="studio-kicker">Commercial context</div>
      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        <select
          name="businessType"
          required
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value)}
          className="studio-select rounded-[1.2rem] px-4 py-3"
        >
          <option value="">Business type</option>
          {businessOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          name="budgetBand"
          required
          value={budgetBand}
          onChange={(event) => setBudgetBand(event.target.value)}
          className="studio-select rounded-[1.2rem] px-4 py-3"
        >
          <option value="">Budget range</option>
          {budgetOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          name="urgency"
          required
          value={urgency}
          onChange={(event) => setUrgency(event.target.value)}
          className="studio-select rounded-[1.2rem] px-4 py-3"
        >
          <option value="">Urgency</option>
          {urgencyOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          name="timeline"
          required
          value={timeline}
          onChange={(event) => setTimeline(event.target.value)}
          className="studio-select rounded-[1.2rem] px-4 py-3"
        >
          <option value="">Timeline expectation</option>
          {timelineOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <textarea
          name="goals"
          required
          value={goals}
          onChange={(event) => setGoals(event.target.value)}
          className="studio-textarea min-h-36 rounded-[1.6rem] px-4 py-4"
          placeholder="What should this project achieve commercially?"
        />
        <textarea
          name="scopeNotes"
          required
          value={scopeNotes}
          onChange={(event) => setScopeNotes(event.target.value)}
          className="studio-textarea min-h-36 rounded-[1.6rem] px-4 py-4"
          placeholder="Describe exactly what needs to be built."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder="https://reference-one.com"
          />
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder="https://reference-two.com"
          />
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder="https://reference-three.com"
          />
          <input
            name="referenceFiles"
            type="file"
            multiple
            className="studio-input rounded-[1.2rem] px-4 py-3"
          />
        </div>

        <textarea
          name="inspirationSummary"
          value={inspirationSummary}
          onChange={(event) => setInspirationSummary(event.target.value)}
          className="studio-textarea min-h-36 rounded-[1.6rem] px-4 py-4"
          placeholder="Share references, inspirations, internal notes, or competitor signals HenryCo should study."
        />
      </div>
    </section>
  );
}
