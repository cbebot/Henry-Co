"use client";

import {
  useMemo,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import type { CmsPageContent, PageSection, PageStat } from "@/lib/cms/pages";
import { discardDraft, publishPage, saveDraft } from "@/lib/cms/pages-actions";
import { ImageUpload } from "@/components/cms/editor-kit";

const PUBLIC_BASE = "https://henrycogroup.com";

const ICON_BTN =
  "rounded-lg p-1.5 text-[var(--hc-ink-muted)] transition-colors hover:bg-[var(--hc-accent-soft)] hover:text-[var(--hc-ink)] disabled:opacity-40 disabled:hover:bg-transparent";
const ICON_BTN_DANGER =
  "rounded-lg p-1.5 text-[var(--hc-ink-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-600";
const INPUT =
  "w-full rounded-xl border border-[var(--hc-line)] bg-[var(--hc-surface)] px-3.5 py-2.5 text-sm text-[var(--hc-ink)] outline-none transition-all placeholder:text-[var(--hc-ink-muted)] focus:border-[var(--hc-accent)] focus:ring-2 focus:ring-[var(--hc-accent-soft)]";

let _uid = 0;
function uid(prefix: string): string {
  _uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${_uid}`;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--hc-ink)]">{label}</span>
        {hint ? <span className="text-xs text-[var(--hc-ink-muted)]">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={INPUT} />;
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${INPUT} min-h-[104px] resize-y leading-6`} />;
}

