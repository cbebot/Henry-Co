"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getStudioRequestCopy, type StudioRequestCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import {
  generateStudioBriefDraftAction,
  type BriefCopilotResult,
  type BriefCopilotStructured,
} from "@/lib/studio/brief-copilot-action";

function getExamplePrompts(
  copy: StudioRequestCopy["copilot"],
): Array<{ label: string; body: string }> {
  const ex = copy.examplePrompts;
  return [
    { label: ex.logisticsLabel, body: ex.logisticsBody },
    { label: ex.investmentLabel, body: ex.investmentBody },
    { label: ex.opsLabel, body: ex.opsBody },
  ];
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; structured: BriefCopilotStructured; meta: { confidence: number; cached: boolean; callsRemaining: number | null } }
  | { kind: "error"; message: string; reason: string; callsRemaining?: number | null };

const MIN_LENGTH = 30;
const MAX_LENGTH = 1600;

export function BriefCopilotPanel({
  onApply,
}: {
  onApply: (structured: BriefCopilotStructured) => void;
}) {
  const locale = useHenryCoLocale();
  const copy = getStudioRequestCopy(locale).copilot;
  const examplePrompts = useMemo(() => getExamplePrompts(copy), [copy]);
  const [description, setDescription] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showApplyHint, setShowApplyHint] = useState(false);

  const charsLeft = MAX_LENGTH - description.length;
  const canSubmit = description.trim().length >= MIN_LENGTH && !pending;

  function handleSubmit() {
    if (!canSubmit) return;
    setState({ kind: "loading" });
    startTransition(async () => {
      const formData = new FormData();
      formData.set("description", description.trim());
      const result: BriefCopilotResult = await generateStudioBriefDraftAction(formData);
      if (result.ok) {
        setState({
          kind: "success",
          structured: result.structured,
          meta: {
            confidence: result.meta.confidence,
            cached: result.meta.cached,
            callsRemaining: result.meta.callsRemaining,
          },
        });
        setShowApplyHint(true);
        // Auto-apply so the brief is seeded the moment the response lands.
        onApply(result.structured);
      } else {
        setState({
          kind: "error",
          message: result.message,
          reason: result.reason,
          callsRemaining: result.callsRemaining,
        });
      }
    });
  }

  function loadExample(body: string) {
    setDescription(body);
    setState({ kind: "idle" });
    textareaRef.current?.focus();
  }

  const isSuccess = state.kind === "success";

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-[var(--studio-line-strong)] bg-[radial-gradient(120%_100%_at_0%_0%,rgba(151,244,243,0.08),transparent_55%),linear-gradient(180deg,rgba(8,19,28,0.84),rgba(8,16,22,0.96))] p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-[-10%] hidden h-[20rem] w-[20rem] rounded-full opacity-50 blur-3xl md:block"
        style={{
          background:
            "radial-gradient(circle, rgba(217,168,109,0.18) 0%, rgba(151,244,243,0.06) 40%, transparent 70%)",
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 studio-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            {copy.kicker}
          </p>
          <h2 className="mt-3 max-w-2xl text-balance text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[1.8rem]">
            {copy.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.65] text-[var(--studio-ink-soft)]">
            {copy.intro}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="copilot-description" className="sr-only">
          {copy.describeLabel}
        </label>
        <textarea
          id="copilot-description"
          ref={textareaRef}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value.slice(0, MAX_LENGTH));
            if (state.kind === "error") setState({ kind: "idle" });
          }}
          rows={5}
          maxLength={MAX_LENGTH}
          placeholder={copy.placeholder}
          className="w-full rounded-2xl border border-[var(--studio-line-strong)] bg-[rgba(0,0,0,0.18)] px-4 py-3.5 text-[15px] leading-[1.65] text-[var(--studio-ink)] outline-none transition focus:border-[rgba(151,244,243,0.55)] focus:bg-[rgba(0,0,0,0.22)] focus:ring-2 focus:ring-[rgba(151,244,243,0.18)]"
          disabled={pending}
        />
        <div className="mt-2 flex items-center justify-between text-[11.5px] font-medium text-[var(--studio-ink-soft)]">
          <span>{description.length === 0 ? copy.tip : null}</span>
          <span aria-live="polite">
            {charsLeft >= 0 ? copy.charactersLeft(charsLeft) : copy.trim}
          </span>
        </div>
      </div>

      {description.trim().length === 0 ? (
        <div className="mt-6">
          <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
            <Lightbulb className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
            {copy.starterPointsLabel}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {examplePrompts.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => loadExample(example.body)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[rgba(151,244,243,0.45)]"
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                  {copy.exampleBadge}
                </span>
                <span className="text-[13px] font-semibold text-[var(--studio-ink)]">
                  {example.label}
                </span>
                <span className="line-clamp-3 text-[12px] leading-5 text-[var(--studio-ink-soft)]">
                  {example.body}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11.5px] leading-5 text-[var(--studio-ink-soft)]">
          {state.kind === "success" ? (
            <span className="inline-flex items-center gap-1.5 text-[#bdf2cf]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {copy.seededBelow}
            </span>
          ) : state.kind === "error" ? (
            <span className="inline-flex items-center gap-1.5 text-[#ffb8b8]">
              <AlertCircle className="h-3.5 w-3.5" />
              {state.message}
            </span>
          ) : (
            <span>{copy.footerNote}</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {isSuccess ? (
            <button
              type="button"
              onClick={() => {
                setDescription("");
                setState({ kind: "idle" });
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-[13px] font-semibold text-[var(--studio-ink)] transition hover:border-[rgba(151,244,243,0.4)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {copy.tryDifferentParagraph}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#dff8fb,#8df4f2_42%,#4eb8c2)] px-5 py-2.5 text-[13.5px] font-semibold text-[#021016] shadow-[0_22px_56px_rgba(88,212,210,0.26)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.draftingBrief}
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                {isSuccess ? copy.redraftBrief : copy.draftMyBrief}
              </>
            )}
          </button>
        </div>
      </div>

      {state.kind === "success" ? (
        <SuccessSummary
          structured={state.structured}
          meta={state.meta}
          onApply={() => {
            onApply(state.structured);
            setShowApplyHint(false);
          }}
          showApplyHint={showApplyHint}
          copy={copy}
        />
      ) : null}
    </section>
  );
}

function SuccessSummary({
  structured,
  meta,
  onApply,
  showApplyHint,
  copy,
}: {
  structured: BriefCopilotStructured;
  meta: { confidence: number; cached: boolean; callsRemaining: number | null };
  onApply: () => void;
  showApplyHint: boolean;
  copy: StudioRequestCopy["copilot"];
}) {
  const confidencePct = Math.round(meta.confidence * 100);
  return (
    <div className="mt-6 rounded-2xl border border-[rgba(151,244,243,0.35)] bg-[rgba(151,244,243,0.05)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
            <Edit3 className="h-3.5 w-3.5" />
            {copy.coPilotDraft}
          </p>
          <p className="mt-2 text-[13.5px] leading-5 text-[var(--studio-ink)]">{structured.summary || structured.goals}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--studio-line)] bg-[rgba(0,0,0,0.18)] px-3 py-1 text-[11px] font-semibold text-[var(--studio-ink-soft)]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                confidencePct >= 80
                  ? "bg-[#8de8b3]"
                  : confidencePct >= 60
                    ? "bg-[#97f4f3]"
                    : "bg-[#f3d28a]"
              }`}
            />
            {copy.confidence(confidencePct)}
          </span>
          {meta.cached ? (
            <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
              {copy.cacheHit}
            </span>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <DraftField label={copy.fieldProjectType} value={structured.projectType} emptyDash={copy.emptyDash} />
        <DraftField label={copy.fieldBudgetBand} value={structured.budgetBand} emptyDash={copy.emptyDash} />
        <DraftField label={copy.fieldUrgency} value={structured.urgency} emptyDash={copy.emptyDash} />
        <DraftField label={copy.fieldDesignDirection} value={structured.designDirection} emptyDash={copy.emptyDash} />
        <DraftField
          label={copy.fieldPages}
          value={structured.pageRequirements.join(", ") || copy.emptyDash}
          emptyDash={copy.emptyDash}
          full
        />
        <DraftField
          label={copy.fieldFeatures}
          value={structured.requiredFeatures.join(", ") || copy.emptyDash}
          emptyDash={copy.emptyDash}
          full
        />
      </dl>

      {structured.uncertainties.length > 0 ? (
        <div className="mt-4 rounded-xl border border-[var(--studio-line)] bg-[rgba(0,0,0,0.18)] p-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
            {copy.worthClarifying}
          </p>
          <ul className="mt-2 space-y-1 text-[12.5px] leading-5 text-[var(--studio-ink-soft)]">
            {structured.uncertainties.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-[var(--studio-signal)]">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] leading-5 text-[var(--studio-ink-soft)]">
          {copy.seededControl}
        </p>
        {showApplyHint ? (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(151,244,243,0.45)] bg-[rgba(151,244,243,0.08)] px-4 py-2 text-[12.5px] font-semibold text-[var(--studio-signal)] transition hover:bg-[rgba(151,244,243,0.14)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {copy.reapplyToBrief}
          </button>
        ) : null}
      </div>

      <NextActionsRail structured={structured} confidence={confidencePct} copy={copy} />

      {meta.callsRemaining !== null ? (
        <p className="mt-3 text-[11px] text-[var(--studio-ink-soft)]">
          {copy.callsRemaining(
            meta.callsRemaining,
            meta.callsRemaining === 1 ? copy.draftSingular : copy.draftPlural,
          )}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Next actions rail — surfaces post-generation CTAs that match the
 * user's current state. The path is always: brief → review → submit
 * → project workspace + deposit. We tailor the secondary actions:
 *  - Low confidence (<60%) → suggest talking to a Studio lead, since
 *    the structured output had to infer a lot.
 *  - High confidence (≥80%) → skip the lead path; go straight to
 *    "submit the brief" so the user doesn't drift.
 *  - Always offer "browse matching templates" so a user who picked a
 *    common project type can jump to /pick if they want to bypass
 *    the brief entirely.
 *
 * Each CTA is honest about the next step — no AI persona, no fake
 * recommendations. The brief stays the canonical commercial record.
 */
function NextActionsRail({
  structured,
  confidence,
  copy,
}: {
  structured: BriefCopilotStructured;
  confidence: number;
  copy: StudioRequestCopy["copilot"];
}) {
  const wantsTemplates =
    structured.projectType !== "Other" &&
    structured.projectType !== "Custom website" &&
    structured.projectType !== "Web app or platform";
  const lowConfidence = confidence < 60;

  function scrollToBuilder() {
    if (typeof window === "undefined") return;
    const el = document.getElementById("studio-brief-builder");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mt-4 border-t border-[var(--studio-line)] pt-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {copy.nextSteps}
      </p>
      <ol className="mt-2 grid gap-2 sm:grid-cols-3">
        <li>
          <button
            type="button"
            onClick={scrollToBuilder}
            className="group/step flex h-full w-full items-start gap-2.5 rounded-[1rem] border border-[rgba(151,244,243,0.45)] bg-[rgba(151,244,243,0.08)] px-3 py-2.5 text-left transition hover:bg-[rgba(151,244,243,0.14)]"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--studio-signal)] text-[11px] font-semibold text-[#021016]"
            >
              1
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-[var(--studio-ink)]">
                {copy.reviewRefineTitle}
              </div>
              <div className="mt-0.5 text-[11px] leading-5 text-[var(--studio-ink-soft)]">
                {copy.reviewRefineBody}
              </div>
            </div>
          </button>
        </li>
        <li>
          <a
            href={lowConfidence ? "/contact" : "#studio-brief-builder"}
            onClick={lowConfidence ? undefined : (event) => {
              event.preventDefault();
              scrollToBuilder();
            }}
            className="group/step flex h-full w-full items-start gap-2.5 rounded-[1rem] border border-[var(--studio-line)] bg-[rgba(255,255,255,0.025)] px-3 py-2.5 text-left transition hover:border-[rgba(151,244,243,0.35)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] bg-black/15 text-[11px] font-semibold text-[var(--studio-ink-soft)]"
            >
              2
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-[var(--studio-ink)]">
                {lowConfidence ? copy.talkToLeadTitle : copy.submitLockTitle}
              </div>
              <div className="mt-0.5 text-[11px] leading-5 text-[var(--studio-ink-soft)]">
                {lowConfidence ? copy.talkToLeadBody : copy.submitLockBody}
              </div>
            </div>
          </a>
        </li>
        <li>
          <a
            href={wantsTemplates ? "/pick" : "/checkout/template/portfolio-studio"}
            className="group/step flex h-full w-full items-start gap-2.5 rounded-[1rem] border border-[var(--studio-line)] bg-[rgba(255,255,255,0.025)] px-3 py-2.5 text-left transition hover:border-[rgba(151,244,243,0.35)] hover:bg-[rgba(255,255,255,0.04)]"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] bg-black/15 text-[11px] font-semibold text-[var(--studio-ink-soft)]"
            >
              3
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-[var(--studio-ink)]">
                {wantsTemplates ? copy.skipTemplateTitle : copy.payDepositTitle}
              </div>
              <div className="mt-0.5 text-[11px] leading-5 text-[var(--studio-ink-soft)]">
                {wantsTemplates ? copy.skipTemplateBody : copy.payDepositBody}
              </div>
            </div>
          </a>
        </li>
      </ol>
    </div>
  );
}

function DraftField({
  label,
  value,
  emptyDash,
  full = false,
}: {
  label: string;
  value: string;
  emptyDash: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
        {label}
      </dt>
      <dd className="mt-1 text-[13.5px] font-medium text-[var(--studio-ink)]">{value || emptyDash}</dd>
    </div>
  );
}
