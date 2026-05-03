import {
  joinClassNames,
  toggleValue,
} from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { StudioListbox } from "@/components/studio/studio-listbox";
import { filterPricedOptions } from "@/lib/studio/request-config";

function amountLabel(amount: number) {
  return amount > 0 ? `+₦${amount.toLocaleString("en-NG")}` : "Included";
}

function ScopeSummaryHeader({
  kicker,
  selected,
  total,
  hint,
}: {
  kicker: string;
  selected: string[];
  total: number;
  hint?: string;
}) {
  const visible = selected.slice(0, 3);
  const remaining = Math.max(0, selected.length - visible.length);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-[var(--studio-line)] pb-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {kicker}
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
          {selected.length}/{total} selected
        </div>
        {hint ? (
          <div className="text-[11px] italic text-[var(--studio-ink-soft)]">{hint}</div>
        ) : null}
      </div>
      {visible.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {visible.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-[rgba(151,244,243,0.32)] bg-[rgba(11,42,52,0.45)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--studio-ink)]"
            >
              {label}
            </span>
          ))}
          {remaining > 0 ? (
            <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
              +{remaining}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="text-[11px] italic text-[var(--studio-ink-soft)]">None selected yet</div>
      )}
    </div>
  );
}

/**
 * PricedCheckboxList — uniform renderer for any priced option list. Replaces
 * three almost-identical inline JSX blocks that duplicated layout and made
 * the form feel like a long card.
 */
