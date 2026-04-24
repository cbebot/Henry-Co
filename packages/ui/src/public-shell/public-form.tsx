"use client";

import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef, useId } from "react";
import { cn } from "../lib/cn";

const FOCUS_RING =
  "focus:outline-none focus:ring-2 focus:ring-amber-500/55 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-amber-400/50 dark:focus:ring-offset-[#0a0f14]";

const CONTROL_BASE =
  "block w-full rounded-2xl border bg-white text-[0.95rem] leading-6 text-zinc-900 placeholder:text-zinc-400 transition-colors shadow-[0_1px_0_rgba(15,23,42,0.02)] " +
  "border-zinc-200/90 hover:border-zinc-300 focus:border-amber-400 " +
  "dark:border-white/10 dark:bg-[#0b1018]/85 dark:text-white dark:placeholder:text-white/40 dark:hover:border-white/20 dark:focus:border-amber-300/70";

const CONTROL_ERROR =
  "border-rose-400/70 focus:border-rose-400 dark:border-rose-400/60";

const CONTROL_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-white/[0.03]";

const SIZE_MD = "h-12 px-4";
const SIZE_LG = "h-[3.25rem] px-4";

/**
 * Wrapper that groups label, control, helper text, and optional error messaging.
 * Generates a stable id + aria-describedby wiring automatically.
 */
export function PublicField({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  labelClassName,
  children,
  optionalHint,
  sideLabel,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
  optionalHint?: ReactNode;
  /** e.g. a link like "Forgot password?" rendered to the right of the label */
  sideLabel?: ReactNode;
}) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || sideLabel) && (
        <div className="flex items-center justify-between gap-3">
          {label ? (
            <label
              htmlFor={controlId}
              className={cn(
                "text-sm font-semibold text-zinc-800 dark:text-white/90",
                labelClassName
              )}
            >
              {label}
              {required ? (
                <span aria-hidden className="ml-1 text-rose-500 dark:text-rose-400">
                  *
                </span>
              ) : null}
              {optionalHint && !required ? (
                <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-white/45">
                  {optionalHint}
                </span>
              ) : null}
            </label>
          ) : (
            <span />
          )}
          {sideLabel ? (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300/85">
              {sideLabel}
            </span>
          ) : null}
        </div>
      )}
      <div
        data-field-control
        data-invalid={error ? "true" : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
      >
        {children}
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-5 text-zinc-500 dark:text-white/55">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium leading-5 text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Stable label element for when PublicField wrapping isn't appropriate. */
export function PublicLabel({
  className,
  required,
  children,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("text-sm font-semibold text-zinc-800 dark:text-white/90", className)}
      {...rest}
    >
      {children}
      {required ? (
        <span aria-hidden className="ml-1 text-rose-500 dark:text-rose-400">
          *
        </span>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  size?: "md" | "lg";
  invalid?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const PublicInput = forwardRef<HTMLInputElement, InputProps>(function PublicInput(
  { className, size = "md", invalid, leadingIcon, trailingIcon, ...rest },
  ref
) {
  const control = (
    <input
      ref={ref}
      className={cn(
        CONTROL_BASE,
        FOCUS_RING,
        CONTROL_DISABLED,
        size === "lg" ? SIZE_LG : SIZE_MD,
        Boolean(leadingIcon) && "pl-11",
        Boolean(trailingIcon) && "pr-11",
        Boolean(invalid) && CONTROL_ERROR,
        className
      )}
      {...rest}
    />
  );
  if (!leadingIcon && !trailingIcon) return control;
  return (
    <div className="relative">
      {leadingIcon ? (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-zinc-400 dark:text-white/50">
          {leadingIcon}
        </span>
      ) : null}
      {control}
      {trailingIcon ? (
        <span className="absolute inset-y-0 right-3.5 flex items-center text-zinc-400 dark:text-white/50">
          {trailingIcon}
        </span>
      ) : null}
    </div>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const PublicTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function PublicTextarea({ className, invalid, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          CONTROL_BASE,
          FOCUS_RING,
          CONTROL_DISABLED,
          "min-h-[7rem] py-3 px-4 leading-7",
          Boolean(invalid) && CONTROL_ERROR,
          className
        )}
        {...rest}
      />
    );
  }
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  size?: "md" | "lg";
  invalid?: boolean;
};

export const PublicSelect = forwardRef<HTMLSelectElement, SelectProps>(function PublicSelect(
  { className, size = "md", invalid, children, ...rest },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          CONTROL_BASE,
          FOCUS_RING,
          CONTROL_DISABLED,
          "appearance-none pr-10",
          size === "lg" ? SIZE_LG : SIZE_MD,
          Boolean(invalid) && CONTROL_ERROR,
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 -mt-2 h-4 w-4 text-zinc-400 dark:text-white/45"
      >
        <path
          d="M5.5 8 10 12.5 14.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

/** Vertical stack that manages consistent form rhythm. */
export function PublicFormStack({
  gap = "default",
  className,
  children,
  ...rest
}: {
  gap?: "tight" | "default" | "loose";
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">) {
  const gapClass = gap === "tight" ? "space-y-3" : gap === "loose" ? "space-y-6" : "space-y-4";
  return (
    <div className={cn(gapClass, className)} {...rest}>
      {children}
    </div>
  );
}

/** Horizontal row of form actions (primary submit + link) with wrap. */
export function PublicFormActions({
  className,
  children,
  align = "end",
}: {
  className?: string;
  children: ReactNode;
  align?: "start" | "between" | "end";
}) {
  const alignClass =
    align === "between"
      ? "justify-between"
      : align === "start"
        ? "justify-start"
        : "justify-end";
  return (
    <div className={cn("flex flex-wrap items-center gap-3 pt-1", alignClass, className)}>
      {children}
    </div>
  );
}
