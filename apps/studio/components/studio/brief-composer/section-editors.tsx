"use client";

/**
 * Focused editors for the composer's Scope, Stack, Business and Goals
 * cards. Each reuses the wizard steps' internals (ScopeSummaryHeader,
 * PricedCheckboxList, StudioListbox, the textarea pattern) with one
 * deliberate difference: NO editor control carries a contract `name`.
 * The composer's always-mounted hidden mirror is the single posting
 * source — the submit action reads multi-value fields via getAll, so a
 * second named checkbox would double-count straight into pricing.
 */

import { useId } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { joinClassNames, toggleValue } from "@/components/studio/request-builder-data";
import { FieldError } from "@/components/studio/request-field-error";
import {
  PricedCheckboxList,
  ScopeSummaryHeader,
  amountLabel,
} from "@/components/studio/request-scope-step";
import { StudioListbox } from "@/components/studio/studio-listbox";
import {
  filterPricedOptions,
  type StudioModifierOption,
  type StudioRequestConfig,
} from "@/lib/studio/request-config";
import type { StudioPackage, StudioService } from "@/lib/studio/types";

function modifierLabel(option: StudioModifierOption) {
  if (!option.value) return option.label;
  if (option.modifierType === "percent") {
    return `${option.label} · +${Math.round(option.value * 100)}%`;
  }
  return `${option.label} · +₦${Math.round(option.value).toLocaleString("en-NG")}`;
}

// ─── Scope — pages, features, add-ons ────────────────────────────────────────