function PricedCheckboxList({
  name,
  options,
  selected,
  onToggle,
}: {
  name: string;
  options: { id: string; label: string; description: string; amount: number }[];
  selected: string[];
  onToggle: (label: string) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((item) => {
        const isSelected = selected.includes(item.label);
        return (
          <label
            key={item.id}
            className={joinClassNames(
              "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
              isSelected
                ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name={name}
                value={item.label}
                checked={isSelected}
                onChange={() => onToggle(item.label)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-semibold text-[var(--studio-ink)]">{item.label}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                    {amountLabel(item.amount)}
                  </span>
                </div>
                <div className="mt-1 leading-7">{item.description}</div>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

/**
 * StudioRequestScopeStep — second stage of the brief.
 *
 * Layout:
 *   ┌─────────────────────────────────────┐
 *   │ Pages or sections (web only)        │   ◄ omitted entirely for non-web kinds
 *   ├─────────────────────────────────────┤
 *   │ Required features (project-typed)   │
 *   ├─────────────────────────────────────┤
 *   │ Tech stack                          │   ◄ dedicated panel — language,
 *   │   • Programming language            │     framework, backend, hosting
 *   │   • Framework (filtered)            │
 *   │   • Backend                         │
 *   │   • Hosting                         │
 *   │   • Stack philosophy chips          │
 *   ├─────────────────────────────────────┤
 *   │ Add-on services (optional)          │
 *   └─────────────────────────────────────┘
 *
 * Each section has clear ownership; no list is rendered twice.
 */
export function StudioRequestScopeStep({
  requestConfig,
  pathway,
  serviceKind,
  selectedPackage,
  selectedPages,
  setSelectedPages,
  selectedModules,
  setSelectedModules,
  selectedAddOns,
  setSelectedAddOns,
  selectedTech,
  setSelectedTech,
  selectedProgrammingLanguage,
  setSelectedProgrammingLanguage,
  selectedFramework,
  setSelectedFramework,
  selectedBackend,
  setSelectedBackend,
  selectedHosting,
  setSelectedHosting,
}: Pick<
  RequestBuilderSelectionProps,
  | "requestConfig"
  | "pathway"
  | "serviceKind"
  | "selectedPackage"
  | "selectedPages"
  | "setSelectedPages"
  | "selectedModules"
  | "setSelectedModules"
  | "selectedAddOns"
  | "setSelectedAddOns"
  | "selectedTech"
  | "setSelectedTech"
  | "selectedProgrammingLanguage"
  | "setSelectedProgrammingLanguage"
  | "selectedFramework"
  | "setSelectedFramework"
  | "selectedBackend"
  | "setSelectedBackend"
  | "selectedHosting"
  | "setSelectedHosting"
>) {
  const pageOptions = filterPricedOptions(requestConfig.pageOptions, serviceKind);
  const moduleOptions = filterPricedOptions(requestConfig.moduleOptions, serviceKind);
  const addOnOptions = filterPricedOptions(requestConfig.addOnOptions, serviceKind);
  const frameworkOptions = filterPricedOptions(requestConfig.frameworkOptions, serviceKind);
  const backendOptions = filterPricedOptions(requestConfig.backendOptions, serviceKind);

  // Web-style "pages" only make sense for site-shaped projects.
  const showPagesSection =
    pageOptions.length > 0 &&
    (serviceKind === "website" || serviceKind === "ecommerce");

  return (
    <div className="space-y-8">
      {pathway === "package" && selectedPackage ? (
        <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
          <div className="studio-kicker">Package context</div>
          <div className="mt-3 rounded-[1.6rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-lg font-semibold text-[var(--studio-ink)]">
              {selectedPackage.name}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
              Package mode keeps the core lane cleaner. Skip the page list — the package
              already covers it. Tick add-ons or pin a tech stack below if it matters
              for your team.
            </p>
          </div>
        </section>
      ) : null}

      {/* PAGES — only for website / ecommerce builds */}
      {pathway === "custom" && showPagesSection ? (
        <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
          <div className="studio-kicker">Pages or sections</div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
            Tick the pages this site needs at launch. Each page is priced individually
            so the proposal is line-itemised — nothing hidden.
          </p>
          <div className="mt-5">
            <ScopeSummaryHeader
              kicker="Pages"
              selected={selectedPages}
              total={pageOptions.length}
            />
            <div className="mt-4">
              <PricedCheckboxList
                name="pageRequirements"
                options={pageOptions}
                selected={selectedPages}
                onToggle={(label) => setSelectedPages(toggleValue(selectedPages, label))}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* FEATURES — for every project type. Module list is project-aware. */}
      {moduleOptions.length > 0 ? (
        <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
          <div className="studio-kicker">Required features</div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
            What does the product need to do for users on day one? Pick what&apos;s
            non-negotiable; we&apos;ll suggest sensible additions during proposal review.
          </p>
          <div className="mt-5">
            <ScopeSummaryHeader
              kicker="Features"
              selected={selectedModules}
              total={moduleOptions.length}
            />
            <div className="mt-4">
              <PricedCheckboxList
                name="requiredFeatures"
                options={moduleOptions}
                selected={selectedModules}
                onToggle={(label) => setSelectedModules(toggleValue(selectedModules, label))}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* TECH STACK — single dedicated panel; no duplication. */}
      <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
        <div className="studio-kicker">Tech stack</div>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Tell us your preferences. We&apos;ll honour them where it serves the project,
          push back honestly where a different choice would serve you better. Cost
          deltas are shown — most picks are zero-delta.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <StudioListbox
            name="programmingLanguage"
            label="Preferred programming language"
            value={selectedProgrammingLanguage}
            onChange={(next) => next && setSelectedProgrammingLanguage(next)}
            placeholder="Choose language…"
            required
            options={requestConfig.programmingLanguageOptions.map((item) => ({
              value: item,
              label: item,
            }))}
          />
          <StudioListbox
            name="frameworkPreference"
            label="Frontend / app framework"
            value={selectedFramework}
            onChange={(next) => next && setSelectedFramework(next)}
            placeholder="Choose framework…"
            required
            options={frameworkOptions.map((item) => ({
              value: item.label,
              label: `${item.label} · ${amountLabel(item.amount)}`,
            }))}
          />
          <StudioListbox
            name="backendPreference"
            label="Backend / data platform"
            value={selectedBackend}
            onChange={(next) => next && setSelectedBackend(next)}
            placeholder="Choose backend…"
            required
            options={backendOptions.map((item) => ({
              value: item.label,
              label: `${item.label} · ${amountLabel(item.amount)}`,
            }))}
          />
          <StudioListbox
            name="hostingPreference"
            label="Hosting / deployment"
            value={selectedHosting}
            onChange={(next) => next && setSelectedHosting(next)}
            placeholder="Choose host…"
            required
            options={requestConfig.hostingOptions.map((item) => ({
              value: item,
              label: item,
            }))}
          />
        </div>

        {requestConfig.stackOptions.length > 0 ? (
          <div className="mt-7 border-t border-[var(--studio-line)] pt-5">
            <ScopeSummaryHeader
              kicker="Stack philosophy"
              selected={selectedTech}
              total={requestConfig.stackOptions.length}
              hint="Pick zero or many"
            />
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {requestConfig.stackOptions.map((item) => {
                const selected = selectedTech.includes(item);
                return (
                  <label
                    key={item}
                    className={joinClassNames(
                      "flex items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-sm transition duration-200",
                      selected
                        ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                        : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                    )}
                  >
                    <input
                      type="checkbox"
                      name="techPreferences"
                      value={item}
                      checked={selected}
                      onChange={() => setSelectedTech(toggleValue(selectedTech, item))}
                      className="mt-0.5"
                    />
                    <span className="font-medium leading-snug">{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {/* ADD-ONS — single dedicated section, no longer concatenated with stack. */}
      {addOnOptions.length > 0 ? (
        <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
          <div className="studio-kicker">Add-on services</div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
            Optional supporting work. Skip what&apos;s not needed — pricing recalculates live.
          </p>
          <div className="mt-5">
            <ScopeSummaryHeader
              kicker="Add-ons"
              selected={selectedAddOns}
              total={addOnOptions.length}
            />
            <div className="mt-4">
              <PricedCheckboxList
                name="addonServices"
                options={addOnOptions}
                selected={selectedAddOns}
                onToggle={(label) => setSelectedAddOns(toggleValue(selectedAddOns, label))}
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
