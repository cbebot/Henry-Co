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
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {[
          {
            value: "package" as const,
            title: "Package-led engagement",
            body: "Use this when the work fits a premium predefined lane and you want faster pricing clarity with a cleaner decision path.",
            icon: Layers3,
          },
          {
            value: "custom" as const,
            title: "Custom project route",
            body: "Use this when the website, app, portal, or software needs a tailored scope, delivery model, or multi-role architecture.",
            icon: Sparkles,
          },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setPathway(item.value);
              if (item.value === "package" && filteredPackages[0]) {
                setSelectedPackageId(filteredPackages[0].id);
              }
            }}
            className={joinClassNames(
              "rounded-[2rem] border p-6 text-left transition duration-200",
              pathway === item.value
                ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.2)]"
            )}
          >
            <item.icon className="h-5 w-5 text-[var(--studio-signal)]" />
            <div className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--studio-ink)]">
              {item.title}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {services.map((service) => {
          const isActive = serviceKind === service.kind;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setServiceKind(service.kind);
                const nextPackages = packages.filter(
                  (pkg) => services.find((item) => item.id === pkg.serviceId)?.kind === service.kind
                );
                setSelectedPackageId(nextPackages[0]?.id ?? "");
              }}
              className={joinClassNames(
                "rounded-[1.8rem] border p-5 text-left transition duration-200",
                isActive
                  ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                  : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.18)]"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                  {service.name}
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                    {service.deliveryWindow}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                    From ₦{service.startingPrice.toLocaleString("en-NG")}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                {service.headline}
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{service.summary}</p>
            </button>
          );
        })}
      </div>

      {pathway === "package" ? (
        <div className="mt-8 space-y-4">
          {filteredPackages.length === 0 ? (
            <div className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4 text-sm text-[var(--studio-ink-soft)]">
              No fixed package is available for this service yet. Switch to the custom project route.
            </div>
          ) : null}
          {filteredPackages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedPackageId(pkg.id)}
              className={joinClassNames(
                "w-full rounded-[1.9rem] border p-5 text-left transition duration-200",
                selectedPackage?.id === pkg.id
                  ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                  : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.18)]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                    {pkg.name}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{pkg.summary}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-[var(--studio-ink)]">₦{pkg.price.toLocaleString("en-NG")}</div>
                  <div className="mt-1 uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                    Deposit {Math.round(pkg.depositRate * 100)}%
                  </div>
                </div>
              </div>
            </button>
          ))}
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
