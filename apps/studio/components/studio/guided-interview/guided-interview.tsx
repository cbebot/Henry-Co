"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { saveDraft, useFormDraft } from "@henryco/lifecycle/drafts";
import { GuidedQuestionCard } from "@/components/studio/guided-interview/question-card";
import { generateStudioBriefDraftAction } from "@/lib/studio/brief-copilot-action";
import { useStudioMotion } from "@/lib/studio/motion";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import {
  GUIDED_GOAL_MIN_LENGTH,
  applicableGuidedQuestions,
  buildGuidedDescription,
  guidedAnswersToStructured,
  mergeGuidedStructured,
  resolveGuidedServiceKind,
  resolveNextQuestion,
  type GuidedAnswers,
} from "@/lib/studio/guided-questions";
import {
  STUDIO_BRIEF_DRAFT_KEY,
  STUDIO_BRIEF_DRAFT_VERSION,
  structuredToDraft,
} from "@/lib/studio/request-fields";
import type { StudioService } from "@/lib/studio/types";

const GUIDED_ANSWERS_KEY = "studio-guided-answers";
const GUIDED_ANSWERS_VERSION = 1;

/**
 * GuidedInterview — the "answer a few questions" on-ramp.
 *
 * Walks the adaptive question graph one card at a time, accumulating answers
 * in a dedicated draft envelope (separate key from the brief draft). On finish
 * it synthesizes a structured brief from the answers, optionally enriches it
 * via the co-pilot action, stages a `studio-brief-new` draft positioned on the
 * Scope step, then routes to /request/build — where the manual builder
 * restores it and the buyer confirms scope and honest pricing before submit.
 */
