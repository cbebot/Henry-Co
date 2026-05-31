"use client";

import { Check } from "lucide-react";
import type { GuidedOption, GuidedQuestion } from "@/lib/studio/guided-questions";

/**
 * QuestionCard — renders a single guided-interview question.
 *
 * Presentational only: it receives already-localized options (canonical
 * `value`, translated `label`/`detail`) and reports the next answer up to the
 * controller. `single` and `multi` render as chip grids (radio / toggle
 * semantics via `aria-pressed`); `text` renders a `.studio-textarea`. Hover
 * lift + selected ring are pure CSS — framer-motion reveal lands at Stage 5.
 */
export function GuidedQuestionCard({
  question,
  options,
  answer,
  onChange,
  t,
}: {
  question: GuidedQuestion;
  options: GuidedOption[];
  answer: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  t: (text: string) => string;
}) {
  const selectedValues = Array.isArray(answer)
    ? answer
    : typeof answer === "string" && answer.length > 0
      ? [answer]
      : [];

  const toggleMulti = (value: string) => {
    const set = new Set(selectedValues);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange([...set]);
  };

  return (
    <section>
      <h2 className="text-balance text-[1.4rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--studio-ink)] sm:text-[1.65rem]">
        {t(question.prompt)}
      </h2>
      {question.help ? (
        <p className="mt-2 max-w-xl text-[14px] leading-7 text-[var(--studio-ink-soft)]">
          {t(question.help)}
        </p>
      ) : null}

      {question.kind === "text" ? (
        <textarea
          value={typeof answer === "string" ? answer : ""}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={question.placeholder ? t(question.placeholder) : undefined}
          className="studio-textarea mt-5 rounded-[1rem] px-4 py-3 leading-7"
        />
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() =>
                    question.kind === "multi"
                      ? toggleMulti(option.value)
                      : onChange(option.value)
                  }
                  className={[
                    "group relative flex h-full w-full flex-col rounded-[1.1rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5",
                    isSelected
                      ? "border-[rgba(151,244,243,0.5)] bg-[rgba(151,244,243,0.08)]"
                      : "border-[var(--studio-line)] bg-black/10 hover:border-[rgba(151,244,243,0.35)]",
                  ].join(" ")}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-[14.5px] font-semibold leading-snug text-[var(--studio-ink)]">
                      {option.label}
                    </span>
                    <span
                      aria-hidden
                      className={[
                        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                        isSelected
                          ? "border-[var(--studio-signal)] bg-[var(--studio-signal)] text-black"
                          : "border-[var(--studio-line)] text-transparent",
                      ].join(" ")}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                  {option.detail ? (
                    <span className="mt-1.5 text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">
                      {option.detail}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
