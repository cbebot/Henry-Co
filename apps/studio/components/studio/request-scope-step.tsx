import {
  joinClassNames,
  toggleValue,
} from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { filterPricedOptions } from "@/lib/studio/request-config";

function amountLabel(amount: number) {
  return amount > 0 ? `+₦${amount.toLocaleString("en-NG")}` : "Included";
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

          <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-3">
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