export function GuidedInterview({
  services,
  requestConfig,
  preferredTeamId,
}: {
  services: StudioService[];
  requestConfig: StudioRequestConfig;
  preferredTeamId: string | null;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const m = useStudioMotion();
  const router = useRouter();

  const answers = useFormDraft<GuidedAnswers>(GUIDED_ANSWERS_KEY, {}, {
    version: GUIDED_ANSWERS_VERSION,
  });
  const [cursor, setCursor] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const jumpedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const applicable = useMemo(
    () => applicableGuidedQuestions(answers.value, requestConfig, services),
    [answers.value, requestConfig, services],
  );
  const safeCursor = Math.min(Math.max(0, cursor), Math.max(0, applicable.length - 1));
  const current = applicable[safeCursor];
  const isLast = safeCursor === applicable.length - 1;

  const serviceKind = resolveGuidedServiceKind(answers.value, services);
  const options = useMemo(() => {
    if (!current?.options) return [];
    return current
      .options(requestConfig, serviceKind, services)
      .map((option) => ({
        value: option.value,
        label: t(option.label),
        detail: option.detail ? t(option.detail) : undefined,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, requestConfig, serviceKind, services, locale]);

  // Resume a restored draft at the first unanswered question — runs once
  // after the envelope settles so a mid-flow refresh lands where you left off.
  useEffect(() => {
    if (!answers.isRestored || jumpedRef.current) return;
    jumpedRef.current = true;
    const list = applicableGuidedQuestions(answers.value, requestConfig, services);
    const next = resolveNextQuestion(answers.value, requestConfig, services);
    const idx = next ? list.findIndex((question) => question.id === next.id) : list.length - 1;
    setCursor(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.isRestored]);

  // Move focus to the question on step change for keyboard + screen-reader flow.
  useEffect(() => {
    cardRef.current?.focus();
  }, [safeCursor]);

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (!current) return;
      const questionId = current.id;
      answers.setValue((prev) => {
        // Switching the service kind invalidates kind-specific answers, so
        // drop them — budget / timeline / goal are kind-agnostic and stay.
        if (questionId === "serviceKind" && prev.serviceKind !== value) {
          const next: GuidedAnswers = { ...prev, serviceKind: value };
          delete next.projectType;
          delete next.pages;
          delete next.features;
          delete next.addons;
          return next;
        }
        return { ...prev, [questionId]: value };
      });
    },
    [answers, current],
  );

  const canAdvance = useMemo(() => {
    if (!current) return false;
    const value = answers.value[current.id];
    if (current.kind === "multi") return true;
    if (current.kind === "text") {
      return typeof value === "string" && value.trim().length >= GUIDED_GOAL_MIN_LENGTH;
    }
    return typeof value === "string" && value.trim().length > 0;
  }, [answers.value, current]);

  const finish = useCallback(async () => {
    setSubmitting(true);
    const kind = resolveGuidedServiceKind(answers.value, services);
    const local = guidedAnswersToStructured(answers.value, requestConfig, services);

    let enriched = local;
    try {
      const formData = new FormData();
      formData.set(
        "description",
        buildGuidedDescription(answers.value, requestConfig, services),
      );
      const result = await generateStudioBriefDraftAction(formData);
      if (result.ok) enriched = result.structured;
    } catch {
      // Network / parse failure — the deterministic local synthesis stands in
      // so the guided lane never dead-ends before the builder.
    }

    const structured = mergeGuidedStructured(local, enriched);
    const draftValue = structuredToDraft(structured, {
      config: requestConfig,
      services,
      serviceKind: kind,
      preferredTeamId,
    });

    saveDraft({
      key: STUDIO_BRIEF_DRAFT_KEY,
      // Land on Scope (step 1): the path + service kind are already decided,
      // so the buyer reviews pre-filled capabilities and honest pricing next.
      value: { ...draftValue, stepIndex: 1 },
      savedAt: Date.now(),
      version: STUDIO_BRIEF_DRAFT_VERSION,
    });

    router.push("/request/build");
  }, [answers.value, preferredTeamId, requestConfig, router, services]);

  const onNext = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    setCursor((value) => value + 1);
  }, [finish, isLast]);

  const onBack = useCallback(() => {
    setCursor((value) => Math.max(0, value - 1));
  }, []);

  const progress = applicable.length > 0
    ? Math.round(((safeCursor + 1) / applicable.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Compact header — kicker, small h1, and a numeric step indicator.
          No oversized headline chrome. */}
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--studio-signal)]">
          {t("Answer a few questions")}
        </p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[1.8rem]">
            {t("A few quick questions")}
          </h1>
          <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-[var(--studio-ink-soft)]">
            {`${safeCursor + 1} / ${applicable.length}`}
          </span>
        </div>
        <div
          className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--studio-line)]/60"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--studio-signal)]/80 to-[var(--studio-signal)] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </header>

      <div className="studio-panel rounded-[1.6rem] p-5 sm:p-7">
        {submitting ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-[var(--studio-signal)]" />
            <p className="text-[14px] font-semibold text-[var(--studio-ink)]">
              {t("Shaping your brief…")}
            </p>
            <p className="max-w-sm text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">
              {t("Pulling your answers into a clear plan with honest pricing.")}
            </p>
          </div>
        ) : current ? (
          <motion.div
            key={current.id}
            ref={cardRef}
            tabIndex={-1}
            variants={m.reveal}
            initial="hidden"
            animate="visible"
            className="outline-none"
          >
            <GuidedQuestionCard
              question={current}
              options={options}
              answer={answers.value[current.id]}
              onChange={handleChange}
              t={t}
            />
          </motion.div>
        ) : null}

        {!submitting ? (
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--studio-line)] pt-5">
            <button
              type="button"
              onClick={onBack}
              disabled={safeCursor === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-line)] px-4 py-2 text-[13px] font-semibold text-[var(--studio-ink-soft)] transition hover:border-[rgba(151,244,243,0.35)] hover:text-[var(--studio-ink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Back")}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canAdvance}
              className="studio-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLast ? t("Build my brief") : t("Next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Calm escape hatch — for buyers who'd rather drive every field. */}
      <p className="flex items-center gap-2 text-[13px] leading-7 text-[var(--studio-ink-soft)]">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
        {t("Prefer full control?")}{" "}
        <Link
          href="/request/build"
          className="font-semibold text-[var(--studio-signal)] underline-offset-4 transition hover:underline"
        >
          {t("Build it yourself →")}
        </Link>
      </p>
    </div>
  );
}
