import { Layers3, Sparkles } from "lucide-react";
import {
  designOptions,
  joinClassNames,
  platformOptions,
  projectTypeOptions,
} from "@/components/studio/request-builder-data";
import type { RequestBuilderSelectionProps } from "@/components/studio/request-builder-types";

export function StudioRequestPathStep({
  services,
  packages,
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
}: Pick<
  RequestBuilderSelectionProps,
  | "services"
  | "packages"
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
>) {
  return (
    <section className="studio-panel rounded-[2.6rem] p-6 sm:p-8">
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
            body: "Use this when the website, app, portal, or software needs a tailored scope, workflow model, or multi-role architecture.",
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
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  {service.deliveryWindow}
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
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <select
            name="projectType"
            value={selectedProjectType}
            onChange={(event) => setSelectedProjectType(event.target.value)}
            className="studio-select rounded-[1.2rem] px-4 py-3"
          >
            {projectTypeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            name="platformPreference"
            value={selectedPlatform}
            onChange={(event) => setSelectedPlatform(event.target.value)}
            className="studio-select rounded-[1.2rem] px-4 py-3"
          >
            {platformOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            {designOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedDesign(item)}
                className={joinClassNames(
                  "rounded-[1.35rem] border px-4 py-4 text-left text-sm transition duration-200",
                  selectedDesign === item
                    ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                    : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
