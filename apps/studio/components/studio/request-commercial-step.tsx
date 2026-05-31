"use client";

import { useId } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { FieldError } from "@/components/studio/request-field-error";
import { StudioDomainLaunchSection } from "@/components/studio/studio-domain-launch";
import { StudioListbox } from "@/components/studio/studio-listbox";
import type { StudioModifierOption } from "@/lib/studio/request-config";

/** Fixed-price NGN input. Formats with thousands separators on blur and
 * persists "₦1,500,000" into the existing `budgetBand` string field —
 * downstream lead/proposal code already handles arbitrary strings. */
function StudioBudgetInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const id = useId();
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
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
        {t("Project budget")} · NGN
      </label>
      <input
        id={id}
        name="budgetBand"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required
        aria-invalid={error ? true : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(format(e.target.value))}
        placeholder="₦1,500,000"
        className="studio-input mt-2 rounded-[1.4rem] px-4 py-3 text-base font-semibold tracking-tight"
        aria-describedby={`${id}-hint`}
      />
      <span
        id={`${id}-hint`}
        className="mt-2 text-[0.72rem] leading-snug text-[var(--studio-ink-soft)]"
      >
        {t("Fixed price. Locked at proposal acceptance — no surprise overages.")}
      </span>
      <FieldError field="budgetBand" message={error} />
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
  setDomainIntentJson,
  errors,
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
  | "setDomainIntentJson"
> & { errors?: Record<string, string> }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const urgencyOptions = requestConfig.urgencyOptions.filter((item) => item.isActive !== false);
  const timelineOptions = requestConfig.timelineOptions.filter((item) => item.isActive !== false);

  return (
    <div className="space-y-8">
      <StudioDomainLaunchSection onIntentChange={setDomainIntentJson} />

      <section className="studio-panel rounded-[1.6rem] p-5 sm:p-7">
        <div className="studio-kicker">{t("Commercial context")}</div>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          {t(
            "Tell us the budget and the outcome. We come back inside one business day with a fixed scope, a fixed delivery window, and a senior lead assigned by name — no junior hand-offs, no scope drift.",
          )}
        </p>
        <ul className="mt-5 grid gap-2 text-[0.78rem] leading-snug text-[var(--studio-ink-soft)] sm:grid-cols-3">
          <li className="rounded-2xl border border-[var(--studio-line)] px-3 py-2">
            <span className="text-[var(--studio-ink)]">{t("Senior team")}</span> —{" "}
            {t("strategist, designer, and engineer kick off together; never juniors-only.")}
          </li>
          <li className="rounded-2xl border border-[var(--studio-line)] px-3 py-2">
            <span className="text-[var(--studio-ink)]">{t("Fixed price")}</span> —{" "}
            {t("locked at proposal acceptance. Change requests priced before they start.")}
          </li>
          <li className="rounded-2xl border border-[var(--studio-line)] px-3 py-2">
            <span className="text-[var(--studio-ink)]">{t("Premium delivery")}</span> —{" "}
            {t("production-ready code, accessibility-checked, ready to scale on day one.")}
          </li>
        </ul>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          <StudioListbox
            name="businessType"
            label={t("Business type")}
            required
            value={businessType}
            onChange={setBusinessType}
            placeholder={t("Select business type")}
            options={requestConfig.businessOptions.map((item) => ({ value: item, label: item }))}
          />
          <StudioBudgetInput value={budgetBand} onChange={setBudgetBand} error={errors?.budgetBand} />
          <StudioListbox
            name="urgency"
            label={t("Urgency")}
            required
            value={urgency}
            onChange={setUrgency}
            placeholder={t("Select urgency")}
            options={urgencyOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
          />
          <StudioListbox
            name="timeline"
            label={t("Timeline expectation")}
            required
            value={timeline}
            onChange={setTimeline}
            placeholder={t("Select timeline")}
            options={timelineOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div>
            <label htmlFor="studio-goals" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {t("What should this achieve?")}
            </label>
            <textarea
              id="studio-goals"
              name="goals"
              required
              aria-invalid={errors?.goals ? true : undefined}
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder={t("e.g. More qualified leads, calmer operations, clearer client onboarding…")}
            />
            <FieldError field="goals" message={errors?.goals} />
          </div>
          <div>
            <label htmlFor="studio-scope-notes" className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {t("What needs to exist when we are done?")}
            </label>
            <textarea
              id="studio-scope-notes"
              name="scopeNotes"
              required
              aria-invalid={errors?.scopeNotes ? true : undefined}
              value={scopeNotes}
              onChange={(event) => setScopeNotes(event.target.value)}
              className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
              placeholder={t("Pages, features, integrations, languages, admin tools—bullet points are fine.")}
            />
            <FieldError field="scopeNotes" message={errors?.scopeNotes} />
          </div>
        </div>

        <div className="mt-8">
          <label
            htmlFor="studio-inspiration-summary"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]"
          >
            {t("Anything else we should study?")}
          </label>
          <textarea
            id="studio-inspiration-summary"
            name="inspirationSummary"
            value={inspirationSummary}
            onChange={(event) => setInspirationSummary(event.target.value)}
            className="studio-textarea mt-2 min-h-36 w-full rounded-[1.6rem] px-4 py-4"
            placeholder={t(
              "Tone, audience, things to avoid, brand words you love, or “make it feel like X but more premium.”",
            )}
          />
          <p className="mt-2 text-[0.72rem] leading-snug text-[var(--studio-ink-soft)]">
            {t("Add links and file references on the final Review step, just before you submit.")}
          </p>
        </div>
      </section>
    </div>
  );
}
