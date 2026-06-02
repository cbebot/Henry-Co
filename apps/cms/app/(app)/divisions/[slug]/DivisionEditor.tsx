"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save } from "lucide-react";
import type { Division } from "@/lib/cms/divisions";
import { saveDivision, type DivisionInput } from "@/lib/cms/divisions-actions";
import {
  Card,
  EditorHeader,
  Field,
  ImageUpload,
  PrimaryButton,
  SaveBar,
  Select,
  Spinner,
  StatusPill,
  TextArea,
  TextInput,
  TextList,
  Toggle,
  type ToastMessage,
} from "@/components/cms/editor-kit";

/** Status options the owner can pick from (existing data uses active/coming_soon). */
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "active", label: "Active" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "beta", label: "Beta" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

function toInput(d: Division): DivisionInput {
  return {
    name: d.name,
    tagline: d.tagline,
    category: d.category,
    status: d.status,
    description: d.description,
    short_description: d.short_description,
    primary_url: d.primary_url,
    domain: d.domain,
    subdomain: d.subdomain,
    accent: d.accent,
    logo_url: d.logo_url,
    cover_url: d.cover_url,
    sort_order: d.sort_order,
    is_published: d.is_published,
    is_featured: d.is_featured,
    lead_name: d.lead_name,
    lead_title: d.lead_title,
    lead_avatar_url: d.lead_avatar_url,
    highlights: d.highlights,
    who_its_for: d.who_its_for,
    how_it_works: d.how_it_works,
    trust: d.trust,
    categories: d.categories,
  };
}

