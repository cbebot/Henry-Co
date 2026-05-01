import {
  joinClassNames,
  toggleValue,
} from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { filterPricedOptions } from "@/lib/studio/request-config";

function amountLabel(amount: number) {
  return amount > 0 ? `+₦${amount.toLocaleString("en-NG")}` : "Included";
}

function ScopeSummaryHeader({
  kicker,
  selected,
  total,
}: {
  kicker: string;
  selected: string[];
  total: number;
}) {
  const visible = selected.slice(0, 3);
  const remaining = Math.max(0, selected.length - visible.length);
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-[var(--studio-line)] pb-3">
      <div className="flex items-baseline gap-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
          {kicker}
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
          {selected.length}/{total} selected
        </div>
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
>) {
  const pageOptions = filterPricedOptions(requestConfig.pageOptions, serviceKind);
  const moduleOptions = filterPricedOptions(requestConfig.moduleOptions, serviceKind);
  const addOnOptions = filterPricedOptions(requestConfig.addOnOptions, serviceKind);

  return (
    <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
      <div className="studio-kicker">Scope design</div>
      {pathway === "package" ? (
        <div className="mt-5 space-y-5">
          <div className="rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
            <div className="text-lg font-semibold text-[var(--studio-ink)]">
              {selectedPackage?.name || "Choose a package from the first step"}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
              Package mode keeps the core lane cleaner, but you can still add premium extras below so
              the pricing and payment logic stay accurate from the start.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-3">
              <ScopeSummaryHeader
                kicker="Add-on services"
                selected={selectedAddOns}
                total={addOnOptions.length}
              />
              {addOnOptions.map((item) => (
                <label
                  key={item.id}
                  className={joinClassNames(
                    "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                    selectedAddOns.includes(item.label)
                      ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                      : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                  )}
                >
                  <input
                    type="checkbox"
                    name="addonServices"
                    value={item.label}
                    checked={selectedAddOns.includes(item.label)}
                    onChange={() => setSelectedAddOns(toggleValue(selectedAddOns, item.label))}
                    className="mr-3"
                  />
                  <span className="font-semibold">{item.label}</span>
                  <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                    {amountLabel(item.amount)}
                  </span>
                  <div className="mt-2 leading-7">{item.description}</div>
                </label>
              ))}
            </div>

            <div className="grid gap-3">
              <ScopeSummaryHeader
                kicker="Tech stack preferences"
                selected={selectedTech}
                total={requestConfig.stackOptions.length}
              />
              {requestConfig.stackOptions.map((item) => {
                const selected = selectedTech.includes(item);
                return (
                  <label
                    key={item}
                    className={joinClassNames(
                      "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
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
                      className="mr-3"
                    />
                    {item}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <ScopeSummaryHeader
              kicker="Pages or sections"
              selected={selectedPages}
              total={pageOptions.length}
            />
            {pageOptions.map((item) => (
              <label
                key={item.id}
                className={joinClassNames(
                  "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                  selectedPages.includes(item.label)
                    ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                    : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                )}
              >
                <input
                  type="checkbox"
                  name="pageRequirements"
                  value={item.label}
                  checked={selectedPages.includes(item.label)}
                  onChange={() => setSelectedPages(toggleValue(selectedPages, item.label))}
                  className="mr-3"
                />
                <span className="font-semibold">{item.label}</span>
                <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                  {amountLabel(item.amount)}
                </span>
                <div className="mt-2 leading-7">{item.description}</div>
              </label>
            ))}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <ScopeSummaryHeader
                kicker="Required features"
                selected={selectedModules}
                total={moduleOptions.length}
              />
              {moduleOptions.map((item) => (
                <label
                  key={item.id}
                  className={joinClassNames(
                    "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                    selectedModules.includes(item.label)
                      ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                      : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                  )}
                >
                  <input
                    type="checkbox"
                    name="requiredFeatures"
                    value={item.label}
                    checked={selectedModules.includes(item.label)}
                    onChange={() => setSelectedModules(toggleValue(selectedModules, item.label))}
                    className="mr-3"
                  />
                  <span className="font-semibold">{item.label}</span>
                  <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                    {amountLabel(item.amount)}
                  </span>
                  <div className="mt-2 leading-7">{item.description}</div>
                </label>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[...addOnOptions, ...requestConfig.stackOptions].map((item) => {
                const isAddOn = typeof item !== "string";
                const label = typeof item === "string" ? item : item.label;
                const selected = isAddOn ? selectedAddOns.includes(label) : selectedTech.includes(label);
                return (
                  <label
                    key={label}
                    className={joinClassNames(
                      "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                      selected
                        ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                        : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                    )}
                  >
                    <input
                      type="checkbox"
                      name={isAddOn ? "addonServices" : "techPreferences"}
                      value={label}
                      checked={selected}
                      onChange={() =>
                        isAddOn
                          ? setSelectedAddOns(toggleValue(selectedAddOns, label))
                          : setSelectedTech(toggleValue(selectedTech, label))
                      }
                      className="mr-3"
                    />
                    <span className="font-semibold">{label}</span>
                    {typeof item !== "string" ? (
                      <>
                        <span className="ml-2 text-[11px] uppercase tracking-[0.14em] text-[var(--studio-signal)]">
                          {amountLabel(item.amount)}
                        </span>
                        <div className="mt-2 leading-7">{item.description}</div>
                      </>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
