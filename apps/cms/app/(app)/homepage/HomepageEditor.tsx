"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import {
  Card,
  DangerIconButton,
  EditorHeader,
  Field,
  GhostButton,
  IconButton,
  ImageUpload,
  PrimaryButton,
  SaveBar,
  Spinner,
  StatusPill,
  TextArea,
  TextInput,
  Toggle,
  type ToastMessage,
} from "@/components/cms/editor-kit";
import {
  type HomepageContent,
  type HomepageFaq,
  type HomepageItem,
} from "@/lib/cms/homepage";
import { saveHomepage } from "@/lib/cms/homepage-actions";

const PUBLIC_HOME = "https://henrycogroup.com";

let _uid = 0;
function uid(prefix: string): string {
  _uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${_uid}`;
}

/** Keys of HomepageContent whose value is a HomepageItem[] (point/card lists). */
type ItemListKey = "operating_points" | "value_cards" | "ecosystem_points";

function newItem(): HomepageItem {
  return { id: uid("item"), eyebrow: "", title: "", body: "" };
}
function newFaq(): HomepageFaq {
  return { id: uid("faq"), q: "", a: "" };
}

export function HomepageEditor({
  id: initialId,
  content: initial,
  updatedAt,
}: {
  id: string | null;
  content: HomepageContent;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(initialId);
  const [content, setContent] = useState<HomepageContent>(initial);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);

  const dirty = useMemo(
    () => JSON.stringify(content) !== savedSnapshot,
    [content, savedSnapshot]
  );

  function patch(p: Partial<HomepageContent>) {
    setToast(null);
    setContent((c) => ({ ...c, ...p }));
  }

  // --- Item-list helpers (operating_points / value_cards / ecosystem_points) ---
  function setItem(key: ItemListKey, itemId: string, p: Partial<HomepageItem>) {
    setContent((c) => ({
      ...c,
      [key]: c[key].map((it) => (it.id === itemId ? { ...it, ...p } : it)),
    }));
  }
  function addItem(key: ItemListKey) {
    setToast(null);
    setContent((c) => ({ ...c, [key]: [...c[key], newItem()] }));
  }
  function removeItem(key: ItemListKey, itemId: string) {
    setContent((c) => ({ ...c, [key]: c[key].filter((it) => it.id !== itemId) }));
  }
  function moveItem(key: ItemListKey, itemId: string, dir: -1 | 1) {
    setContent((c) => {
      const list = c[key];
      const i = list.findIndex((it) => it.id === itemId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return c;
      const next = list.slice();
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return { ...c, [key]: next };
    });
  }

  // --- FAQ helpers ---
  function setFaq(faqId: string, p: Partial<HomepageFaq>) {
    setContent((c) => ({
      ...c,
      faqs: c.faqs.map((f) => (f.id === faqId ? { ...f, ...p } : f)),
    }));
  }
  function addFaq() {
    setToast(null);
    setContent((c) => ({ ...c, faqs: [...c.faqs, newFaq()] }));
  }
  function removeFaq(faqId: string) {
    setContent((c) => ({ ...c, faqs: c.faqs.filter((f) => f.id !== faqId) }));
  }
  function moveFaq(faqId: string, dir: -1 | 1) {
    setContent((c) => {
      const i = c.faqs.findIndex((f) => f.id === faqId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.faqs.length) return c;
      const next = c.faqs.slice();
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return { ...c, faqs: next };
    });
  }

  async function onSave() {
    setBusy(true);
    const res = await saveHomepage(id, content);
    setBusy(false);
    if (res.ok) {
      setId(res.id);
      setSavedSnapshot(JSON.stringify(content));
      setToast({ ok: true, text: "Saved — the live homepage now reflects these changes." });
      router.refresh();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  return (
    <div className="pb-28">
      <EditorHeader
        backHref="/dashboard"
        backLabel="Overview"
        title="Homepage"
        status={
          content.is_published ? (
            <StatusPill tone="published">Published</StatusPill>
          ) : (
            <StatusPill tone="muted">Hidden</StatusPill>
          )
        }
        actions={
          <a
            href={PUBLIC_HOME}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hc-accent-text)] hover:underline"
          >
            View live <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        }
        description={
          <>
            Edit the editorial company homepage. Saving writes directly to the live record — there&apos;s
            no separate draft for this surface, so changes appear on the public site immediately.
          </>
        }
      />

      <div className="mt-7 grid gap-5">
        {/* Hero */}
        <Card title="Hero" desc="The top of the homepage — the first thing visitors read.">
          <Field label="Badge" hint="Small label above the title">
            <TextInput
              value={content.hero_badge}
              onChange={(e) => patch({ hero_badge: e.target.value })}
              placeholder="e.g. Group Platform"
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={content.hero_title}
              onChange={(e) => patch({ hero_title: e.target.value })}
              placeholder="The operating gateway for Henry & Co."
            />
          </Field>
          <Field label="Highlight" hint="Accent line shown with the title">
            <TextInput
              value={content.hero_highlight}
              onChange={(e) => patch({ hero_highlight: e.target.value })}
              placeholder="Premium divisions. One standard."
            />
          </Field>
          <Field label="Description" hint="Lead paragraph">
            <TextArea
              value={content.hero_description}
              onChange={(e) => patch({ hero_description: e.target.value })}
              placeholder="A short, confident paragraph introducing the company…"
            />
          </Field>
          <ImageUpload
            label="Hero image"
            value={content.hero_image_url}
            onChange={(url) => patch({ hero_image_url: url })}
            folder="henryco/homepage"
          />
        </Card>

        {/* Call to action */}
        <Card title="Call to action" desc="The two buttons shown in the hero.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button label">
              <TextInput
                value={content.primary_cta_label}
                onChange={(e) => patch({ primary_cta_label: e.target.value })}
                placeholder="Explore divisions"
              />
            </Field>
            <Field label="Primary button link">
              <TextInput
                value={content.primary_cta_href}
                onChange={(e) => patch({ primary_cta_href: e.target.value })}
                placeholder="/#divisions"
              />
            </Field>
            <Field label="Secondary button label">
              <TextInput
                value={content.secondary_cta_label}
                onChange={(e) => patch({ secondary_cta_label: e.target.value })}
                placeholder="Contact the company"
              />
            </Field>
            <Field label="Secondary button link">
              <TextInput
                value={content.secondary_cta_href}
                onChange={(e) => patch({ secondary_cta_href: e.target.value })}
                placeholder="/contact"
              />
            </Field>
          </div>
        </Card>

        {/* Operating model */}
        <Card
          title="Operating model"
          desc="The 'built for structured growth' section and its supporting points."
        >
          <Field label="Section title">
            <TextInput
              value={content.operating_title}
              onChange={(e) => patch({ operating_title: e.target.value })}
              placeholder="Built for structured growth"
            />
          </Field>
          <Field label="Section body">
            <TextArea
              value={content.operating_body}
              onChange={(e) => patch({ operating_body: e.target.value })}
              placeholder="A paragraph describing the operating model…"
            />
          </Field>
          <ItemListEditor
            legend="Operating points"
            singular="point"
            items={content.operating_points}
            withEyebrow={false}
            onChange={(itemId, p) => setItem("operating_points", itemId, p)}
            onAdd={() => addItem("operating_points")}
            onRemove={(itemId) => removeItem("operating_points", itemId)}
            onMove={(itemId, dir) => moveItem("operating_points", itemId, dir)}
          />
        </Card>

        {/* Value cards */}
        <Card
          title="Value cards"
          desc="The three-up value grid. Each card may carry a small eyebrow label."
        >
          <ItemListEditor
            legend="Value cards"
            singular="card"
            items={content.value_cards}
            withEyebrow
            onChange={(itemId, p) => setItem("value_cards", itemId, p)}
            onAdd={() => addItem("value_cards")}
            onRemove={(itemId) => removeItem("value_cards", itemId)}
            onMove={(itemId, dir) => moveItem("value_cards", itemId, dir)}
          />
        </Card>

        {/* Featured */}
        <Card title="Featured divisions" desc="Intro copy above the featured destinations.">
          <Field label="Title">
            <TextInput
              value={content.featured_title}
              onChange={(e) => patch({ featured_title: e.target.value })}
              placeholder="Featured divisions"
            />
          </Field>
          <Field label="Body">
            <TextArea
              value={content.featured_body}
              onChange={(e) => patch({ featured_body: e.target.value })}
              placeholder="A short description of the featured divisions…"
            />
          </Field>
        </Card>

        {/* Directory */}
        <Card title="Division directory" desc="Intro copy above the full division directory.">
          <Field label="Title">
            <TextInput
              value={content.directory_title}
              onChange={(e) => patch({ directory_title: e.target.value })}
              placeholder="Division directory"
            />
          </Field>
          <Field label="Body">
            <TextArea
              value={content.directory_body}
              onChange={(e) => patch({ directory_body: e.target.value })}
              placeholder="A short description of the directory…"
            />
          </Field>
        </Card>

        {/* Ecosystem */}
        <Card
          title="Why the hub matters"
          desc="The ecosystem rationale section and its supporting points."
        >
          <Field label="Section title">
            <TextInput
              value={content.ecosystem_title}
              onChange={(e) => patch({ ecosystem_title: e.target.value })}
              placeholder="Why the hub matters"
            />
          </Field>
          <Field label="Section body">
            <TextArea
              value={content.ecosystem_body}
              onChange={(e) => patch({ ecosystem_body: e.target.value })}
              placeholder="A paragraph on the strategic value of the hub…"
            />
          </Field>
          <ItemListEditor
            legend="Ecosystem points"
            singular="point"
            items={content.ecosystem_points}
            withEyebrow={false}
            onChange={(itemId, p) => setItem("ecosystem_points", itemId, p)}
            onAdd={() => addItem("ecosystem_points")}
            onRemove={(itemId) => removeItem("ecosystem_points", itemId)}
            onMove={(itemId, dir) => moveItem("ecosystem_points", itemId, dir)}
          />
        </Card>

        {/* Owner / leadership */}
        <Card title="Leadership" desc="The owner / leadership statement.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Section badge">
              <TextInput
                value={content.owner_section_badge}
                onChange={(e) => patch({ owner_section_badge: e.target.value })}
                placeholder="Leadership"
              />
            </Field>
            <Field label="Section title">
              <TextInput
                value={content.owner_section_title}
                onChange={(e) => patch({ owner_section_title: e.target.value })}
                placeholder="Leadership and ownership"
              />
            </Field>
            <Field label="Owner name">
              <TextInput
                value={content.owner_name}
                onChange={(e) => patch({ owner_name: e.target.value })}
                placeholder="Company Owner"
              />
            </Field>
            <Field label="Owner role">
              <TextInput
                value={content.owner_role}
                onChange={(e) => patch({ owner_role: e.target.value })}
                placeholder="Founder / Group Principal"
              />
            </Field>
          </div>
          <Field label="Owner message">
            <TextArea
              value={content.owner_message}
              onChange={(e) => patch({ owner_message: e.target.value })}
              placeholder="A leadership statement about the company's direction…"
            />
          </Field>
          <Field label="Owner signature" hint="Optional signature line">
            <TextInput
              value={content.owner_signature}
              onChange={(e) => patch({ owner_signature: e.target.value })}
              placeholder="e.g. Henry C."
            />
          </Field>
          <ImageUpload
            label="Owner portrait"
            value={content.owner_image_url}
            onChange={(url) => patch({ owner_image_url: url })}
            folder="henryco/homepage"
            hint="Optional portrait"
          />
        </Card>

        {/* FAQ */}
        <Card title="FAQ" desc="Intro copy plus the question / answer list.">
          <Field label="Section title">
            <TextInput
              value={content.faq_title}
              onChange={(e) => patch({ faq_title: e.target.value })}
              placeholder="Frequently asked questions"
            />
          </Field>
          <Field label="Section body">
            <TextArea
              value={content.faq_body}
              onChange={(e) => patch({ faq_body: e.target.value })}
              placeholder="A short intro to the FAQ…"
            />
          </Field>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--hc-ink-muted)]">
              Questions
            </legend>
            {content.faqs.length === 0 ? (
              <p className="text-sm text-[var(--hc-ink-muted)]">
                No questions yet — add the first one below.
              </p>
            ) : (
              <div className="space-y-4">
                {content.faqs.map((f, i) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] p-4"
                  >
                    <RowHeader
                      label={`Question ${i + 1}`}
                      index={i}
                      count={content.faqs.length}
                      onUp={() => moveFaq(f.id, -1)}
                      onDown={() => moveFaq(f.id, 1)}
                      onRemove={() => removeFaq(f.id)}
                      removeLabel="Remove question"
                    />
                    <div className="mt-3 space-y-3">
                      <Field label="Question">
                        <TextInput
                          value={f.q}
                          onChange={(e) => setFaq(f.id, { q: e.target.value })}
                          placeholder="Can each division operate independently?"
                        />
                      </Field>
                      <Field label="Answer">
                        <TextArea
                          value={f.a}
                          onChange={(e) => setFaq(f.id, { a: e.target.value })}
                          placeholder="Yes. Each division can maintain its own services…"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <GhostButton type="button" onClick={addFaq}>
              <Plus className="h-4 w-4" aria-hidden /> Add question
            </GhostButton>
          </fieldset>
        </Card>

        {/* Footer */}
        <Card title="Footer" desc="The closing company blurb in the homepage footer.">
          <Field label="Footer blurb">
            <TextArea
              value={content.footer_blurb}
              onChange={(e) => patch({ footer_blurb: e.target.value })}
              placeholder="A premium multi-division company ecosystem…"
            />
          </Field>
        </Card>

        {/* Visibility */}
        <Card title="Visibility" desc="Controls the published flag on the homepage record.">
          <Toggle
            checked={content.is_published}
            onChange={(next) => patch({ is_published: next })}
            label="Published"
            description="When on, the homepage record is marked published."
          />
        </Card>
      </div>

      <SaveBar dirty={dirty} message={toast}>
        {updatedAt && !dirty ? (
          <span className="hidden text-xs text-[var(--hc-ink-muted)] sm:inline">
            Last saved {new Date(updatedAt).toLocaleString()}
          </span>
        ) : null}
        <PrimaryButton onClick={onSave} disabled={busy || !dirty}>
          {busy ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
          Save changes
        </PrimaryButton>
      </SaveBar>
    </div>
  );
}

/** Reusable header row (move up/down + remove) for a repeatable item. */
function RowHeader({
  label,
  index,
  count,
  onUp,
  onDown,
  onRemove,
  removeLabel,
}: {
  label: string;
  index: number;
  count: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--hc-ink-muted)]">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <IconButton onClick={onUp} disabled={index === 0} aria-label="Move up">
          <ArrowUp className="h-4 w-4" aria-hidden />
        </IconButton>
        <IconButton onClick={onDown} disabled={index === count - 1} aria-label="Move down">
          <ArrowDown className="h-4 w-4" aria-hidden />
        </IconButton>
        <DangerIconButton onClick={onRemove} aria-label={removeLabel}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </DangerIconButton>
      </div>
    </div>
  );
}

/** Editor for a HomepageItem[] list (operating_points, value_cards, ecosystem_points). */
function ItemListEditor({
  legend,
  singular,
  items,
  withEyebrow,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: {
  legend: string;
  singular: string;
  items: HomepageItem[];
  withEyebrow: boolean;
  onChange: (id: string, patch: Partial<HomepageItem>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-[var(--hc-ink-muted)]">
        {legend}
      </legend>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--hc-ink-muted)]">
          No {singular}s yet — add the first one below.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] p-4"
            >
              <RowHeader
                label={`${singular.charAt(0).toUpperCase() + singular.slice(1)} ${i + 1}`}
                index={i}
                count={items.length}
                onUp={() => onMove(item.id, -1)}
                onDown={() => onMove(item.id, 1)}
                onRemove={() => onRemove(item.id)}
                removeLabel={`Remove ${singular}`}
              />
              <div className="mt-3 space-y-3">
                {withEyebrow ? (
                  <Field label="Eyebrow" hint="Small label above the title">
                    <TextInput
                      value={item.eyebrow}
                      onChange={(e) => onChange(item.id, { eyebrow: e.target.value })}
                      placeholder="e.g. Discovery"
                    />
                  </Field>
                ) : null}
                <Field label="Title">
                  <TextInput
                    value={item.title}
                    onChange={(e) => onChange(item.id, { title: e.target.value })}
                    placeholder="A short heading"
                  />
                </Field>
                <Field label="Body">
                  <TextArea
                    value={item.body}
                    onChange={(e) => onChange(item.id, { body: e.target.value })}
                    placeholder="A supporting sentence or two…"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
      <GhostButton type="button" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden /> Add {singular}
      </GhostButton>
    </fieldset>
  );
}
