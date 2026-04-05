"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { StudioListbox } from "@/components/studio/studio-listbox";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import type {
  StudioModifierOption,
  StudioPricedOption,
  StudioRequestConfig,
} from "@/lib/studio/request-config";

type Props = {
  initialConfig: StudioRequestConfig;
};

const serviceKinds = [
  "website",
  "mobile_app",
  "ui_ux",
  "branding",
  "ecommerce",
  "internal_system",
  "custom_software",
] as const;

function createOption(prefix: string): StudioPricedOption {
  const id = crypto.randomUUID();
  return {
    id: `${prefix}-${id}`,
    label: "",
    description: "",
    amount: 0,
    isActive: true,
    serviceKinds: [],
  };
}

function createModifier(prefix: string): StudioModifierOption {
  const id = crypto.randomUUID();
  return {
    id: `${prefix}-${id}`,
    label: "",
    description: "",
    modifierType: "percent",
    value: 0,
    isActive: true,
    serviceKinds: [],
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--studio-line)] bg-black/10 p-5">
      <div className="max-w-3xl">
        <div className="text-sm font-semibold text-[var(--studio-ink)]">{title}</div>
        <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{description}</p>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function RowShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-4">
      {children}
    </div>
  );
}

export function StudioRequestConfigEditor({ initialConfig }: Props) {
  const [draft, setDraft] = useState<StudioRequestConfig>(initialConfig);

  const payload = useMemo(() => JSON.stringify(draft), [draft]);

  function updateStringList(
    key: keyof Pick<
      StudioRequestConfig,
      "businessOptions" | "budgetOptions" | "designOptions" | "stackOptions"
    >,
    index: number,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function addStringItem(
    key: keyof Pick<
      StudioRequestConfig,
      "businessOptions" | "budgetOptions" | "designOptions" | "stackOptions"
    >
  ) {
    setDraft((current) => ({
      ...current,
      [key]: [...current[key], ""],
    }));
  }

  function removeStringItem(
    key: keyof Pick<
      StudioRequestConfig,
      "businessOptions" | "budgetOptions" | "designOptions" | "stackOptions"
    >,
    index: number
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateOptionList(
    key: keyof Pick<
      StudioRequestConfig,
      "projectTypes" | "platformOptions" | "pageOptions" | "moduleOptions" | "addOnOptions"
    >,
    index: number,
    patch: Partial<StudioPricedOption>
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function addOptionItem(
    key: keyof Pick<
      StudioRequestConfig,
      "projectTypes" | "platformOptions" | "pageOptions" | "moduleOptions" | "addOnOptions"
    >
  ) {
    setDraft((current) => ({
      ...current,
      [key]: [...current[key], createOption(String(key))],
    }));
  }

  function removeOptionItem(
    key: keyof Pick<
      StudioRequestConfig,
      "projectTypes" | "platformOptions" | "pageOptions" | "moduleOptions" | "addOnOptions"
    >,
    index: number
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateModifierList(
    key: keyof Pick<StudioRequestConfig, "timelineOptions" | "urgencyOptions">,
    index: number,
    patch: Partial<StudioModifierOption>
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function addModifierItem(
    key: keyof Pick<StudioRequestConfig, "timelineOptions" | "urgencyOptions">
  ) {
    setDraft((current) => ({
      ...current,
      [key]: [...current[key], createModifier(String(key))],
    }));
  }

  function removeModifierItem(
    key: keyof Pick<StudioRequestConfig, "timelineOptions" | "urgencyOptions">,
    index: number
  ) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <div className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <Section
        title="Service categories and commercial entry points"
        description="Add more premium service layers, categories, and structured project types without editing code. Amounts here become part of the live public pricing breakdown."
      >
        {draft.projectTypes.map((item, index) => (
          <RowShell key={item.id}>
            <div className="grid gap-4 xl:grid-cols-[1fr_180px]">
              <input
                value={item.label}
                onChange={(event) =>
                  updateOptionList("projectTypes", index, { label: event.target.value })
                }
                className="studio-input rounded-full px-4 py-3"
                placeholder="Project type or category"
              />
              <input
                type="number"
                min="0"
                value={String(item.amount)}
                onChange={(event) =>
                  updateOptionList("projectTypes", index, { amount: Number(event.target.value || 0) })
                }
                className="studio-input rounded-full px-4 py-3"
                placeholder="Amount"
              />
              <textarea
                value={item.description}
                onChange={(event) =>
                  updateOptionList("projectTypes", index, { description: event.target.value })
                }
                rows={3}
                className="studio-textarea min-h-24 rounded-[1.2rem] px-4 py-3 xl:col-span-2"
                placeholder="Describe what this service lane means on the public request flow."
              />
              <input
                value={(item.serviceKinds ?? []).join(", ")}
                onChange={(event) =>
                  updateOptionList("projectTypes", index, {
                    serviceKinds: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean) as StudioPricedOption["serviceKinds"],
                  })
                }
                className="studio-input rounded-full px-4 py-3 xl:col-span-2"
                placeholder={`Service kinds: ${serviceKinds.join(", ")}`}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-3 text-sm text-[var(--studio-ink-soft)]">
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={(event) =>
                    updateOptionList("projectTypes", index, { isActive: event.target.checked })
                  }
                />
                Active in public flow
              </label>
              <button
                type="button"
                onClick={() => removeOptionItem("projectTypes", index)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </RowShell>
        ))}
        <button
          type="button"
          onClick={() => addOptionItem("projectTypes")}
          className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add service category
        </button>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Business sectors"
          description="Business-language options for the commercial brief."
        >
          {draft.businessOptions.map((item, index) => (
            <RowShell key={`business-${index}`}>
              <div className="flex items-center gap-3">
                <input
                  value={item}
                  onChange={(event) => updateStringList("businessOptions", index, event.target.value)}
                  className="studio-input rounded-full px-4 py-3"
                  placeholder="Business type"
                />
                <button
                  type="button"
                  onClick={() => removeStringItem("businessOptions", index)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] text-[var(--studio-ink)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </RowShell>
          ))}
          <button
            type="button"
            onClick={() => addStringItem("businessOptions")}
            className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add business sector
          </button>
        </Section>

        <Section
          title="Budget ranges"
          description="Budget lanes shown to buyers in the request funnel."
        >
          {draft.budgetOptions.map((item, index) => (
            <RowShell key={`budget-${index}`}>
              <div className="flex items-center gap-3">
                <input
                  value={item}
                  onChange={(event) => updateStringList("budgetOptions", index, event.target.value)}
                  className="studio-input rounded-full px-4 py-3"
                  placeholder="Budget range"
                />
                <button
                  type="button"
                  onClick={() => removeStringItem("budgetOptions", index)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] text-[var(--studio-ink)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </RowShell>
          ))}
          <button
            type="button"
            onClick={() => addStringItem("budgetOptions")}
            className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add budget lane
          </button>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section
          title="Timeline pricing"
          description="Compressed delivery lanes automatically add the correct premium in the public pricing summary."
        >
          {draft.timelineOptions.map((item, index) => (
            <RowShell key={item.id}>
              <div className="grid gap-4 md:grid-cols-[1fr_160px_160px]">
                <input
                  value={item.label}
                  onChange={(event) =>
                    updateModifierList("timelineOptions", index, { label: event.target.value })
                  }
                  className="studio-input rounded-full px-4 py-3"
                  placeholder="Timeline label"
                />
                <StudioListbox
                  name={`timeline-modifier-${item.id}`}
                  label="Timeline modifier type"
                  required
                  value={item.modifierType}
                  onChange={(v) =>
                    updateModifierList("timelineOptions", index, {
                      modifierType: v as StudioModifierOption["modifierType"],
                    })
                  }
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "flat", label: "Flat (₦)" },
                  ]}
                  className="md:max-w-[200px]"
                />
                <input
                  type="number"
                  min="0"
                  step={item.modifierType === "percent" ? "0.01" : "1000"}
                  value={String(item.value)}
                  onChange={(event) =>
                    updateModifierList("timelineOptions", index, {
                      value: Number(event.target.value || 0),
                    })
                  }
                  className="studio-input rounded-full px-4 py-3"
                  placeholder="Modifier"
                />
                <textarea
                  value={item.description}
                  onChange={(event) =>
                    updateModifierList("timelineOptions", index, { description: event.target.value })
                  }
                  rows={2}
                  className="studio-textarea min-h-20 rounded-[1.2rem] px-4 py-3 md:col-span-3"
                  placeholder="Explain when this timeline should be chosen."
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm text-[var(--studio-ink-soft)]">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(event) =>
                      updateModifierList("timelineOptions", index, { isActive: event.target.checked })
                    }
                  />
                  Active in public flow
                </label>
                <button
                  type="button"
                  onClick={() => removeModifierItem("timelineOptions", index)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </RowShell>
          ))}
          <button
            type="button"
            onClick={() => addModifierItem("timelineOptions")}
            className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add timeline lane
          </button>
        </Section>

        <Section
          title="Urgency modifiers"
          description="Use urgency when the client needs premium resourcing on top of the selected timeline."
        >
          {draft.urgencyOptions.map((item, index) => (
            <RowShell key={item.id}>
              <div className="grid gap-4 md:grid-cols-[1fr_160px_160px]">
                <input
                  value={item.label}
                  onChange={(event) =>
                    updateModifierList("urgencyOptions", index, { label: event.target.value })
                  }
                  className="studio-input rounded-full px-4 py-3"
                  placeholder="Urgency label"
                />
                <StudioListbox
                  name={`urgency-modifier-${item.id}`}
                  label="Urgency modifier type"
                  required
                  value={item.modifierType}
                  onChange={(v) =>
                    updateModifierList("urgencyOptions", index, {
                      modifierType: v as StudioModifierOption["modifierType"],
                    })
                  }
                  options={[
                    { value: "percent", label: "Percent" },
                    { value: "flat", label: "Flat (₦)" },
                  ]}
                  className="md:max-w-[200px]"
                />
                <input
                  type="number"
                  min="0"
                  step={item.modifierType === "percent" ? "0.01" : "1000"}
                  value={String(item.value)}
                  onChange={(event) =>
                    updateModifierList("urgencyOptions", index, {
                      value: Number(event.target.value || 0),
                    })
                  }
                  className="studio-input rounded-full px-4 py-3"
                  placeholder="Modifier"
                />
                <textarea
                  value={item.description}
                  onChange={(event) =>
                    updateModifierList("urgencyOptions", index, { description: event.target.value })
                  }
                  rows={2}
                  className="studio-textarea min-h-20 rounded-[1.2rem] px-4 py-3 md:col-span-3"
                  placeholder="Explain what this urgency option means to the client."
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm text-[var(--studio-ink-soft)]">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(event) =>
                      updateModifierList("urgencyOptions", index, { isActive: event.target.checked })
                    }
                  />
                  Active in public flow
                </label>
                <button
                  type="button"
                  onClick={() => removeModifierItem("urgencyOptions", index)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </RowShell>
          ))}
          <button
            type="button"
            onClick={() => addModifierItem("urgencyOptions")}
            className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add urgency option
          </button>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {(
          [
            ["platformOptions", "Platform options", "Architecture lanes and their pricing impact."],
            ["pageOptions", "Interface and page systems", "Public request interface choices with live pricing values."],
            ["moduleOptions", "Functional modules", "System modules buyers can add to the scope."],
            ["addOnOptions", "Growth add-ons", "Premium extras such as branding, copy, automation, and support."],
          ] as const
        ).map(([key, title, description]) => (
          <Section key={key} title={title} description={description}>
            {draft[key].map((item, index) => (
              <RowShell key={item.id}>
                <div className="grid gap-4 xl:grid-cols-[1fr_180px]">
                  <input
                    value={item.label}
                    onChange={(event) =>
                      updateOptionList(key, index, { label: event.target.value })
                    }
                    className="studio-input rounded-full px-4 py-3"
                    placeholder="Label"
                  />
                  <input
                    type="number"
                    min="0"
                    value={String(item.amount)}
                    onChange={(event) =>
                      updateOptionList(key, index, { amount: Number(event.target.value || 0) })
                    }
                    className="studio-input rounded-full px-4 py-3"
                    placeholder="Amount"
                  />
                  <textarea
                    value={item.description}
                    onChange={(event) =>
                      updateOptionList(key, index, { description: event.target.value })
                    }
                    rows={2}
                    className="studio-textarea min-h-20 rounded-[1.2rem] px-4 py-3 xl:col-span-2"
                    placeholder="Description"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-3 text-sm text-[var(--studio-ink-soft)]">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={(event) =>
                        updateOptionList(key, index, { isActive: event.target.checked })
                      }
                    />
                    Active in public flow
                  </label>
                  <button
                    type="button"
                    onClick={() => removeOptionItem(key, index)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-4 py-2 text-xs font-semibold text-[var(--studio-ink)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </RowShell>
            ))}
            <button
              type="button"
              onClick={() => addOptionItem(key)}
              className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </Section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {(
          [
            ["designOptions", "Design directions", "Art direction options shown in the funnel."],
            ["stackOptions", "Stack preferences", "Technology preferences clients can mention."],
          ] as const
        ).map(([key, title, description]) => (
          <Section key={key} title={title} description={description}>
            {draft[key].map((item, index) => (
              <RowShell key={`${key}-${index}`}>
                <div className="flex items-center gap-3">
                  <input
                    value={item}
                    onChange={(event) => updateStringList(key, index, event.target.value)}
                    className="studio-input rounded-full px-4 py-3"
                    placeholder={title}
                  />
                  <button
                    type="button"
                    onClick={() => removeStringItem(key, index)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--studio-line)] text-[var(--studio-ink)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </RowShell>
            ))}
            <button
              type="button"
              onClick={() => addStringItem(key)}
              className="studio-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </Section>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--studio-line)] bg-black/10 px-5 py-4">
        <div className="max-w-3xl text-sm leading-7 text-[var(--studio-ink-soft)]">
          Saving this panel updates the live commercial config used by the public request funnel,
          pricing preview, and proposal/payment breakdowns.
        </div>
        <StudioSubmitButton label="Save request and pricing config" pendingLabel="Saving commercial config..." />
      </div>
    </div>
  );
}
