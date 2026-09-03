"use client";

/**
 * QuizEngine — interactive quiz, graded server-side on submit.
 *
 * V3 PASS 21 contract:
 *   • Question types: single_choice, multiple_choice, short_text (free-response)
 *   • Grading is server-authoritative only — the answer key is NEVER shipped to
 *     the client, so a learner cannot read the correct answers from the props
 *     payload before submitting. Correctness is returned by the server after the
 *     attempt is recorded (via the existing submitQuizAttempt path).
 *   • Keyboard navigation (Tab through controls; submission via form)
 *   • One question per screen on mobile (parent layout); grouped on desktop
 *
 * Pass `serverAction` as the form action to keep server-side grading
 * authoritative (the existing /lib/learn/workflows.submitQuizAttempt path).
 */

import { useState } from "react";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";

export type QuizQuestionInput = {
  id: string;
  prompt: string;
  questionType: "single_choice" | "multiple_choice" | "short_text";
  options: string[];
  // NOTE: the answer key is intentionally NOT part of the client prop shape.
  // Grading happens server-side after the attempt is recorded.
  explanation: string;
};

export type QuizEngineProps = {
  /** Server action (FormData) e.g. `submitQuizAttemptAction` */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => any;
  courseId: string;
  quizId: string;
  questions: QuizQuestionInput[];
  passScore: number;
  /** Localized labels */
  labels: {
    question: string;
    submit: string;
    submitting: string;
    showExplanation: string;
    hideExplanation: string;
    correct: string;
    incorrect: string;
    previewScore: string;
    passScoreLabel: string;
    requiredAnswer: string;
    freeResponsePlaceholder: string;
  };
};

export function QuizEngine({
  action,
  courseId,
  quizId,
  questions,
  passScore,
  labels,
}: QuizEngineProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const handleSelect = (questionId: string, value: string, multi: boolean) => {
    setAnswers((prev) => {
      const current = new Set(prev[questionId] || []);
      if (multi) {
        if (current.has(value)) current.delete(value);
        else current.add(value);
      } else {
        current.clear();
        current.add(value);
      }
      return { ...prev, [questionId]: Array.from(current) };
    });
  };

  const handleFreeText = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [value] }));
  };

  const toggleExplanation = (questionId: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="quizId" value={quizId} />

      {questions.map((question, index) => {
        const submitted = answers[question.id] ?? [];
        const isMulti = question.questionType === "multiple_choice";
        const isShort = question.questionType === "short_text";
        const showExplanation = revealed.has(question.id);

        return (
          <fieldset
            key={question.id}
            className="rounded-[1.5rem] border border-[var(--learn-line)] bg-white/5 p-5"
          >
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
              {labels.question} {index + 1}
            </legend>
            <p className="mt-3 text-lg font-semibold text-[var(--learn-ink)]">
              {question.prompt}
            </p>

            <div className="mt-4 space-y-3">
              {isShort ? (
                <textarea
                  name={`question:${question.id}`}
                  required
                  rows={4}
                  placeholder={labels.freeResponsePlaceholder}
                  onChange={(e) => handleFreeText(question.id, e.target.value)}
                  className="learn-textarea w-full rounded-2xl border border-[var(--learn-line)] bg-transparent px-4 py-3 text-[var(--learn-ink)]"
                  aria-required="true"
                />
              ) : (
                question.options.map((option) => {
                  const inputId = `${question.id}-${option}`;
                  const checked = submitted.includes(option);
                  return (
                    <label
                      key={option}
                      htmlFor={inputId}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        checked
                          ? "border-[var(--learn-mint-soft)]/50 bg-[var(--learn-mint-soft)]/10"
                          : "border-[var(--learn-line)]"
                      }`}
                    >
                      <input
                        id={inputId}
                        type={isMulti ? "checkbox" : "radio"}
                        name={`question:${question.id}`}
                        value={option}
                        checked={checked}
                        required={!isMulti}
                        onChange={() => handleSelect(question.id, option, isMulti)}
                        className="mt-1 h-4 w-4 accent-[var(--learn-mint)]"
                      />
                      <span className="text-[var(--learn-ink)]">{option}</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Explanation toggle — correctness is shown after server grading. */}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-xs">
              {question.explanation ? (
                <button
                  type="button"
                  onClick={() => toggleExplanation(question.id)}
                  className="text-xs font-semibold text-[var(--learn-copper)] underline-offset-2 hover:underline"
                  aria-expanded={showExplanation}
                >
                  {showExplanation ? labels.hideExplanation : labels.showExplanation}
                </button>
              ) : null}
            </div>
            {showExplanation && question.explanation ? (
              <p className="mt-2 text-sm leading-7 text-[var(--learn-ink-soft)]">
                {question.explanation}
              </p>
            ) : null}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-[var(--learn-line)] bg-black/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--learn-ink-soft)]">
          {labels.passScoreLabel}: {passScore}%
        </p>
        <PendingSubmitButton pendingLabel={labels.submitting}>
          {labels.submit}
        </PendingSubmitButton>
      </div>
    </form>
  );
}
