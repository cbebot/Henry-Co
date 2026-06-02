"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Trash2 } from "lucide-react";
import {
  Card,
  EditorHeader,
  Field,
  ImageUpload,
  PrimaryButton,
  SecondaryButton,
  Select,
  Spinner,
  StatusPill,
  SaveBar,
  TextArea,
  TextInput,
  Toggle,
  type ToastMessage,
} from "@/components/cms/editor-kit";
import { PERSON_KINDS } from "@/lib/cms/people-shared";
import {
  deletePerson,
  savePerson,
  type PersonInput,
} from "@/lib/cms/people-actions";

const KIND_OPTIONS: { value: string; label: string }[] = PERSON_KINDS.map((k) => ({
  value: k,
  label: k.charAt(0).toUpperCase() + k.slice(1),
}));

export function PersonEditor({ person }: { person: PersonInput }) {
  const router = useRouter();
  const isEditing = Boolean(person.id);

  const [form, setForm] = useState<PersonInput>(person);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(person));
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [toast, setToast] = useState<ToastMessage>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);

  function patch(p: Partial<PersonInput>) {
    setToast(null);
    setForm((f) => ({ ...f, ...p }));
  }

  async function onSave() {
    if (!form.full_name.trim()) {
      setToast({ ok: false, text: "Add a full name before saving." });
      return;
    }
    setBusy("save");
    const res = await savePerson(form);
    setBusy(null);
    if (!res.ok) {
      setToast({ ok: false, text: res.error });
      return;
    }
    if (!isEditing && res.id) {
      // Newly inserted — route to the canonical edit URL for this record.
      router.replace(`/people/${res.id}`);
      router.refresh();
      return;
    }
    setSavedSnapshot(JSON.stringify(form));
    setToast({ ok: true, text: "Saved — your public page is up to date." });
    router.refresh();
  }

  async function onDelete() {
    if (!person.id) return;
    const ok = window.confirm(
      `Delete ${form.full_name || "this person"}? This removes them from the public site and cannot be undone.`
    );
    if (!ok) return;
    setBusy("delete");
    const res = await deletePerson(person.id);
    setBusy(null);
    if (!res.ok) {
      setToast({ ok: false, text: res.error });
      return;
    }
    router.push("/people");
    router.refresh();
  }

  return (
    <div className="pb-28">
      <EditorHeader
        backHref="/people"
        backLabel="All people"
        title={isEditing ? form.full_name || "Edit person" : "New person"}
        status={
          <StatusPill tone={form.is_published ? "published" : "muted"}>
            {form.is_published ? "Published" : "Hidden"}
          </StatusPill>
        }
        description={
          isEditing
            ? "Edit this person's details. Changes go live as soon as you save."
            : "Add a new leadership or team member. They are created as soon as you save."
        }
      />

      <div className="mt-7 grid gap-5">
        <Card title="Identity" desc="Who they are and how their role reads on the page.">
          <Field label="Full name">
            <TextInput
              value={form.full_name}
              onChange={(e) => patch({ full_name: e.target.value })}
              placeholder="e.g. Henry Chukwuemeka"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role title" hint="Shown under the name">
              <TextInput
                value={form.role_title}
                onChange={(e) => patch({ role_title: e.target.value })}
                placeholder="Founder & CEO"
              />
            </Field>
            <Field label="Job title" hint="Optional internal title">
              <TextInput
                value={form.job_title}
                onChange={(e) => patch({ job_title: e.target.value })}
                placeholder="Chief Executive Officer"
              />
            </Field>
            <Field label="Department">
              <TextInput
                value={form.department}
                onChange={(e) => patch({ department: e.target.value })}
                placeholder="Executive"
              />
            </Field>
            <Field label="Kind" hint="How they are grouped">
              <Select value={form.kind} onChange={(e) => patch({ kind: e.target.value })}>
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Group key" hint="Section grouping, e.g. leadership">
            <TextInput
              value={form.group_key}
              onChange={(e) => patch({ group_key: e.target.value })}
              placeholder="leadership"
            />
          </Field>
        </Card>

        <Card title="Placement" desc="Where this person appears and in what order.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Page" hint="Public page slug, e.g. about">
              <TextInput
                value={form.page_slug}
                onChange={(e) => patch({ page_slug: e.target.value })}
                placeholder="about"
              />
            </Field>
            <Field label="Division" hint="Optional division slug">
              <TextInput
                value={form.division_slug}
                onChange={(e) => patch({ division_slug: e.target.value })}
                placeholder="studio"
              />
            </Field>
            <Field label="Sort order" hint="Lower shows first">
              <TextInput
                type="number"
                inputMode="numeric"
                value={String(form.sort_order)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  patch({ sort_order: Number.isFinite(n) ? n : 0 });
                }}
                placeholder="100"
              />
            </Field>
          </div>
        </Card>

        <Card title="Bio" desc="A short line for cards and a longer profile bio.">
          <Field label="Short bio" hint="One sentence">
            <TextArea
              value={form.short_bio}
              onChange={(e) => patch({ short_bio: e.target.value })}
              placeholder="A concise summary shown on compact cards…"
            />
          </Field>
          <Field label="Long bio">
            <TextArea
              value={form.long_bio}
              onChange={(e) => patch({ long_bio: e.target.value })}
              placeholder="The full profile bio shown on the about page…"
            />
          </Field>
        </Card>

        <Card title="Photo" desc="A headshot or portrait — upload or paste a link.">
          <ImageUpload
            label="Photo"
            value={form.photo_url}
            onChange={(url) => patch({ photo_url: url })}
            folder="henryco/people"
            hint="A square headshot works best"
          />
        </Card>

        <Card title="Contact" desc="Optional ways to reach this person.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="name@henrycogroup.com"
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="+234…"
              />
            </Field>
          </div>
          <Field label="LinkedIn URL">
            <TextInput
              value={form.linkedin_url}
              onChange={(e) => patch({ linkedin_url: e.target.value })}
              placeholder="https://www.linkedin.com/in/…"
            />
          </Field>
        </Card>

        <Card title="Flags" desc="Visibility and placement toggles.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              checked={form.is_owner}
              onChange={(next) => patch({ is_owner: next })}
              label="Owner"
              description="Marks this person as a company owner."
            />
            <Toggle
              checked={form.is_manager}
              onChange={(next) => patch({ is_manager: next })}
              label="Manager"
              description="Marks this person as a manager."
            />
            <Toggle
              checked={form.is_featured}
              onChange={(next) => patch({ is_featured: next })}
              label="Featured"
              description="Highlight this person on the page."
            />
            <Toggle
              checked={form.is_published}
              onChange={(next) => patch({ is_published: next })}
              label="Published"
              description="Show this person on the public site."
            />
          </div>
        </Card>
      </div>

      <SaveBar dirty={dirty} message={toast}>
        {isEditing ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy !== null}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--hc-ink-muted)] transition-colors hover:text-rose-600 disabled:opacity-60"
          >
            {busy === "delete" ? <Spinner /> : <Trash2 className="h-4 w-4" aria-hidden />}
            Delete
          </button>
        ) : (
          <SecondaryButton onClick={() => router.push("/people")} disabled={busy !== null}>
            Cancel
          </SecondaryButton>
        )}
        <PrimaryButton onClick={onSave} disabled={busy !== null || (isEditing && !dirty)}>
          {busy === "save" ? <Spinner /> : isEditing ? <Save className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {isEditing ? "Save changes" : "Create person"}
        </PrimaryButton>
      </SaveBar>
    </div>
  );
}
