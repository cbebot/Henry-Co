"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Waypoints,
} from "lucide-react";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { submitStudioBriefAction } from "@/lib/studio/actions";
import type { StudioPackage, StudioService, StudioTeamProfile } from "@/lib/studio/types";

const businessOptions = [
  "Professional services firm",
  "Premium commerce brand",
  "Financial services or fintech",
  "Healthcare, wellness, or care operations",
  "Education, membership, or community platform",
  "Logistics, field operations, or dispatch",
  "Hospitality, real estate, or lifestyle brand",
  "Technology product or venture-backed business",
  "Internal transformation or enterprise operations",
];

const budgetOptions = [
  "₦1M to ₦2M",
  "₦2M to ₦5M",
  "₦5M to ₦10M",
  "₦10M to ₦25M",
  "₦25M to ₦50M",
  "₦50M+ / enterprise scope",
];

const urgencyOptions = [
  "Standard delivery lane",
  "Priority commercial timeline",
  "Urgent launch requirement",
];

const timelineOptions = [
  "2 to 4 weeks",
  "1 to 2 months",
  "2 to 4 months",
  "4 months+ or phased rollout",
  "Need HenryCo to recommend the timeline",
];

const projectTypeOptions = [
  "Executive company website",
  "Lead generation or campaign funnel",
  "Premium e-commerce storefront",
  "Client portal or account workspace",
  "Internal operations dashboard",
  "Mobile app",
  "Marketplace or booking platform",
  "Custom workflow software",
];

const platformOptions = [
  "Best-fit recommendation",
  "Website only",
  "Web app / SaaS product",
  "Mobile app",
  "Website plus admin dashboard",
  "Client portal plus internal operations layer",
  "Commerce storefront plus backend operations layer",
];

const designOptions = [
  "Quiet luxury and high-trust",
  "Editorial and brand-forward",
  "Technical, product-led, and precise",
  "Corporate, premium, and authoritative",
  "HenryCo should direct the aesthetic",
];

const pageOptions = [
  "Homepage and offer pages",
  "Services or solution pages",
  "About, team, and trust pages",
  "Case studies or proof pages",
  "Pricing, proposal, or quote surfaces",
  "Client account or portal views",
  "Admin dashboard or internal control room",
  "Checkout, payment, or invoice views",
];

const moduleOptions = [
  "CMS or structured content management",
  "Admin dashboard",
  "Role-based permissions",
  "Payments and invoicing",
  "Bookings, scheduling, or calendar logic",
  "Client account area",
  "Automation and notifications",
  "Analytics and reporting",
  "CRM, ERP, or third-party integrations",
  "File vault or delivery library",
];

const addOnOptions = [
  "Brand identity",
  "Copywriting and messaging",
  "SEO foundation",
  "Launch campaign or sales pages",
  "Email lifecycle automation",
  "WhatsApp customer workflow",
  "Maintenance or retained support",
  "Launch support and training",
];

const stackOptions = [
  "Best-fit stack recommendation",
  "Supabase",
  "Custom CMS",
  "React Native",
  "Flutter",
  "Node.js services",
  "Existing stack continuation",
];

type Props = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  preferredTeamId?: string | null;
};

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)));
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function readinessBand(score: number) {
  if (score >= 82) return "High clarity";
  if (score >= 66) return "Commercially strong";
  if (score >= 50) return "Good foundation";
  return "Early brief";
}

