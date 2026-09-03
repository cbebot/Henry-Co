"use client";

import { useEffect, useState } from "react";
import { Check, Save, Settings2, Sparkles } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

/**
 * V3 PASS 21 — `<CarePreferenceForm>`
 *
 * Per-user, per-garment-type care preferences. Persists to
 * care_user_preferences via /api/care/preferences/garments.
 *
 * Garment-type catalogue is keyed by `garmentTypeKey` (the seed
 * catalogue ships with stable keys: 'shirt', 'suit', 'agbada',
 * 'curtains', 'household_linen', ...). The component is the same
 * shape regardless of garment type; the options form is a curated
 * subset of:
 *   - starch:   'none' | 'light' | 'medium' | 'heavy'
 *   - fragrance: 'none' | 'fresh' | 'floral' | 'classic'
 *   - fold:     'fold' | 'hang' | 'roll'
 *   - stain:    'gentle' | 'standard' | 'aggressive'
 *
 * The form is single-section so it fits inside the /book step 5 sheet
 * AND inside the account /care/preferences route.
 */

const STARCH_OPTIONS = [
  { value: "none", label: "No starch" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
] as const;

const FRAGRANCE_OPTIONS = [
  { value: "none", label: "No fragrance" },
  { value: "fresh", label: "Fresh" },
  { value: "floral", label: "Floral" },
  { value: "classic", label: "Classic" },
] as const;

const FOLD_OPTIONS = [
  { value: "fold", label: "Folded" },
  { value: "hang", label: "Hung" },
  { value: "roll", label: "Rolled" },
] as const;

const STAIN_OPTIONS = [
  { value: "gentle", label: "Gentle treatment" },
  { value: "standard", label: "Standard" },
  { value: "aggressive", label: "Aggressive" },
] as const;

type PreferenceOptions = {
  starch?: string;
  fragrance?: string;
  fold?: string;
  stain?: string;
};

type CarePreferenceFormProps = {
  locale: AppLocale;
  garmentTypeKey: string;
  garmentTypeLabel: string;
  garmentTypeId?: string;
  /** When true, the form is rendered as a stand-alone preferences
   *  card with its own save button. When false, the form is a
   *  read-only composer for the /book flow (parent harvests via
   *  `onChange`). Default: true. */
  standalone?: boolean;
  initialOptions?: PreferenceOptions;
  initialNotes?: string;
  onChange?: (options: PreferenceOptions, notes: string) => void;
};

export default function CarePreferenceForm({
  locale,
  garmentTypeKey,
  garmentTypeLabel,
  garmentTypeId,
  standalone = true,
  initialOptions,
  initialNotes,
  onChange,
}: CarePreferenceFormProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [options, setOptions] = useState<PreferenceOptions>(initialOptions ?? {});
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (onChange) onChange(options, notes);
  }, [options, notes, onChange]);

  function setField<K extends keyof PreferenceOptions>(
    key: K,
    value: PreferenceOptions[K],
  ) {
    setOptions((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save() {
    if (!standalone) return;
    setSaving(true);
    try {
      const res = await fetch("/api/care/preferences/garments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          garment_type_id: garmentTypeId,
          garment_type_key: garmentTypeKey,
          options,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        emitCareToast({
          tone: "error",
          title: t("Preference not saved"),
          description: data.error || "",
        });
        return;
      }
      setSaved(true);
      emitCareToast({
        tone: "success",
        title: t("Preference saved"),
        description: t("We'll apply this on your next booking."),
      });
    } catch {
      emitCareToast({
        tone: "error",
        title: t("Network error"),
        description: t("Please try again."),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label={`${t("Care preferences")} — ${garmentTypeLabel}`}
      className="care-card rounded-[32px] p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] care-accent-text">
            <Settings2 className="h-3.5 w-3.5" />
            {garmentTypeLabel}
          </div>
          <h3 className="mt-3 text-xl font-bold">{t("Care preferences")}</h3>
          <p className="care-muted mt-1 text-sm leading-6">
            {t("Saved preferences hydrate every future booking for this garment type.")}
          </p>
        </div>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Saved")}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FieldGroup
          label={t("Starch level")}
          value={options.starch ?? ""}
          choices={STARCH_OPTIONS}
          onSelect={(value) => setField("starch", value)}
          t={t}
        />
        <FieldGroup
          label={t("Fragrance")}
          value={options.fragrance ?? ""}
          choices={FRAGRANCE_OPTIONS}
          onSelect={(value) => setField("fragrance", value)}
          t={t}
        />
        <FieldGroup
          label={t("Fold style")}
          value={options.fold ?? ""}
          choices={FOLD_OPTIONS}
          onSelect={(value) => setField("fold", value)}
          t={t}
        />
        <FieldGroup
          label={t("Stain treatment")}
          value={options.stain ?? ""}
          choices={STAIN_OPTIONS}
          onSelect={(value) => setField("stain", value)}
          t={t}
        />
      </div>

      <label className="mt-4 grid gap-2 text-sm">
        <span className="font-semibold">{t("Notes")}</span>
        <textarea
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setSaved(false);
          }}
          rows={3}
          maxLength={2000}
          placeholder={t("Anything our team should know: do-not-iron, stitches that need care, ...")}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
        />
      </label>

      {standalone ? (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[#07111F] transition hover:bg-[color:var(--accent)]/95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <CareLoadingGlyph className="h-4 w-4" />
              {t("Saving...")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("Save preferences")}
            </>
          )}
        </button>
      ) : null}
    </section>
  );
}

function FieldGroup({
  label,
  value,
  choices,
  onSelect,
  t,
}: {
  label: string;
  value: string;
  choices: ReadonlyArray<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  t: (text: string) => string;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] care-muted">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => {
          const active = value === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onSelect(choice.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-[color:var(--accent)]/45 bg-[color:var(--accent)]/15 care-accent-text"
                  : "border-black/10 bg-white text-zinc-700 hover:border-[color:var(--accent)]/30 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/85"
              }`}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : null}
              {t(choice.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
