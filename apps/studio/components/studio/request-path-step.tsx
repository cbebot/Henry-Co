import { Layers3, Sparkles } from "lucide-react";
import {
  joinClassNames,
} from "@/components/studio/request-builder-data";
import { StudioListbox } from "@/components/studio/studio-listbox";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";
import { filterPricedOptions } from "@/lib/studio/request-config";

function formatAmount(amount: number) {
  return amount > 0 ? `+₦${amount.toLocaleString("en-NG")}` : "Included";
}

export function StudioRequestPathStep({
  services,
  packages,
  requestConfig,
  serviceKind,
  setServiceKind,
  pathway,
  setPathway,
  filteredPackages,
  selectedPackage,
  setSelectedPackageId,
  selectedProjectType,
  setSelectedProjectType,
  selectedPlatform,
  setSelectedPlatform,
  selectedDesign,
  setSelectedDesign,
  preferredLanguage,
  setPreferredLanguage,
}: Pick<
  RequestBuilderSelectionProps,
  | "services"
  | "packages"
  | "requestConfig"
  | "serviceKind"
  | "setServiceKind"
  | "pathway"
  | "setPathway"
  | "filteredPackages"
  | "selectedPackage"
  | "setSelectedPackageId"
  | "selectedProjectType"
  | "setSelectedProjectType"
  | "selectedPlatform"
  | "setSelectedPlatform"
  | "selectedDesign"
  | "setSelectedDesign"
  | "preferredLanguage"
  | "setPreferredLanguage"
>) {
  const projectTypeOptions = filterPricedOptions(requestConfig.projectTypes, serviceKind);
  const platformOptions = filterPricedOptions(requestConfig.platformOptions, serviceKind);

  return (
    <section className="studio-panel rounded-[1.6rem] p-5 sm:p-7">
      <div className="studio-kicker">Buying lane</div>
      {/* Two-up segmented control. Replaces the prior pair of large
       * tile-cards with a horizontal segment for fast comparison —
       * less vertical real estate, equal information weight, no
       * card stacking on narrow widths. */}
      <div
        role="radiogroup"
        aria-label="Buying lane"
        className="mt-5 grid grid-cols-2 gap-2 rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 p-1.5"
      >
        {[
          {
            value: "package" as const,
            title: "Package",
            body: "Predefined lane",
            icon: Layers3,
          },
          {
            value: "custom" as const,
            title: "Custom",
            body: "Tailored scope",
            icon: Sparkles,
          },
        ].map((item) => {
          const isActive = pathway === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => {
                setPathway(item.value);
                if (item.value === "package" && filteredPackages[0]) {
                  setSelectedPackageId(filteredPackages[0].id);
                }
              }}
              className={joinClassNames(
                "flex items-center justify-center gap-2 rounded-[0.95rem] px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-[rgba(151,244,243,0.12)] text-[var(--studio-ink)] shadow-[inset_0_0_0_1px_rgba(151,244,243,0.45)]"
                  : "text-[var(--studio-ink-soft)] hover:text-[var(--studio-ink)]"
              )}
            >
              <item.icon
                className={joinClassNames(
                  "h-3.5 w-3.5",
                  isActive ? "text-[var(--studio-signal)]" : "text-[var(--studio-ink-soft)]"
                )}
              />
              <span>{item.title}</span>
              <span className="hidden text-[11px] font-normal text-[var(--studio-ink-soft)] sm:inline">
                · {item.body}
              </span>
            </button>
          );
        })}
      </div>

      {/* Service kinds — hairline-divided list. The previous version
       * was a 2-up grid of large bordered tiles, each with full padding
       * + 4-line content; with 5+ service kinds this stacked into a
       * dense card wall. The list form is denser and lets the user
       * scan headlines without scroll fatigue. */}
      <ul className="mt-7 divide-y divide-[var(--studio-line)] overflow-hidden rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10">
        {services.map((service) => {
          const isActive = serviceKind === service.kind;
          return (
            <li key={service.id}>
              <button
                type="button"
                onClick={() => {
                  setServiceKind(service.kind);
                  const nextPackages = packages.filter(
                    (pkg) =>
                      services.find((item) => item.id === pkg.serviceId)?.kind === service.kind
                  );
                  setSelectedPackageId(nextPackages[0]?.id ?? "");
                }}
                className={joinClassNames(
                  "relative flex w-full flex-col gap-2 px-4 py-3 text-left transition sm:px-5 sm:py-4",
                  isActive
                    ? "bg-[rgba(151,244,243,0.06)]"
                    : "hover:bg-[rgba(255,255,255,0.02)]"
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[2px] bg-[var(--studio-signal)]"
                  />
                ) : null}
                {/* Mobile: kicker on its own line, headline below.
                 * Desktop (sm+): kicker + headline on one row, delivery
                 * + price docked right. Stacked layout on narrow widths
                 * stops the right column from overflowing the viewport
                 * — which was clipping headlines on phones. */}
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                    {service.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 sm:mt-0.5">
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--studio-ink)]">
                      {service.headline}
                    </span>
                    <div className="flex shrink-0 items-baseline gap-2 text-[11px] tabular-nums">
                      <span className="text-[var(--studio-ink-soft)]">
                        {service.deliveryWindow}
                      </span>
                      <span className="font-semibold text-[var(--studio-signal)]">
                        ₦{service.startingPrice.toLocaleString("en-NG")}+
                      </span>
                    </div>
                  </div>
                </div>
                <p className="line-clamp-2 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                  {service.summary}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {pathway === "package" ? (
        <div className="mt-7">
          {filteredPackages.length === 0 ? (
            <div className="rounded-[1rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3 text-sm text-[var(--studio-ink-soft)]">
              No fixed package is available for this service yet. Switch to the
              custom project route.
            </div>
          ) : null}
          <ul className="divide-y divide-[var(--studio-line)] overflow-hidden rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10">
            {filteredPackages.map((pkg) => {
              const isActive = selectedPackage?.id === pkg.id;
              return (
                <li key={pkg.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={joinClassNames(
                      "relative flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition sm:px-5 sm:py-4",
                      isActive
                        ? "bg-[rgba(151,244,243,0.06)]"
                        : "hover:bg-[rgba(255,255,255,0.02)]"
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[2px] bg-[var(--studio-signal)]"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[var(--studio-ink)]">
                        {pkg.name}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
                        {pkg.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-[var(--studio-ink)]">
                        ₦{pkg.price.toLocaleString("en-NG")}
                      </div>
                      <div className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                        {Math.round(pkg.depositRate * 100)}% deposit
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-8 space-y-7">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                Project type or category
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
                {projectTypeOptions.length} options
              </div>
            </div>
            <div className="mt-3">
              <StudioListbox
                name="projectType"
                label="Project type or category"
                value={selectedProjectType}
                onChange={(next) => next && setSelectedProjectType(next)}
                placeholder="Choose project type…"
                required
                options={projectTypeOptions.map((item) => ({
                  value: item.label,
                  label: `${item.label} · ${formatAmount(item.amount)}`,
                }))}
              />
            </div>
            {(() => {
              const current = projectTypeOptions.find((option) => option.label === selectedProjectType);
              if (!current) return null;
              return (
                <p className="mt-3 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {current.description}
                </p>
              );
            })()}
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                Delivery platform
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">
                {platformOptions.length} options
              </div>
            </div>
            <div className="mt-3">
              <StudioListbox
                name="platformPreference"
                label="Delivery platform"
                value={selectedPlatform}
                onChange={(next) => next && setSelectedPlatform(next)}
                placeholder="Choose platform…"
                required
                options={platformOptions.map((item) => ({
                  value: item.label,
                  label: `${item.label} · ${formatAmount(item.amount)}`,
                }))}
              />
            </div>
            {(() => {
              const current = platformOptions.find((option) => option.label === selectedPlatform);
              if (!current) return null;
              return (
                <p className="mt-3 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  {current.description}
                </p>
              );
            })()}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                Design direction
              </div>
              <div className="mt-3">
                <StudioListbox
                  name="designDirectionDropdown"
                  label="Design direction"
                  value={selectedDesign}
                  onChange={(next) => next && setSelectedDesign(next)}
                  placeholder="Choose design direction…"
                  required
                  options={requestConfig.designOptions.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                Project/content language
              </div>
              <div className="mt-3">
                <StudioListbox
                  name="preferredLanguageDropdown"
                  label="Project/content language"
                  value={preferredLanguage}
                  onChange={(next) => next && setPreferredLanguage(next)}
                  placeholder="Choose language…"
                  required
                  options={["English", "French", "Arabic", "Portuguese"].map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </div>
              <input type="hidden" name="preferredLanguage" value={preferredLanguage} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
