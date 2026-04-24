"use client";

import { useMemo, useState } from "react";
import type {
  NewsletterCampaignClass,
  NewsletterCampaignContent,
  NewsletterCampaignStatus,
  NewsletterDivision,
  NewsletterTopicDefinition,
} from "@henryco/newsletter";

type Props = {
  mode: "create" | "edit";
  campaignId: string | null;
  initialDivision: NewsletterDivision;
  initialCampaignClass: NewsletterCampaignClass;
  initialTopicKeys: string[];
  initialContent: NewsletterCampaignContent | null;
  initialStatus: NewsletterCampaignStatus;
  initialScheduledFor?: string | null;
  initialVoiceWarnings?: string[];
  divisions: NewsletterDivision[];
  campaignClasses: NewsletterCampaignClass[];
  topicGroups: Array<{ division: NewsletterDivision; topics: NewsletterTopicDefinition[] }>;
  canApprove: boolean;
};

type EditorState = {
  status: NewsletterCampaignStatus;
  division: NewsletterDivision;
  campaignClass: NewsletterCampaignClass;
  topicKeys: Set<string>;
  subject: string;
  previewText: string;
  headline: string;
  bodyText: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  footerNote: string;
  scheduledFor: string;
  campaignId: string | null;
  voiceWarnings: string[];
  voiceScore: number | null;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "saving"; label: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const DEFAULT_BODY = [
  "Hey — quick note. Replace this with one concrete update you'd pay attention to if you were on the other side of the email.",
  "• Something specific that is true.",
  "• One more. Keep it human.",
  "If this isn't useful, change your preferences any time. We'd rather send less.",
].join("\n\n");

function contentFromState(state: EditorState): NewsletterCampaignContent {
  const paragraphs = state.bodyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const bodyBlocks: NewsletterCampaignContent["bodyBlocks"] = paragraphs.map((text) => ({
    kind: text.startsWith("# ")
      ? "heading"
      : text.startsWith("> ")
        ? "callout"
        : "paragraph",
    text: text.replace(/^#\s*/, "").replace(/^>\s*/, ""),
  }));

  const primaryCta =
    state.primaryCtaLabel.trim() && state.primaryCtaHref.trim()
      ? { label: state.primaryCtaLabel.trim(), href: state.primaryCtaHref.trim() }
      : null;
  const secondaryCta =
    state.secondaryCtaLabel.trim() && state.secondaryCtaHref.trim()
      ? { label: state.secondaryCtaLabel.trim(), href: state.secondaryCtaHref.trim() }
      : null;
  if (primaryCta) {
    bodyBlocks.push({
      kind: "cta",
      text: primaryCta.label,
      href: primaryCta.href,
      variant: "primary",
    });
  }
  if (secondaryCta) {
    bodyBlocks.push({
      kind: "cta",
      text: secondaryCta.label,
      href: secondaryCta.href,
      variant: "secondary",
    });
  }

  return {
    subject: state.subject.trim(),
    previewText: state.previewText.trim(),
    headline: state.headline.trim(),
    bodyBlocks,
    footerNote: state.footerNote.trim() || null,
    ctaPrimary: primaryCta,
    ctaSecondary: secondaryCta,
  };
}

function stateFromContent(
  initial: NewsletterCampaignContent | null,
  initialDivision: NewsletterDivision,
  initialCampaignClass: NewsletterCampaignClass,
  initialTopicKeys: string[],
  initialStatus: NewsletterCampaignStatus,
  initialScheduledFor: string | null,
  initialVoiceWarnings: string[],
  campaignId: string | null
): EditorState {
  const bodyText = initial?.bodyBlocks
    ?.filter((b) => b.kind === "heading" || b.kind === "paragraph" || b.kind === "callout")
    .map((b) => {
      if (b.kind === "heading") return `# ${b.text ?? ""}`;
      if (b.kind === "callout") return `> ${b.text ?? ""}`;
      return b.text ?? "";
    })
    .filter(Boolean)
    .join("\n\n") || DEFAULT_BODY;
  return {
    status: initialStatus,
    division: initialDivision,
    campaignClass: initialCampaignClass,
    topicKeys: new Set(initialTopicKeys),
    subject: initial?.subject ?? "",
    previewText: initial?.previewText ?? "",
    headline: initial?.headline ?? "",
    bodyText,
    primaryCtaLabel: initial?.ctaPrimary?.label ?? "",
    primaryCtaHref: initial?.ctaPrimary?.href ?? "",
    secondaryCtaLabel: initial?.ctaSecondary?.label ?? "",
    secondaryCtaHref: initial?.ctaSecondary?.href ?? "",
    footerNote: initial?.footerNote ?? "",
    scheduledFor: initialScheduledFor ?? "",
    campaignId,
    voiceWarnings: initialVoiceWarnings,
    voiceScore: null,
  };
}

export default function NewsletterDraftEditor(props: Props) {
  const [state, setState] = useState<EditorState>(() =>
    stateFromContent(
      props.initialContent,
      props.initialDivision,
      props.initialCampaignClass,
      props.initialTopicKeys,
      props.initialStatus,
      props.initialScheduledFor ?? null,
      props.initialVoiceWarnings ?? [],
      props.campaignId
    )
  );
  const [testEmail, setTestEmail] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

  const topicGroupsByDivision = useMemo(() => {
    const byDivision = new Map(props.topicGroups.map((g) => [g.division, g.topics]));
    const topics = byDivision.get(state.division) ?? [];
    return [{ division: state.division, topics }];
  }, [props.topicGroups, state.division]);

  const toggleTopic = (key: string) => {
    setState((prev) => {
      const next = new Set(prev.topicKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, topicKeys: next };
    });
  };

  const postDraft = async (): Promise<
    | { ok: true; campaignId: string; voiceWarnings: string[]; voiceScore: number | null }
    | { ok: false; error: string }
  > => {
    const content = contentFromState(state);
    const payload = {
      id: state.campaignId,
      content,
      topicKeys: Array.from(state.topicKeys),
      campaignClass: state.campaignClass,
      division: state.division,
    };
    const url = state.campaignId
      ? `/api/newsletter/drafts/${state.campaignId}`
      : "/api/newsletter/drafts";
    const method = state.campaignId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      campaign?: { id: string; voice_guard_score: number | null; voice_guard_warnings: string[] };
      message?: string;
    };
    if (!res.ok || !body.ok || !body.campaign) {
      return { ok: false, error: body.message || "Save failed." };
    }
    return {
      ok: true,
      campaignId: body.campaign.id,
      voiceWarnings: body.campaign.voice_guard_warnings ?? [],
      voiceScore: body.campaign.voice_guard_score,
    };
  };

  const saveDraft = async () => {
    setSubmission({ status: "saving", label: "Saving draft" });
    const result = await postDraft();
    if (!result.ok) {
      setSubmission({ status: "error", message: result.error });
      return;
    }
    setState((prev) => ({
      ...prev,
      campaignId: result.campaignId,
      voiceWarnings: result.voiceWarnings,
      voiceScore: result.voiceScore,
    }));
    setSubmission({ status: "success", message: "Draft saved." });
    if (!state.campaignId && result.campaignId) {
      window.history.replaceState(
        {},
        "",
        `/operations/newsletter/${encodeURIComponent(result.campaignId)}`
      );
    }
  };

  const submitForReview = async () => {
    if (!state.campaignId) {
      setSubmission({ status: "error", message: "Save the draft before submitting." });
      return;
    }
    setSubmission({ status: "saving", label: "Submitting for review" });
    const res = await fetch(
      `/api/newsletter/drafts/${encodeURIComponent(state.campaignId)}/submit`,
      { method: "POST" }
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      campaign?: { status: NewsletterCampaignStatus };
    };
    if (!res.ok || !body.ok) {
      setSubmission({ status: "error", message: body.message || "Submit failed." });
      return;
    }
    setState((prev) => ({ ...prev, status: body.campaign?.status ?? "in_review" }));
    setSubmission({ status: "success", message: "Submitted for review." });
  };

  const approve = async () => {
    if (!state.campaignId) return;
    setSubmission({ status: "saving", label: "Approving" });
    const res = await fetch(
      `/api/newsletter/drafts/${encodeURIComponent(state.campaignId)}/approve`,
      { method: "POST" }
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      campaign?: { status: NewsletterCampaignStatus };
    };
    if (!res.ok || !body.ok) {
      setSubmission({ status: "error", message: body.message || "Approve failed." });
      return;
    }
    setState((prev) => ({ ...prev, status: body.campaign?.status ?? "approved" }));
    setSubmission({ status: "success", message: "Approved." });
  };

  const requestChanges = async () => {
    if (!state.campaignId) return;
    setSubmission({ status: "saving", label: "Requesting changes" });
    const res = await fetch(
      `/api/newsletter/drafts/${encodeURIComponent(state.campaignId)}/request-changes`,
      { method: "POST" }
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      campaign?: { status: NewsletterCampaignStatus };
    };
    if (!res.ok || !body.ok) {
      setSubmission({ status: "error", message: body.message || "Request changes failed." });
      return;
    }
    setState((prev) => ({
      ...prev,
      status: body.campaign?.status ?? "changes_requested",
    }));
    setSubmission({ status: "success", message: "Changes requested." });
  };

  const scheduleCampaign = async () => {
    if (!state.campaignId) return;
    if (!state.scheduledFor) {
      setSubmission({
        status: "error",
        message: "Pick a scheduled date/time.",
      });
      return;
    }
    setSubmission({ status: "saving", label: "Scheduling" });
    const res = await fetch(
      `/api/newsletter/drafts/${encodeURIComponent(state.campaignId)}/schedule`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scheduledFor: state.scheduledFor }),
      }
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      campaign?: { status: NewsletterCampaignStatus };
    };
    if (!res.ok || !body.ok) {
      setSubmission({ status: "error", message: body.message || "Schedule failed." });
      return;
    }
    setState((prev) => ({ ...prev, status: body.campaign?.status ?? "scheduled" }));
    setSubmission({ status: "success", message: "Scheduled." });
  };

  const sendNow = async () => {
    if (!state.campaignId) return;
    const confirm = window.confirm(
      "Send this newsletter now to all opted-in subscribers for the selected topics? This cannot be reversed."
    );
    if (!confirm) return;
    setSubmission({ status: "saving", label: "Sending" });
    const res = await fetch(
      `/api/newsletter/drafts/${encodeURIComponent(state.campaignId)}/send`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      }
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      attempted?: number;
      sent?: number;
      skipped?: number;
      failed?: number;
      notes?: string[];
      message?: string;
    };
    if (!res.ok || !body.ok) {
      setSubmission({
        status: "error",
        message: body.message || `Send failed: ${(body.notes ?? []).join(", ")}`,
      });
      return;
    }
    setSubmission({
      status: "success",
      message: `Sent. attempted=${body.attempted ?? 0}, sent=${body.sent ?? 0}, skipped=${body.skipped ?? 0}, failed=${body.failed ?? 0}`,
    });
    setState((prev) => ({ ...prev, status: "sent" }));
  };

  const sendTest = async () => {
    if (!state.campaignId) {
      setSubmission({
        status: "error",
        message: "Save the draft before sending a test.",
      });
      return;
    }
    if (!testEmail.trim()) return;
    setSubmission({ status: "saving", label: "Sending test" });
    const res = await fetch(
      `/api/newsletter/drafts/${encodeURIComponent(state.campaignId)}/test-send`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      }
    );
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      reason?: string;
      provider?: string;
    };
    if (!res.ok || !body.ok) {
      setSubmission({
        status: "error",
        message: body.reason
          ? `Test send failed: ${body.reason}`
          : "Test send failed.",
      });
      return;
    }
    setSubmission({
      status: "success",
      message: `Test sent via ${body.provider ?? "provider"}.`,
    });
  };

  const canEditContent = ["draft", "in_review", "changes_requested"].includes(state.status);
  const canSubmit = state.status === "draft" || state.status === "changes_requested";
  const canApproveNow = state.status === "in_review" && props.canApprove;
  const canSchedule = state.status === "approved" && props.canApprove;
  const canSendNow =
    (state.status === "approved" || state.status === "scheduled") && props.canApprove;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Division
          </span>
          <select
            value={state.division}
            disabled={!canEditContent}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                division: e.target.value as NewsletterDivision,
                topicKeys: new Set(),
              }))
            }
            className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          >
            {props.divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Campaign class
          </span>
          <select
            value={state.campaignClass}
            disabled={!canEditContent}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                campaignClass: e.target.value as NewsletterCampaignClass,
              }))
            }
            className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          >
            {props.campaignClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end text-xs text-[var(--staff-muted)]">
          <div>
            Status: <span className="font-mono text-[var(--staff-ink)]">{state.status}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Topics</p>
        <p className="mt-1 text-xs text-[var(--staff-muted)]">
          Recipients must be opted in to at least one selected topic.
        </p>
        <div className="mt-3 space-y-3">
          {topicGroupsByDivision.map((group) => (
            <div key={group.division}>
              {group.topics.length === 0 ? (
                <p className="text-xs italic text-[var(--staff-muted)]">
                  No public topics defined for {group.division}.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {group.topics.map((topic) => {
                    const active = state.topicKeys.has(topic.key);
                    return (
                      <button
                        key={topic.key}
                        type="button"
                        disabled={!canEditContent}
                        onClick={() => toggleTopic(topic.key)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          active
                            ? "border-[var(--staff-gold)] bg-[var(--staff-gold-soft)] text-[var(--staff-gold)]"
                            : "border-[var(--staff-line)] bg-[var(--staff-surface)] text-[var(--staff-muted)]"
                        }`}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Subject
          </span>
          <input
            type="text"
            value={state.subject}
            disabled={!canEditContent}
            onChange={(e) => setState((prev) => ({ ...prev, subject: e.target.value }))}
            maxLength={140}
            className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Preview text
          </span>
          <input
            type="text"
            value={state.previewText}
            disabled={!canEditContent}
            onChange={(e) => setState((prev) => ({ ...prev, previewText: e.target.value }))}
            maxLength={180}
            className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Headline (inside email)
          </span>
          <input
            type="text"
            value={state.headline}
            disabled={!canEditContent}
            onChange={(e) => setState((prev) => ({ ...prev, headline: e.target.value }))}
            maxLength={140}
            className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Body (use blank lines between paragraphs; prefix with # for headings, &gt; for callouts)
          </span>
          <textarea
            value={state.bodyText}
            disabled={!canEditContent}
            onChange={(e) => setState((prev) => ({ ...prev, bodyText: e.target.value }))}
            rows={12}
            className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 font-mono text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Primary CTA
          </p>
          <input
            type="text"
            value={state.primaryCtaLabel}
            disabled={!canEditContent}
            onChange={(e) =>
              setState((prev) => ({ ...prev, primaryCtaLabel: e.target.value }))
            }
            placeholder="Label — describe the action"
            className="w-full rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={state.primaryCtaHref}
            disabled={!canEditContent}
            onChange={(e) =>
              setState((prev) => ({ ...prev, primaryCtaHref: e.target.value }))
            }
            placeholder="https://henrycogroup.com/..."
            className="w-full rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Secondary CTA (optional)
          </p>
          <input
            type="text"
            value={state.secondaryCtaLabel}
            disabled={!canEditContent}
            onChange={(e) =>
              setState((prev) => ({ ...prev, secondaryCtaLabel: e.target.value }))
            }
            placeholder="Label"
            className="w-full rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={state.secondaryCtaHref}
            disabled={!canEditContent}
            onChange={(e) =>
              setState((prev) => ({ ...prev, secondaryCtaHref: e.target.value }))
            }
            placeholder="https://..."
            className="w-full rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
          Footer note (shown above the unsubscribe/preferences link)
        </span>
        <textarea
          value={state.footerNote}
          disabled={!canEditContent}
          onChange={(e) => setState((prev) => ({ ...prev, footerNote: e.target.value }))}
          rows={2}
          className="rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
        />
      </label>

      {state.voiceWarnings.length > 0 ? (
        <div className="rounded-md border border-[var(--staff-warning)] bg-[var(--staff-warning-soft)] p-3 text-xs text-[var(--staff-warning)]">
          <p className="font-semibold">
            Voice guard: {state.voiceWarnings.length} warning
            {state.voiceWarnings.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-1 list-disc pl-4">
            {state.voiceWarnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
            Test send (use your own email)
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@henrycogroup.com"
              className="flex-1 rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={submission.status === "saving" || !state.campaignId}
              className="rounded-md border border-[var(--staff-line)] px-3 py-2 text-sm disabled:opacity-50"
            >
              Send test
            </button>
          </div>
        </div>
        {canSchedule ? (
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">
              Schedule for
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="datetime-local"
                value={state.scheduledFor}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, scheduledFor: e.target.value }))
                }
                className="flex-1 rounded-md border border-[var(--staff-line)] bg-[var(--staff-surface)] px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={scheduleCampaign}
                disabled={submission.status === "saving"}
                className="rounded-md border border-[var(--staff-line)] px-3 py-2 text-sm disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-[var(--staff-line)] pt-4">
        <button
          type="button"
          onClick={saveDraft}
          disabled={submission.status === "saving" || !canEditContent}
          className="rounded-md bg-[var(--staff-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submission.status === "saving" && submission.label === "Saving draft"
            ? "Saving…"
            : state.campaignId
              ? "Save changes"
              : "Save draft"}
        </button>
        {canSubmit ? (
          <button
            type="button"
            onClick={submitForReview}
            disabled={submission.status === "saving"}
            className="rounded-md border border-[var(--staff-line)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Submit for review
          </button>
        ) : null}
        {canApproveNow ? (
          <>
            <button
              type="button"
              onClick={approve}
              disabled={submission.status === "saving"}
              className="rounded-md border border-[var(--staff-success)] px-4 py-2 text-sm text-[var(--staff-success)] disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={requestChanges}
              disabled={submission.status === "saving"}
              className="rounded-md border border-[var(--staff-warning)] px-4 py-2 text-sm text-[var(--staff-warning)] disabled:opacity-50"
            >
              Request changes
            </button>
          </>
        ) : null}
        {canSendNow ? (
          <button
            type="button"
            onClick={sendNow}
            disabled={submission.status === "saving"}
            className="rounded-md bg-[var(--staff-gold)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send now
          </button>
        ) : null}
      </div>

      {submission.status === "success" ? (
        <p className="rounded-md border border-[var(--staff-success)] bg-[var(--staff-success-soft)] px-3 py-2 text-sm text-[var(--staff-success)]">
          {submission.message}
        </p>
      ) : null}
      {submission.status === "error" ? (
        <p className="rounded-md border border-[var(--staff-critical)] bg-[var(--staff-critical-soft)] px-3 py-2 text-sm text-[var(--staff-critical)]">
          {submission.message}
        </p>
      ) : null}
    </div>
  );
}