function Card({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--hc-accent-text)]">
        {title}
      </h2>
      {desc ? <p className="mt-1 text-sm text-[var(--hc-ink-muted)]">{desc}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function PageEditor({
  slug,
  label,
  live,
  draft,
  version: initialVersion,
  hasDraft: initialHasDraft,
}: {
  slug: string;
  label: string;
  live: CmsPageContent;
  draft: CmsPageContent | null;
  version: number;
  hasDraft: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState<CmsPageContent>(draft ?? live);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(draft ?? live));
  const [version, setVersion] = useState(initialVersion);
  const [hasDraft, setHasDraft] = useState(initialHasDraft);
  const [busy, setBusy] = useState<"save" | "publish" | "discard" | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = useMemo(() => JSON.stringify(content) !== savedSnapshot, [content, savedSnapshot]);

  function patch(p: Partial<CmsPageContent>) {
    setToast(null);
    setContent((c) => ({ ...c, ...p }));
  }

  function setSection(id: string, p: Partial<PageSection>) {
    setContent((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === id ? { ...s, ...p } : s)),
    }));
  }
  function addSection() {
    setContent((c) => ({
      ...c,
      sections: [
        ...c.sections,
        { id: uid("section"), eyebrow: "", title: "", body: "", layout: "default" },
      ],
    }));
  }
  function removeSection(id: string) {
    setContent((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== id) }));
  }
  function moveSection(id: string, dir: -1 | 1) {
    setContent((c) => {
      const i = c.sections.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= c.sections.length) return c;
      const next = c.sections.slice();
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return { ...c, sections: next };
    });
  }

  function setStat(id: string, p: Partial<PageStat>) {
    setContent((c) => ({ ...c, stats: c.stats.map((s) => (s.id === id ? { ...s, ...p } : s)) }));
  }
  function addStat() {
    setContent((c) => ({ ...c, stats: [...c.stats, { id: uid("stat"), label: "", value: "" }] }));
  }
  function removeStat(id: string) {
    setContent((c) => ({ ...c, stats: c.stats.filter((s) => s.id !== id) }));
  }

  async function onSaveDraft() {
    setBusy("save");
    const res = await saveDraft(slug, content);
    setBusy(null);
    if (res.ok) {
      setSavedSnapshot(JSON.stringify(content));
      setHasDraft(true);
      setToast({ ok: true, text: "Draft saved — your live page is untouched." });
      router.refresh();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  async function onPublish() {
    setBusy("publish");
    const res = await publishPage(slug, content, version);
    setBusy(null);
    if (res.ok) {
      setSavedSnapshot(JSON.stringify(content));
      setVersion(res.version ?? version + 1);
      setHasDraft(false);
      setToast({ ok: true, text: "Published — your live site now shows these changes." });
      router.refresh();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  async function onDiscard() {
    setBusy("discard");
    const res = await discardDraft(slug);
    setBusy(null);
    if (res.ok) {
      setContent(live);
      setSavedSnapshot(JSON.stringify(live));
      setHasDraft(false);
      setToast({ ok: true, text: "Draft discarded — back to the published version." });
      router.refresh();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  const statusPill = hasDraft
    ? { text: "Unpublished draft", cls: "bg-amber-100 text-amber-700" }
    : { text: "Published", cls: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/pages"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--hc-ink-muted)] transition-colors hover:text-[var(--hc-ink)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> All pages
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--hc-ink)]">{label}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPill.cls}`}>
              {statusPill.text}
            </span>
          </div>
          <a
            href={slug === "home" ? PUBLIC_BASE : `${PUBLIC_BASE}/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hc-accent-text)] hover:underline"
          >
            View live <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-[var(--hc-ink-muted)]">
          Edits are kept in a private draft. Your public page only changes when you press{" "}
          <span className="font-medium text-[var(--hc-ink)]">Publish</span>.
        </p>
      </div>

      {/* Editor body */}
      <div className="mt-7 grid gap-5">
        <Card title="Hero" desc="The top of the page — the first thing visitors read.">
          <Field label="Eyebrow" hint="Small label above the title">
            <TextInput
              value={content.hero_badge}
              onChange={(e) => patch({ hero_badge: e.target.value })}
              placeholder="e.g. About Henry & Co."
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={content.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Page title"
            />
          </Field>
          <Field label="Subtitle">
            <TextInput
              value={content.subtitle}
              onChange={(e) => patch({ subtitle: e.target.value })}
              placeholder="Optional supporting line"
            />
          </Field>
          <Field label="Intro" hint="Lead paragraph">
            <TextArea
              value={content.intro}
              onChange={(e) => patch({ intro: e.target.value })}
              placeholder="A short, welcoming paragraph…"
            />
          </Field>
          <ImageUpload
            label="Hero image"
            value={content.hero_image_url}
            onChange={(url) => patch({ hero_image_url: url })}
            folder="henryco/pages"
          />
        </Card>

        <Card title="Call to action" desc="Buttons shown in the hero.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button label">
              <TextInput
                value={content.primary_cta_label}
                onChange={(e) => patch({ primary_cta_label: e.target.value })}
                placeholder="Get started"
              />
            </Field>
            <Field label="Primary button link">
              <TextInput
                value={content.primary_cta_href}
                onChange={(e) => patch({ primary_cta_href: e.target.value })}
                placeholder="/contact"
              />
            </Field>
            <Field label="Secondary button label">
              <TextInput
                value={content.secondary_cta_label}
                onChange={(e) => patch({ secondary_cta_label: e.target.value })}
                placeholder="Learn more"
              />
            </Field>
            <Field label="Secondary button link">
              <TextInput
                value={content.secondary_cta_href}
                onChange={(e) => patch({ secondary_cta_href: e.target.value })}
                placeholder="/about"
              />
            </Field>
          </div>
        </Card>

        <Card title="Content sections" desc="The body of the page, in order.">
          {content.sections.length === 0 ? (
            <p className="text-sm text-[var(--hc-ink-muted)]">No sections yet — add the first one below.</p>
          ) : (
            <div className="space-y-4">
              {content.sections.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--hc-ink-muted)]">
                      Section {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(s.id, -1)}
                        disabled={i === 0}
                        className={ICON_BTN}
                        aria-label="Move section up"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(s.id, 1)}
                        disabled={i === content.sections.length - 1}
                        className={ICON_BTN}
                        aria-label="Move section down"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(s.id)}
                        className={ICON_BTN_DANGER}
                        aria-label="Remove section"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    <Field label="Eyebrow">
                      <TextInput
                        value={s.eyebrow}
                        onChange={(e) => setSection(s.id, { eyebrow: e.target.value })}
                      />
                    </Field>
                    <Field label="Heading">
                      <TextInput
                        value={s.title}
                        onChange={(e) => setSection(s.id, { title: e.target.value })}
                      />
                    </Field>
                    <Field label="Body">
                      <TextArea
                        value={s.body}
                        onChange={(e) => setSection(s.id, { body: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--hc-line)] px-3.5 py-2.5 text-sm font-medium text-[var(--hc-ink-soft)] transition-colors hover:border-[var(--hc-accent)] hover:text-[var(--hc-ink)]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add section
          </button>
        </Card>

        <Card title="Stats" desc="Optional headline numbers shown on the page.">
          {content.stats.length > 0 ? (
            <div className="space-y-3">
              {content.stats.map((s) => (
                <div key={s.id} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Field label="Value">
                      <TextInput
                        value={s.value}
                        onChange={(e) => setStat(s.id, { value: e.target.value })}
                        placeholder="120+"
                      />
                    </Field>
                  </div>
                  <div className="flex-[2]">
                    <Field label="Label">
                      <TextInput
                        value={s.label}
                        onChange={(e) => setStat(s.id, { label: e.target.value })}
                        placeholder="Projects delivered"
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStat(s.id)}
                    className={`${ICON_BTN_DANGER} mb-1.5`}
                    aria-label="Remove stat"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={addStat}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--hc-line)] px-3.5 py-2.5 text-sm font-medium text-[var(--hc-ink-soft)] transition-colors hover:border-[var(--hc-accent)] hover:text-[var(--hc-ink)]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add stat
          </button>
        </Card>

        <Card title="SEO" desc="How this page appears in search results and shared links.">
          <Field label="SEO title">
            <TextInput
              value={content.seo_title}
              onChange={(e) => patch({ seo_title: e.target.value })}
              placeholder="Falls back to the page title"
            />
          </Field>
          <Field label="SEO description">
            <TextArea
              value={content.seo_description}
              onChange={(e) => patch({ seo_description: e.target.value })}
              placeholder="A one- or two-sentence summary for search engines"
            />
          </Field>
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--hc-line)] bg-[var(--hc-surface)] lg:left-[var(--owner-sidebar-width)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 lg:px-10">
          <span className="flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
              aria-hidden
            />
            <span className="text-[var(--hc-ink-muted)]">
              {dirty ? "Unsaved changes" : hasDraft ? "Draft saved" : "All changes published"}
            </span>
          </span>
          {toast ? (
            <span
              className={`text-sm font-medium ${toast.ok ? "text-emerald-600" : "text-rose-600"}`}
            >
              {toast.text}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {hasDraft ? (
              <button
                type="button"
                onClick={onDiscard}
                disabled={busy !== null}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--hc-ink-muted)] transition-colors hover:text-rose-600 disabled:opacity-60"
              >
                {busy === "discard" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Discard draft
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={busy !== null || !dirty}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--hc-line)] px-4 text-sm font-semibold text-[var(--hc-ink)] transition-colors hover:border-[var(--hc-accent)] disabled:opacity-50"
            >
              {busy === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              Save draft
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={busy !== null}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--hc-accent)] px-4 text-sm font-semibold text-[#1a1408] transition-colors hover:bg-[var(--hc-accent-strong)] disabled:opacity-60"
            >
              {busy === "publish" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
