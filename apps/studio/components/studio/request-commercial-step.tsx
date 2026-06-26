import { useId } from "react";
import { getStudioRequestCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { StudioDomainLaunchSection } from "@/components/studio/studio-domain-launch";
import { StudioListbox } from "@/components/studio/studio-listbox";
import { StudioReferenceAttachments } from "@/components/studio/studio-reference-attachments";
import type { StudioModifierOption } from "@/lib/studio/request-config";

/** Fixed-price NGN input. Formats with thousands separators on blur and
 * persists "₦1,500,000" into the existing `budgetBand` string field —
 * downstream lead/proposal code already handles arbitrary strings. */
function StudioBudgetInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  function format(raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";
    return "₦" + Number(digits).toLocaleString("en-NG");
  }
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]"
      >
        {copy.commercial.budgetLabel}
      </label>
      <input
        id={id}
        name="budgetBand"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(format(e.target.value))}
        placeholder={copy.commercial.budgetPlaceholder}
        className="studio-input mt-2 rounded-[1.4rem] px-4 py-3 text-base font-semibold tracking-tight"
        aria-describedby={`${id}-hint`}
      />
      <span
        id={`${id}-hint`}
        className="mt-2 text-[0.72rem] leading-snug text-[var(--studio-ink-soft)]"
      >
        {copy.commercial.budgetHint}
      </span>
    </div>
  );
}

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
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale);
  const urgencyOptions = requestConfig.urgencyOptions.filter((item) => item.isActive !== false);
  const timelineOptions = requestConfig.timelineOptions.filter((item) => item.isActive !== false);

  return (
    <div className="space-y-8">
      <StudioDomainLaunchSection />

      <section className="studio-panel rounded-[1.6rem] p-5 sm:p-7">
        <div className="studio-kicker">{copy.commercial.commercialContext}</div>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          {copy.commercial.intro}
        </p>
        <ul className="mt-5 grid gap-2 text-[0.78rem] leading-snug text-[var(--studio-ink-soft)] sm:grid-cols-3">
          <li className="rounded-2xl border border-[var(--studio-line)] px-3 py-2">
            <span className="text-[var(--studio-ink)]">{copy.commercial.seniorTeamTitle}</span> —{" "}
            {copy.commercial.seniorTeamBody}
          </li>
          <li className="rounded-2xl border border-[var(--studio-line)] px-3 py-2">
            <span className="text-[var(--studio-ink)]">{copy.commercial.fixedPriceTitle}</span> —{" "}
            {copy.commercial.fixedPriceBody}
          </li>
          <li className="rounded-2xl border border-[var(--studio-line)] px-3 py-2">
            <span className="text-[var(--studio-ink)]">{copy.commercial.premiumDeliveryTitle}</span> —{" "}
            {copy.commercial.premiumDeliveryBody}
          </li>
        </ul>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <StudioListbox
            name="businessType"
            label={copy.commercial.businessTypeLabel}
            required
            value={businessType}
            onChange={setBusinessType}
            placeholder={copy.commercial.businessTypePlaceholder}
            options={requestConfig.businessOptions.map((item) => ({ value: item, label: item }))}
          />
          <StudioBudgetInput value={budgetBand} onChange={setBudgetBand} />
          <StudioListbox
            name="urgency"
            label={copy.commercial.urgencyLabel}
            required
            value={urgency}
            onChange={setUrgency}
            placeholder={copy.commercial.urgencyPlaceholder}
            options={urgencyOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
          />
          <StudioListbox
            name="timeline"
            label={copy.commercial.timelineLabel}
            required
            value={timeline}
            onChange={setTimeline}
            placeholder={copy.commercial.timelinePlaceholder}
            options={timelineOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div>
            <label htmlFor="studio-goals" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {copy.commercial.goalsLabel}
            </label>
            <textarea
              id="studio-goals"
              name="goals"
              required
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder={copy.commercial.goalsPlaceholder}
            />
          </div>
          <div>
            <label htmlFor="studio-scope-notes" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {copy.commercial.scopeNotesLabel}
            </label>
            <textarea
              id="studio-scope-notes"
              name="scopeNotes"
              required
              value={scopeNotes}
              onChange={(event) => setScopeNotes(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder={copy.commercial.scopeNotesPlaceholder}
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
              {copy.commercial.inspirationLabel}
            </label>
            <textarea
              id="studio-inspiration-summary"
              name="inspirationSummary"
              value={inspirationSummary}
              onChange={(event) => setInspirationSummary(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder={copy.commercial.inspirationPlaceholder}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