export function ScopeSectionEditor({
  requestConfig,
  serviceKind,
  pathway,
  selectedPackage,
  selectedPages,
  setSelectedPages,
  selectedModules,
  setSelectedModules,
  selectedAddOns,
  setSelectedAddOns,
  errors,
}: {
  requestConfig: StudioRequestConfig;
  serviceKind: StudioService["kind"];
  pathway: "package" | "custom";
  selectedPackage: StudioPackage | null;
  selectedPages: string[];
  setSelectedPages: (value: string[]) => void;
  selectedModules: string[];
  setSelectedModules: (value: string[]) => void;
  selectedAddOns: string[];
  setSelectedAddOns: (value: string[]) => void;
  errors?: Record<string, string>;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const pageOptions = filterPricedOptions(requestConfig.pageOptions, serviceKind);
  const moduleOptions = filterPricedOptions(requestConfig.moduleOptions, serviceKind);
  const addOnOptions = filterPricedOptions(requestConfig.addOnOptions, serviceKind);

  // Web-style "pages" only make sense for site-shaped projects — same rule
  // as the wizard's Scope step.
  const showPagesSection =
    pathway === "custom" &&
    pageOptions.length > 0 &&
    (serviceKind === "website" || serviceKind === "ecommerce");

  return (
    <div className="space-y-7">
      <FieldError field="scope" message={errors?.scope} />

      {pathway === "package" && selectedPackage ? (
        <p className="border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
          {t(
            "Package mode keeps the core lane cleaner. Skip the page list — the package already covers it. Tick add-ons or pin a tech stack below if it matters for your team.",
          )}
        </p>
      ) : null}

      {showPagesSection ? (
        <div>
          <ScopeSummaryHeader
            kicker={t("Pages")}
            selected={selectedPages}
            total={pageOptions.length}
          />
          <div className="mt-4">
            <PricedCheckboxList
              options={pageOptions}
              selected={selectedPages}
              onToggle={(label) => setSelectedPages(toggleValue(selectedPages, label))}
            />
          </div>
        </div>
      ) : null}

      {moduleOptions.length > 0 ? (
        <div>
          <ScopeSummaryHeader
            kicker={t("Features")}
            selected={selectedModules}
            total={moduleOptions.length}
          />
          <div className="mt-4">
            <PricedCheckboxList
              options={moduleOptions}
              selected={selectedModules}
              onToggle={(label) => setSelectedModules(toggleValue(selectedModules, label))}
            />
          </div>
        </div>
      ) : null}

      {addOnOptions.length > 0 ? (
        <div>
          <ScopeSummaryHeader
            kicker={t("Add-ons")}
            selected={selectedAddOns}
            total={addOnOptions.length}
            hint={t("Optional supporting work")}
          />
          <div className="mt-4">
            <PricedCheckboxList
              options={addOnOptions}
              selected={selectedAddOns}
              onToggle={(label) => setSelectedAddOns(toggleValue(selectedAddOns, label))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Stack — language, framework, backend, hosting, philosophy chips ─────────

export function StackSectionEditor({
  requestConfig,
  serviceKind,
  selectedProgrammingLanguage,
  setSelectedProgrammingLanguage,
  selectedFramework,
  setSelectedFramework,
  selectedBackend,
  setSelectedBackend,
  selectedHosting,
  setSelectedHosting,
  selectedTech,
  setSelectedTech,
}: {
  requestConfig: StudioRequestConfig;
  serviceKind: StudioService["kind"];
  selectedProgrammingLanguage: string;
  setSelectedProgrammingLanguage: (value: string) => void;
  selectedFramework: string;
  setSelectedFramework: (value: string) => void;
  selectedBackend: string;
  setSelectedBackend: (value: string) => void;
  selectedHosting: string;
  setSelectedHosting: (value: string) => void;
  selectedTech: string[];
  setSelectedTech: (value: string[]) => void;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const frameworkOptions = filterPricedOptions(requestConfig.frameworkOptions, serviceKind);
  const backendOptions = filterPricedOptions(requestConfig.backendOptions, serviceKind);

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
        {t(
          "Tell us your preferences. We'll honour them where it serves the project, push back honestly where a different choice would serve you better. Cost deltas are shown — most picks are zero-delta.",
        )}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <StudioListbox
          label={t("Preferred programming language")}
          value={selectedProgrammingLanguage}
          onChange={(next) => next && setSelectedProgrammingLanguage(next)}
          placeholder={t("Choose language…")}
          required
          options={requestConfig.programmingLanguageOptions.map((item) => ({
            value: item,
            label: item,
          }))}
        />
        {frameworkOptions.length > 0 ? (
          <StudioListbox
            label={t("Frontend / app framework")}
            value={selectedFramework}
            onChange={(next) => next && setSelectedFramework(next)}
            placeholder={t("Choose framework…")}
            required
            options={frameworkOptions.map((item) => ({
              value: item.label,
              label: `${item.label} · ${amountLabel(item.amount, t)}`,
            }))}
          />
        ) : null}
        {backendOptions.length > 0 ? (
          <StudioListbox
            label={t("Backend / data platform")}
            value={selectedBackend}
            onChange={(next) => next && setSelectedBackend(next)}
            placeholder={t("Choose backend…")}
            required
            options={backendOptions.map((item) => ({
              value: item.label,
              label: `${item.label} · ${amountLabel(item.amount, t)}`,
            }))}
          />
        ) : null}
        <StudioListbox
          label={t("Hosting / deployment")}
          value={selectedHosting}
          onChange={(next) => next && setSelectedHosting(next)}
          placeholder={t("Choose host…")}
          required
          options={requestConfig.hostingOptions.map((item) => ({
            value: item,
            label: item,
          }))}
        />
      </div>

      {requestConfig.stackOptions.length > 0 ? (
        <div className="border-t border-[var(--studio-line)] pt-5">
          <ScopeSummaryHeader
            kicker={t("Stack philosophy")}
            selected={selectedTech}
            total={requestConfig.stackOptions.length}
            hint={t("Pick zero or many")}
          />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {requestConfig.stackOptions.map((item) => {
              const selected = selectedTech.includes(item);
              return (
                <label
                  key={item}
                  className={joinClassNames(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition duration-150",
                    selected
                      ? "border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)] text-[var(--studio-ink)]"
                      : "border-[var(--studio-line)] bg-transparent text-[var(--studio-ink-soft)] hover:border-[color:var(--home-accent-ring)] hover:text-[var(--studio-ink)]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => setSelectedTech(toggleValue(selectedTech, item))}
                    className="h-3.5 w-3.5 accent-[var(--studio-signal)]"
                  />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Business & timeline ─────────────────────────────────────────────────────

/** Fixed-price NGN input — the wizard's budget field without `name` or
 * native `required` (the mirror posts; the submit sweep validates). */
function ComposerBudgetInput({
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
        type="text"
        inputMode="numeric"
        autoComplete="off"
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

export function BusinessSectionEditor({
  requestConfig,
  pathway = "custom",
  packagePriceLabel = null,
  businessType,
  setBusinessType,
  budgetBand,
  setBudgetBand,
  urgency,
  setUrgency,
  timeline,
  setTimeline,
  errors,
}: {
  requestConfig: StudioRequestConfig;
  /** SA-1 — on the package lane the budget question is dead weight: the
   * package price IS the budget, so we state it instead of asking. */
  pathway?: "package" | "custom";
  packagePriceLabel?: string | null;
  businessType: string;
  setBusinessType: (value: string) => void;
  budgetBand: string;
  setBudgetBand: (value: string) => void;
  urgency: string;
  setUrgency: (value: string) => void;
  timeline: string;
  setTimeline: (value: string) => void;
  errors?: Record<string, string>;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const urgencyOptions = requestConfig.urgencyOptions.filter((item) => item.isActive !== false);
  const timelineOptions = requestConfig.timelineOptions.filter((item) => item.isActive !== false);
  const packageBudget = pathway === "package" && Boolean(packagePriceLabel);

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
        {packageBudget
          ? t(
              "Your package already fixes the price, so there is no budget question here — just confirm the timing and who this is for.",
            )
          : t(
              "Tell us the budget and the timing. We come back inside one business day with a fixed scope, a fixed delivery window, and a senior lead assigned by name — no junior hand-offs, no scope drift.",
            )}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <StudioListbox
          label={t("Business type")}
          required
          value={businessType}
          onChange={setBusinessType}
          placeholder={t("Select business type")}
          options={requestConfig.businessOptions.map((item) => ({ value: item, label: item }))}
        />
        {packageBudget ? (
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              {t("Project budget")} · NGN
            </span>
            <div className="studio-input mt-2 flex items-center rounded-[1.4rem] px-4 py-3 text-base font-semibold tracking-tight">
              {packagePriceLabel}
            </div>
            <span className="mt-2 text-[0.72rem] leading-snug text-[var(--studio-ink-soft)]">
              {t("Fixed package price — locked at proposal acceptance, no surprise overages.")}
            </span>
          </div>
        ) : (
          <ComposerBudgetInput value={budgetBand} onChange={setBudgetBand} error={errors?.budgetBand} />
        )}
        <StudioListbox
          label={t("Urgency")}
          required
          value={urgency}
          onChange={setUrgency}
          placeholder={t("Select urgency")}
          options={urgencyOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
        />
        <StudioListbox
          label={t("Timeline expectation")}
          required
          value={timeline}
          onChange={setTimeline}
          placeholder={t("Select timeline")}
          options={timelineOptions.map((item) => ({ value: item.label, label: modifierLabel(item) }))}
        />
      </div>
    </div>
  );
}

// ─── Goals & notes ────────────────────────────────────────────────────────────

export function GoalsSectionEditor({
  goals,
  setGoals,
  scopeNotes,
  setScopeNotes,
  inspirationSummary,
  setInspirationSummary,
  errors,
}: {
  goals: string;
  setGoals: (value: string) => void;
  scopeNotes: string;
  setScopeNotes: (value: string) => void;
  inspirationSummary: string;
  setInspirationSummary: (value: string) => void;
  errors?: Record<string, string>;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const goalsId = useId();
  const notesId = useId();
  const inspirationId = useId();

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <div>
          <label
            htmlFor={goalsId}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]"
          >
            {t("What should this achieve?")}
          </label>
          <textarea
            id={goalsId}
            aria-invalid={errors?.goals ? true : undefined}
            value={goals}
            onChange={(event) => setGoals(event.target.value)}
            className="studio-textarea mt-2 min-h-32 w-full rounded-[1.6rem] px-4 py-4"
            placeholder={t("e.g. More qualified leads, calmer operations, clearer client onboarding…")}
          />
          <FieldError field="goals" message={errors?.goals} />
        </div>
        <div>
          <label
            htmlFor={notesId}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]"
          >
            {t("What needs to exist when we are done?")}
          </label>
          <textarea
            id={notesId}
            aria-invalid={errors?.scopeNotes ? true : undefined}
            value={scopeNotes}
            onChange={(event) => setScopeNotes(event.target.value)}
            className="studio-textarea mt-2 min-h-32 w-full rounded-[1.6rem] px-4 py-4"
            placeholder={t("Pages, features, integrations, languages, admin tools—bullet points are fine.")}
          />
          <FieldError field="scopeNotes" message={errors?.scopeNotes} />
        </div>
      </div>
      <div>
        <label
          htmlFor={inspirationId}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]"
        >
          {t("Anything else we should study?")}
        </label>
        <textarea
          id={inspirationId}
          value={inspirationSummary}
          onChange={(event) => setInspirationSummary(event.target.value)}
          className="studio-textarea mt-2 min-h-28 w-full rounded-[1.6rem] px-4 py-4"
          placeholder={t(
            "Tone, audience, things to avoid, brand words you love, or “make it feel like X but more premium.”",
          )}
        />
        <p className="mt-2 text-[0.72rem] leading-snug text-[var(--studio-ink-soft)]">
          {t("Add reference links and files in the submit panel, just before you send the brief.")}
        </p>
      </div>
    </div>
  );
}
