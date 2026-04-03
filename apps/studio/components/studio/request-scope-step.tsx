import {
  addOnOptions,
  joinClassNames,
  moduleOptions,
  pageOptions,
  stackOptions,
  toggleValue,
} from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";

export function StudioRequestScopeStep({
  pathway,
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
  | "pathway"
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
  return (
    <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
      <div className="studio-kicker">Scope design</div>
      {pathway === "package" ? (
        <div className="mt-5 rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
          <div className="text-lg font-semibold text-[var(--studio-ink)]">
            {selectedPackage?.name || "Choose a package from the first step"}
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
            Package mode keeps the request cleaner. Use the commercial notes and references in the next
            step for brand nuance, goals, and any constraints HenryCo should see before pricing.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            {pageOptions.map((item) => (
              <label
                key={item}
                className={joinClassNames(
                  "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                  selectedPages.includes(item)
                    ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                    : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                )}
              >
                <input
                  type="checkbox"
                  name="pageRequirements"
                  value={item}
                  checked={selectedPages.includes(item)}
                  onChange={() => setSelectedPages(toggleValue(selectedPages, item))}
                  className="mr-3"
                />
                {item}
              </label>
            ))}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              {moduleOptions.map((item) => (
                <label
                  key={item}
                  className={joinClassNames(
                    "block rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                    selectedModules.includes(item)
                      ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                      : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                  )}
                >
                  <input
                    type="checkbox"
                    name="requiredFeatures"
                    value={item}
                    checked={selectedModules.includes(item)}
                    onChange={() => setSelectedModules(toggleValue(selectedModules, item))}
                    className="mr-3"
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[...addOnOptions, ...stackOptions].map((item) => {
                const isAddOn = addOnOptions.includes(item);
                const selected = isAddOn ? selectedAddOns.includes(item) : selectedTech.includes(item);
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
                      name={isAddOn ? "addonServices" : "techPreferences"}
                      value={item}
                      checked={selected}
                      onChange={() =>
                        isAddOn
                          ? setSelectedAddOns(toggleValue(selectedAddOns, item))
                          : setSelectedTech(toggleValue(selectedTech, item))
                      }
                      className="mr-3"
                    />
                    {item}
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
