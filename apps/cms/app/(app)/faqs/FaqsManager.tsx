"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, HelpCircle, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  Card,
  DangerIconButton,
  EditorHeader,
  Field,
  IconButton,
  PrimaryButton,
  Select,
  Spinner,
  StatusPill,
  TextArea,
  TextInput,
  Toggle,
  type ToastMessage,
} from "@/components/cms/editor-kit";
import { createFaq, deleteFaq, updateFaq } from "@/lib/cms/faqs-actions";
import { FAQ_PAGE_KEYS, faqPageLabel, type Faq, type FaqGroup } from "@/lib/cms/faqs-shared";

type Draft = {
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
};

function draftOf(faq: Faq): Draft {
  return {
    question: faq.question,
    answer: faq.answer,
    is_published: faq.is_published,
    sort_order: faq.sort_order,
  };
}

/** A single editable FAQ row with its own dirty-tracking, toast, and save/delete. */
function FaqRow({
  faq,
  index,
  total,
  onSaved,
  onMove,
  busy,
  setBusy,
}: {
  faq: Faq;
  index: number;
  total: number;
  onSaved: () => void;
  onMove: (faq: Faq, dir: -1 | 1) => void;
  busy: string | null;
  setBusy: (next: string | null) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(faq));
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);

  const baseline = useMemo(() => JSON.stringify(draftOf(faq)), [faq]);
  const dirty = useMemo(() => JSON.stringify(draft) !== baseline, [draft, baseline]);

  const savingThis = busy === `save:${faq.id}`;
  const deletingThis = busy === `delete:${faq.id}`;
  const locked = busy !== null;

  function patch(p: Partial<Draft>) {
    setToast(null);
    setDraft((d) => ({ ...d, ...p }));
  }

  async function persist(next: Draft, key: string, successText: string) {
    setBusy(key);
    const res = await updateFaq(faq.id, {
      page_key: faq.page_key,
      question: next.question,
      answer: next.answer,
      sort_order: next.sort_order,
      is_published: next.is_published,
    });
    setBusy(null);
    if (res.ok) {
      setToast({ ok: true, text: successText });
      onSaved();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  async function onSave() {
    if (!draft.question.trim() || !draft.answer.trim()) {
      setToast({ ok: false, text: "A question and answer are both required." });
      return;
    }
    await persist(draft, `save:${faq.id}`, "Saved.");
  }

  async function onTogglePublished(nextPublished: boolean) {
    const next = { ...draft, is_published: nextPublished };
    setDraft(next);
    await persist(
      next,
      `toggle:${faq.id}`,
      nextPublished
        ? "Published — now visible on the public site."
        : "Unpublished — hidden from the public site."
    );
  }

  async function onDelete() {
    setBusy(`delete:${faq.id}`);
    const res = await deleteFaq(faq.id);
    setBusy(null);
    setConfirming(false);
    if (res.ok) {
      onSaved();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  return (
    <div className="rounded-xl border border-[var(--hc-line)] bg-[var(--hc-bg-soft)] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--hc-ink-muted)]">
          Question {index + 1}
          {draft.is_published ? (
            <StatusPill tone="published">Published</StatusPill>
          ) : (
            <StatusPill tone="draft">Hidden</StatusPill>
          )}
        </span>
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => onMove(faq, -1)}
            disabled={index === 0 || locked}
            aria-label="Move question up"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton
            onClick={() => onMove(faq, 1)}
            disabled={index === total - 1 || locked}
            aria-label="Move question down"
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </IconButton>
          {confirming ? (
            <span className="flex items-center gap-1">
              <DangerIconButton onClick={onDelete} disabled={locked} aria-label="Confirm delete">
                {deletingThis ? <Spinner /> : <Check className="h-4 w-4" aria-hidden />}
              </DangerIconButton>
              <IconButton
                onClick={() => setConfirming(false)}
                disabled={locked}
                aria-label="Cancel delete"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </IconButton>
            </span>
          ) : (
            <DangerIconButton
              onClick={() => {
                setToast(null);
                setConfirming(true);
              }}
              disabled={locked}
              aria-label="Delete question"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </DangerIconButton>
          )}
        </div>
      </div>

      {confirming ? (
        <p className="mt-2 text-xs font-medium text-rose-600">
          Delete this question for good? Confirm with the check, or cancel.
        </p>
      ) : null}

      <div className="mt-3 space-y-3">
        <Field label="Question">
          <TextInput
            value={draft.question}
            onChange={(e) => patch({ question: e.target.value })}
            placeholder="What does Henry & Co. do?"
          />
        </Field>
        <Field label="Answer">
          <TextArea
            value={draft.answer}
            onChange={(e) => patch({ answer: e.target.value })}
            placeholder="A clear, concise answer…"
          />
        </Field>
        <Toggle
          checked={draft.is_published}
          onChange={onTogglePublished}
          label="Published"
          description="When off, this question is hidden from the public site."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={onSave} disabled={locked || !dirty}>
          {savingThis ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
          Save
        </PrimaryButton>
        <span className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
            aria-hidden
          />
          <span className="text-[var(--hc-ink-muted)]">{dirty ? "Unsaved changes" : "Saved"}</span>
        </span>
        {toast ? (
          <span className={`text-sm font-medium ${toast.ok ? "text-emerald-600" : "text-rose-600"}`}>
            {toast.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** The new-question form: choose a page, write the Q&A, then create it. */
function NewFaqForm({
  nextSortOrder,
  onCreated,
  busy,
  setBusy,
}: {
  nextSortOrder: (pageKey: string) => number;
  onCreated: () => void;
  busy: string | null;
  setBusy: (next: string | null) => void;
}) {
  const [pageKey, setPageKey] = useState<string>(FAQ_PAGE_KEYS[0]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [toast, setToast] = useState<ToastMessage>(null);

  const creating = busy === "create";
  const locked = busy !== null;

  async function onCreate() {
    if (!question.trim() || !answer.trim()) {
      setToast({ ok: false, text: "A question and answer are both required." });
      return;
    }
    setBusy("create");
    const res = await createFaq({
      page_key: pageKey,
      question: question.trim(),
      answer: answer.trim(),
      sort_order: nextSortOrder(pageKey),
      is_published: isPublished,
    });
    setBusy(null);
    if (res.ok) {
      setQuestion("");
      setAnswer("");
      setIsPublished(true);
      setToast({ ok: true, text: "Question added." });
      onCreated();
    } else {
      setToast({ ok: false, text: res.error });
    }
  }

  return (
    <Card title="New question" desc="Add a FAQ to any public page.">
      <Field label="Page" hint="Where this question appears">
        <Select value={pageKey} onChange={(e) => setPageKey(e.target.value)}>
          {FAQ_PAGE_KEYS.map((key) => (
            <option key={key} value={key}>
              {faqPageLabel(key)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Question">
        <TextInput
          value={question}
          onChange={(e) => {
            setToast(null);
            setQuestion(e.target.value);
          }}
          placeholder="How do I get in touch?"
        />
      </Field>
      <Field label="Answer">
        <TextArea
          value={answer}
          onChange={(e) => {
            setToast(null);
            setAnswer(e.target.value);
          }}
          placeholder="The answer visitors will see…"
        />
      </Field>
      <Toggle
        checked={isPublished}
        onChange={setIsPublished}
        label="Publish immediately"
        description="Leave on to make it live, or turn off to add it hidden."
      />
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={onCreate} disabled={locked}>
          {creating ? <Spinner /> : <Plus className="h-4 w-4" aria-hidden />}
          Add question
        </PrimaryButton>
        {toast ? (
          <span className={`text-sm font-medium ${toast.ok ? "text-emerald-600" : "text-rose-600"}`}>
            {toast.text}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function FaqsManager({ groups }: { groups: FaqGroup[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage>(null);

  const total = useMemo(() => groups.reduce((sum, g) => sum + g.faqs.length, 0), [groups]);

  function refresh() {
    router.refresh();
  }

  /** The next free sort_order for a page (10 past the current max, or 100). */
  function nextSortOrder(pageKey: string): number {
    const group = groups.find((g) => g.page_key === pageKey);
    if (!group || group.faqs.length === 0) return 100;
    const max = group.faqs.reduce((m, f) => Math.max(m, f.sort_order), 0);
    return max + 10;
  }

  /**
   * Reorder by swapping the sort_order of two adjacent FAQs in a page group,
   * persisting both. Direction -1 moves the row earlier, +1 later.
   */
  async function onMove(faq: Faq, dir: -1 | 1) {
    const group = groups.find((g) => g.page_key === faq.page_key);
    if (!group) return;
    const i = group.faqs.findIndex((f) => f.id === faq.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= group.faqs.length) return;
    const other = group.faqs[j];

    setBusy(`move:${faq.id}`);
    setToast(null);
    const inputFor = (f: Faq, sortOrder: number) => ({
      page_key: f.page_key,
      question: f.question,
      answer: f.answer,
      sort_order: sortOrder,
      is_published: f.is_published,
    });
    const [a, b] = await Promise.all([
      updateFaq(faq.id, inputFor(faq, other.sort_order)),
      updateFaq(other.id, inputFor(other, faq.sort_order)),
    ]);
    setBusy(null);
    if (a.ok && b.ok) {
      setToast({ ok: true, text: "Order updated." });
      refresh();
    } else {
      const err = (!a.ok && a.error) || (!b.ok && b.error) || "Could not reorder.";
      setToast({ ok: false, text: err });
    }
  }

  const moving = busy?.startsWith("move:") ?? false;

  return (
    <div className="space-y-7 pb-12">
      <EditorHeader
        title="FAQs"
        status={
          <StatusPill tone="muted">
            {total} question{total === 1 ? "" : "s"}
          </StatusPill>
        }
        description="Manage the questions and answers shown on every public Henry & Co. page. Each change saves instantly — there is no separate publish step."
      />

      {moving && toast ? (
        <p className={`text-sm font-medium ${toast.ok ? "text-emerald-600" : "text-rose-600"}`}>
          {toast.text}
        </p>
      ) : null}

      <NewFaqForm nextSortOrder={nextSortOrder} onCreated={refresh} busy={busy} setBusy={setBusy} />

      {groups.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hc-accent-soft)] text-[var(--hc-accent-text)]">
              <HelpCircle className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-sm text-[var(--hc-ink-muted)]">
              No questions yet. Add your first one above and it&apos;ll appear here grouped by page.
            </p>
          </div>
        </Card>
      ) : (
        groups.map((group) => (
          <Card
            key={group.page_key}
            title={group.label}
            desc={`/${group.page_key} · ${group.faqs.length} question${
              group.faqs.length === 1 ? "" : "s"
            }`}
          >
            {group.faqs.map((faq, index) => (
              <FaqRow
                key={faq.id}
                faq={faq}
                index={index}
                total={group.faqs.length}
                onSaved={refresh}
                onMove={onMove}
                busy={busy}
                setBusy={setBusy}
              />
            ))}
          </Card>
        ))
      )}
    </div>
  );
}