export function StudioRequestBuilder({
  services,
  packages,
  teams,
  preferredTeamId,
}: Props) {
  const [serviceKind, setServiceKind] = useState<StudioService["kind"]>(services[0]?.kind ?? "website");
  const [pathway, setPathway] = useState<"package" | "custom">("custom");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(preferredTeamId ?? "");
  const [selectedProjectType, setSelectedProjectType] = useState(projectTypeOptions[0] ?? "");
  const [selectedPlatform, setSelectedPlatform] = useState(platformOptions[0] ?? "");
  const [selectedDesign, setSelectedDesign] = useState(designOptions[0] ?? "");
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);

  const filteredPackages = useMemo(
    () =>
      packages.filter(
        (pkg) => services.find((service) => service.id === pkg.serviceId)?.kind === serviceKind
      ),
    [packages, serviceKind, services]
  );

  const selectedService = services.find((service) => service.kind === serviceKind) ?? services[0];
  const selectedPackage =
    filteredPackages.find((item) => item.id === selectedPackageId) ?? filteredPackages[0] ?? null;
  const recommendedTeam =
    teams.find((team) => team.id === selectedTeamId) ??
    teams.find((team) => team.scoreBiases.some((bias) => serviceKind.includes(bias))) ??
    teams[0] ??
    null;

  const readinessScore = useMemo(() => {
    let score = pathway === "custom" ? 56 : 52;
    if (pathway === "package" && selectedPackage) score += 8;
    if (selectedProjectType) score += 4;
    if (selectedPlatform) score += 4;
    if (selectedDesign) score += 4;
    if (selectedPages.length >= 3) score += 8;
    if (selectedModules.length >= 3) score += 10;
    if (selectedAddOns.length >= 2) score += 6;
    if (selectedTech.length >= 1) score += 4;
    if (recommendedTeam) score += 4;
    return Math.min(score, 100);
  }, [
    pathway,
    recommendedTeam,
    selectedAddOns.length,
    selectedDesign,
    selectedModules.length,
    selectedPackage,
    selectedPages.length,
    selectedPlatform,
    selectedProjectType,
    selectedTech.length,
  ]);

  const submissionOutcomes = [
    "Lead, brief, and custom request are persisted in Studio.",
    "The proposal path is opened immediately instead of waiting on a generic follow-up.",
    "Team matching, notifications, and payment-aware delivery can continue on the same record.",
  ];

  return (
    <form action={submitStudioBriefAction} className="space-y-6">
      <input type="hidden" name="preferredTeamId" value={selectedTeamId} />
      <input type="hidden" name="serviceKind" value={serviceKind} />
      <input type="hidden" name="packageIntent" value={pathway} />
      <input type="hidden" name="packageId" value={pathway === "package" ? selectedPackageId : ""} />
      <input type="hidden" name="designDirection" value={selectedDesign} />

      <section className="studio-panel rounded-[2.7rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="studio-kicker">Scope architecture</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)] sm:text-4xl">
              Choose the commercial path, the service lane, and the operating posture before the form gets tactical.
            </h2>
            <p className="mt-4 text-sm leading-8 text-[var(--studio-ink-soft)] sm:text-base">
              HenryCo Studio is designed for serious buyers. Packages are for premium repeatable work.
              Custom project mode is for bespoke websites, apps, admin systems, and workflow-heavy
              software that need a clearer architecture and proposal posture.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Choose the buying lane"],
              ["02", "Define the build shape"],
              ["03", "Submit a real project brief"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--studio-signal)]">{step}</div>
                <div className="mt-2 text-sm font-medium leading-6 text-[var(--studio-ink)]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {[
            {
              value: "package" as const,
              title: "Package lane",
              body: "Use this when the project fits a premium predefined lane and you want faster pricing clarity.",
              icon: Layers3,
            },
            {
              value: "custom" as const,
              title: "Custom project",
              body: "Use this when the website, app, portal, or software needs a tailored scope, workflow, or architecture path.",
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
                  ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] shadow-[0_24px_70px_rgba(7,25,33,0.45)]"
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
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="studio-kicker">
                  {pathway === "package" ? "Package comparison" : "Custom project architecture"}
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                  {pathway === "package"
                    ? "Choose the premium package that best matches the work."
                    : "Define the exact kind of system HenryCo Studio should scope for you."}
                </h3>
              </div>
              <div className="rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                {pathway === "package" ? "Faster buying lane" : "Tailored scope lane"}
              </div>
            </div>

            {pathway === "package" ? (
              <div className="mt-6 space-y-4">
                {filteredPackages.length === 0 ? (
                  <div className="rounded-[1.7rem] border border-[var(--studio-line)] bg-black/10 p-5 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    No published package is currently live for this service lane. Switch to custom project
                    and scope the exact website, app, portal, or software request directly.
                  </div>
                ) : (
                  filteredPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={joinClassNames(
                        "w-full rounded-[1.9rem] border p-5 text-left transition duration-200",
                        selectedPackageId === pkg.id
                          ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                          : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.18)]"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                          <div className="text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
                            {pkg.name}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
                            {pkg.summary}
                          </p>
                          <div className="mt-4 text-sm font-medium text-[var(--studio-ink)]">
                            Best for: {pkg.bestFor}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                              Investment
                            </div>
                            <div className="mt-2 text-lg font-semibold text-[var(--studio-ink)]">
                              {formatNaira(pkg.price)}
                            </div>
                          </div>
                          <div className="rounded-[1.2rem] border border-[var(--studio-line)] bg-black/10 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                              Timeline
                            </div>
                            <div className="mt-2 text-lg font-semibold text-[var(--studio-ink)]">
                              {pkg.timelineWeeks} weeks
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {pkg.includes.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-[var(--studio-ink-soft)]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[var(--studio-ink)]">
                      What are you building?
                    </label>
                    <select
                      name="projectType"
                      value={selectedProjectType}
                      onChange={(event) => setSelectedProjectType(event.target.value)}
                      className="studio-select mt-2 rounded-[1.2rem] px-4 py-3"
                    >
                      {projectTypeOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--studio-ink)]">
                      Preferred platform direction
                    </label>
                    <select
                      name="platformPreference"
                      value={selectedPlatform}
                      onChange={(event) => setSelectedPlatform(event.target.value)}
                      className="studio-select mt-2 rounded-[1.2rem] px-4 py-3"
                    >
                      {platformOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--studio-ink)]">
                    Design direction
                  </label>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
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

                <div>
                  <label className="block text-sm font-medium text-[var(--studio-ink)]">
                    Important pages or interfaces
                  </label>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {pageOptions.map((item) => (
                      <label
                        key={item}
                        className={joinClassNames(
                          "rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
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
                          onChange={() => setSelectedPages((current) => toggleValue(current, item))}
                          className="mr-3"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="studio-kicker">Functional scope</div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-[var(--studio-ink)]">Core modules</h3>
                <div className="mt-4 grid gap-3">
                  {moduleOptions.map((item) => (
                    <label
                      key={item}
                      className={joinClassNames(
                        "rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
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
                        onChange={() => setSelectedModules((current) => toggleValue(current, item))}
                        className="mr-3"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--studio-ink)]">Growth add-ons</h3>
                  <div className="mt-4 grid gap-3">
                    {addOnOptions.map((item) => (
                      <label
                        key={item}
                        className={joinClassNames(
                          "rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                          selectedAddOns.includes(item)
                            ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                            : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="addonServices"
                          value={item}
                          checked={selectedAddOns.includes(item)}
                          onChange={() => setSelectedAddOns((current) => toggleValue(current, item))}
                          className="mr-3"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[var(--studio-ink)]">Technical direction</h3>
                  <div className="mt-4 grid gap-3">
                    {stackOptions.map((item) => (
                      <label
                        key={item}
                        className={joinClassNames(
                          "rounded-[1.35rem] border px-4 py-4 text-sm transition duration-200",
                          selectedTech.includes(item)
                            ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))] text-[var(--studio-ink)]"
                            : "border-[var(--studio-line)] bg-black/10 text-[var(--studio-ink-soft)]"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="techPreferences"
                          value={item}
                          checked={selectedTech.includes(item)}
                          onChange={() => setSelectedTech((current) => toggleValue(current, item))}
                          className="mr-3"
                        />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="studio-kicker">Commercial context and buyer intent</div>
            <div className="mt-6 grid gap-4 xl:grid-cols-4">
              <select name="businessType" required className="studio-select rounded-[1.2rem] px-4 py-3">
                <option value="">Business type</option>
                {businessOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select name="budgetBand" required className="studio-select rounded-[1.2rem] px-4 py-3">
                <option value="">Budget range</option>
                {budgetOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select name="urgency" required className="studio-select rounded-[1.2rem] px-4 py-3">
                <option value="">Urgency</option>
                {urgencyOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select name="timeline" required className="studio-select rounded-[1.2rem] px-4 py-3">
                <option value="">Timeline expectation</option>
                {timelineOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--studio-ink)]">
                  What should this project achieve commercially?
                </label>
                <textarea
                  name="goals"
                  required
                  className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
                  placeholder="Describe the business outcome, conversion objective, internal efficiency gain, or market position this project needs to create."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--studio-ink)]">
                  Describe exactly what needs to be built
                </label>
                <textarea
                  name="scopeNotes"
                  required
                  className="studio-textarea mt-2 min-h-36 rounded-[1.6rem] px-4 py-4"
                  placeholder="Explain the product, workflow, user roles, approval path, integrations, and any constraints that should shape scope and delivery."
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-[var(--studio-ink)]">
                References, inspirations, or strategic notes
              </label>
              <textarea
                name="inspirationSummary"
                className="studio-textarea mt-2 min-h-28 rounded-[1.6rem] px-4 py-4"
                placeholder="Share websites, apps, flows, competitors, visual references, or internal documents HenryCo should study before shaping the proposal."
              />
            </div>
          </section>

          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="studio-kicker">References, team fit, and activation</div>
            <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--studio-ink)]">Reference links</label>
                  <input
                    name="referenceLinks"
                    className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
                    placeholder="https://reference-one.com"
                  />
                  <input
                    name="referenceLinks"
                    className="studio-input mt-3 rounded-[1.2rem] px-4 py-3"
                    placeholder="https://reference-two.com"
                  />
                  <input
                    name="referenceLinks"
                    className="studio-input mt-3 rounded-[1.2rem] px-4 py-3"
                    placeholder="https://reference-three.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--studio-ink)]">Reference files</label>
                  <input
                    name="referenceFiles"
                    type="file"
                    multiple
                    className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 px-4 py-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  <input type="checkbox" name="depositNow" className="mt-1" />
                  I am ready to move into a deposit-backed project lane as soon as the commercial scope is accepted.
                </label>
              </div>

              <div>
                <div className="text-sm font-medium text-[var(--studio-ink)]">Choose a team or let HenryCo match the project</div>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamId("")}
                    className={joinClassNames(
                      "rounded-[1.5rem] border p-4 text-left transition duration-200",
                      selectedTeamId === ""
                        ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                        : "border-[var(--studio-line)] bg-black/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-[var(--studio-ink)]">
                          Let HenryCo recommend the best-fit team
                        </div>
                        <div className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                          Best when you want the project matched by scope, delivery posture, and team specialization.
                        </div>
                      </div>
                      <Waypoints className="h-5 w-5 text-[var(--studio-signal)]" />
                    </div>
                  </button>

                  <div className="grid gap-3 md:grid-cols-2">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeamId(team.id)}
                        className={joinClassNames(
                          "rounded-[1.5rem] border p-4 text-left transition duration-200",
                          selectedTeamId === team.id
                            ? "border-[rgba(151,244,243,0.42)] bg-[linear-gradient(180deg,rgba(11,42,52,0.94),rgba(7,22,30,0.98))]"
                            : "border-[var(--studio-line)] bg-black/10"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-[var(--studio-ink)]">{team.name}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
                              {team.label}
                            </div>
                          </div>
                          <span className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                            {team.availability}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">{team.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-8">
            <div className="studio-kicker">Contact and next move</div>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--studio-ink)]">Your name</label>
                <input
                  name="customerName"
                  required
                  className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--studio-ink)]">Company or brand</label>
                <input
                  name="companyName"
                  className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
                  placeholder="Company or brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--studio-ink)]">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--studio-ink)]">Phone / WhatsApp</label>
                <input
                  name="phone"
                  className="studio-input mt-2 rounded-[1.2rem] px-4 py-3"
                  placeholder="+234..."
                />
              </div>
            </div>

            <div className="mt-6 rounded-[1.8rem] border border-[var(--studio-line)] bg-black/10 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="text-lg font-semibold text-[var(--studio-ink)]">
                    What HenryCo Studio does after submission
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">
                    The brief is stored as a live Studio record, routed into the proposal flow, and
                    prepared for milestone, payment, revision, and project-update communication on the
                    same operating model.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--studio-signal)]" />
              </div>
            </div>

            <div className="mt-6">
              <StudioSubmitButton
                label="Submit Studio brief"
                pendingLabel="Building your Studio brief..."
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6 2xl:sticky 2xl:top-28">
          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="studio-kicker">Live brief signal</div>
              <Gauge className="h-5 w-5 text-[var(--studio-signal)]" />
            </div>
            <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">
              {readinessScore}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--studio-signal)]">
              {readinessBand(readinessScore)}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
              This is a preview of how much commercial and delivery clarity the current brief already contains.
            </p>

            <div className="mt-6 space-y-3">
              {[
                {
                  icon: BriefcaseBusiness,
                  label: "Buying route",
                  value: pathway === "package" ? "Package-led engagement" : "Custom proposal path",
                },
                {
                  icon: CircleDollarSign,
                  label: "Starting investment lane",
                  value: formatNaira(
                    pathway === "package"
                      ? selectedPackage?.price ?? selectedService?.startingPrice ?? 0
                      : selectedService?.startingPrice ?? 0
                  ),
                },
                {
                  icon: Target,
                  label: "Recommended team",
                  value: recommendedTeam?.name || "HenryCo match layer",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-[var(--studio-signal)]" />
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                      {item.label}
                    </div>
                  </div>
                  <div className="mt-3 text-base font-semibold text-[var(--studio-ink)]">{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-7">
            <div className="studio-kicker">Proposal outcome</div>
            <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
              The brief turns directly into a real Studio record.
            </div>
            <div className="mt-5 space-y-3">
              {submissionOutcomes.map((item) => (
                <div key={item} className="flex gap-3 rounded-[1.3rem] border border-[var(--studio-line)] bg-black/10 p-4 text-sm leading-7 text-[var(--studio-ink-soft)]">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--studio-signal)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="studio-panel rounded-[2.5rem] p-6 sm:p-7">
            <div className="studio-kicker">Why this feels different</div>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Proposal-first conversion",
                  body: "The request does not disappear into a generic inquiry inbox.",
                },
                {
                  icon: Waypoints,
                  title: "Team match or direct selection",
                  body: "Buyer preference and HenryCo routing logic can coexist on the same brief.",
                },
                {
                  icon: Sparkles,
                  title: "First-class custom work",
                  body: "Bespoke scope is treated as a premium path, not a fallback apology.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-4">
                  <item.icon className="h-4 w-4 text-[var(--studio-signal)]" />
                  <div className="mt-3 text-base font-semibold text-[var(--studio-ink)]">{item.title}</div>
                  <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