export function DivisionEditor({ division }: { division: Division }) {
  const router = useRouter();
  const initial = useMemo(() => toInput(division), [division]);
  const [form, setForm] = useState<DivisionInput>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);
  const liveUrl = `https://${division.slug}.henrycogroup.com`;

  function patch(p: Partial<DivisionInput>) {
    setToast(null);
    setForm((f) => ({ ...f, ...p }));
  }

  async function onSave() {
    setBusy(true);
    const res = await saveDivision(division.slug, form);
    setBusy(false);
    if (res.ok) {
      setSavedSnapshot(JSON.stringify(form));
      setToast({ ok: true, text: "Saved — the live record is updated." });
      router.refresh();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  return (
    <div className="pb-28">
      <EditorHeader
        backHref="/divisions"
        backLabel="All divisions"
        title={form.name || division.slug}
        status={
          <StatusPill tone={form.is_published ? "published" : "draft"}>
            {form.is_published ? "Published" : "Hidden"}
          </StatusPill>
        }
        actions={
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hc-accent-text)] hover:underline"
          >
            View live <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        }
        description={
          <>
            Editing <span className="font-medium text-[var(--hc-ink)]">/{division.slug}</span>.
            Changes save straight to the live division record.
          </>
        }
      />

      <div className="mt-7 grid gap-5">
        <Card title="Basics" desc="Name, positioning, and the short summary used across the site.">
          <Field label="Slug" hint="Route key — read only">
            <TextInput value={division.slug} readOnly disabled className="opacity-70" />
          </Field>
          <Field label="Name">
            <TextInput
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Henry & Co. …"
            />
          </Field>
          <Field label="Tagline" hint="One memorable line">
            <TextInput
              value={form.tagline}
              onChange={(e) => patch({ tagline: e.target.value })}
              placeholder="A short, evocative promise"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <TextInput
                value={form.category}
                onChange={(e) => patch({ category: e.target.value })}
                placeholder="e.g. Services"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => patch({ status: e.target.value })}>
                {STATUS_OPTIONS.some((o) => o.value === form.status) ? null : (
                  <option value={form.status}>{form.status}</option>
                )}
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Short description" hint="One or two sentences for cards and previews">
            <TextArea
              value={form.short_description}
              onChange={(e) => patch({ short_description: e.target.value })}
              placeholder="A concise summary of what this division does."
            />
          </Field>
          <Field label="Description" hint="The fuller story shown on the division page">
            <TextArea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              className="min-h-[160px]"
              placeholder="The detailed description…"
            />
          </Field>
        </Card>

        <Card title="Links" desc="Where this division lives on the web.">
          <Field label="Primary URL" hint="The main entry point">
            <TextInput
              value={form.primary_url}
              onChange={(e) => patch({ primary_url: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Domain">
              <TextInput
                value={form.domain}
                onChange={(e) => patch({ domain: e.target.value })}
                placeholder="example.com"
              />
            </Field>
            <Field label="Subdomain" hint="On henrycogroup.com">
              <TextInput
                value={form.subdomain}
                onChange={(e) => patch({ subdomain: e.target.value })}
                placeholder={division.slug}
              />
            </Field>
          </div>
        </Card>

        <Card title="Brand & media" desc="Accent colour, logo, cover image, and list ordering.">
          <Field label="Accent" hint="Hex colour, e.g. #6B7CFF">
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 shrink-0 rounded-xl border border-[var(--hc-line)]"
                style={{ backgroundColor: form.accent || "transparent" }}
                aria-hidden
              />
              <div className="flex-1">
                <TextInput
                  value={form.accent}
                  onChange={(e) => patch({ accent: e.target.value })}
                  placeholder="#6B7CFF"
                />
              </div>
            </div>
          </Field>
          <ImageUpload
            label="Logo"
            value={form.logo_url}
            onChange={(url) => patch({ logo_url: url })}
            folder="henryco/divisions"
          />
          <ImageUpload
            label="Cover image"
            value={form.cover_url}
            onChange={(url) => patch({ cover_url: url })}
            folder="henryco/divisions"
          />
          <Field label="Sort order" hint="Lower numbers appear first">
            <TextInput
              type="number"
              inputMode="numeric"
              value={String(form.sort_order)}
              onChange={(e) => {
                const n = Number(e.target.value);
                patch({ sort_order: Number.isFinite(n) ? n : form.sort_order });
              }}
              placeholder="100"
              className="max-w-[160px]"
            />
          </Field>
        </Card>

        <Card title="Content lists" desc="The structured copy blocks shown on the division page.">
          <Field label="Highlights" hint="Key points">
            <TextList
              values={form.highlights}
              onChange={(highlights) => patch({ highlights })}
              placeholder="A standout capability"
              addLabel="Add highlight"
            />
          </Field>
          <Field label="Who it's for">
            <TextList
              values={form.who_its_for}
              onChange={(who_its_for) => patch({ who_its_for })}
              placeholder="An audience this serves"
              addLabel="Add audience"
            />
          </Field>
          <Field label="How it works">
            <TextList
              values={form.how_it_works}
              onChange={(how_it_works) => patch({ how_it_works })}
              placeholder="A step in the process"
              addLabel="Add step"
            />
          </Field>
          <Field label="Trust" hint="Proof points and reassurances">
            <TextList
              values={form.trust}
              onChange={(trust) => patch({ trust })}
              placeholder="A trust signal"
              addLabel="Add trust point"
            />
          </Field>
          <Field label="Categories" hint="Tags this division belongs to">
            <TextList
              values={form.categories}
              onChange={(categories) => patch({ categories })}
              placeholder="A category tag"
              addLabel="Add category"
            />
          </Field>
        </Card>

        <Card title="Division lead" desc="The person who fronts this division.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lead name">
              <TextInput
                value={form.lead_name}
                onChange={(e) => patch({ lead_name: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label="Lead title">
              <TextInput
                value={form.lead_title}
                onChange={(e) => patch({ lead_title: e.target.value })}
                placeholder="e.g. Division Lead"
              />
            </Field>
          </div>
          <ImageUpload
            label="Lead avatar"
            value={form.lead_avatar_url}
            onChange={(url) => patch({ lead_avatar_url: url })}
            folder="henryco/divisions"
          />
        </Card>

        <Card title="Visibility" desc="Control where this division shows up.">
          <Toggle
            checked={form.is_published}
            onChange={(is_published) => patch({ is_published })}
            label="Published"
            description="When on, this division is visible on the public site."
          />
          <Toggle
            checked={form.is_featured}
            onChange={(is_featured) => patch({ is_featured })}
            label="Featured"
            description="Highlight this division in featured placements."
          />
        </Card>
      </div>

      <SaveBar dirty={dirty} message={toast}>
        <PrimaryButton onClick={onSave} disabled={busy || !dirty}>
          {busy ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
          Save changes
        </PrimaryButton>
      </SaveBar>
    </div>
  );
}
