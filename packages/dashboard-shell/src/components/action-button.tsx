"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Check, Lock } from "lucide-react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS, STATUS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { focusVisibleStyle } from "../tokens/focus";
import { SUCCESS_LOCK_MS } from "../tokens/motion";

/**
 * ActionButton — five-state canonical button.
 *
 * States: idle / pending / disabled / spinner / success-lock.
 *
 * `pending` and `spinner` are distinct: `pending` is form-submit /
 * server-action progress (driven by useFormStatus inside a <form>);
 * `spinner` is a controlled prop the caller toggles for non-form
 * async work.
 *
 * `success-lock` hard-disables pointer-events for SUCCESS_LOCK_MS
 * (1200ms default) so a click cannot trigger a second submit. Mirrors
 * V5-CLEAR Bug D's PublicButton success-lock pattern at
 * `packages/ui/src/public/public-button.tsx`. When DASH-2 onward
 * migrates module ports to ActionButton, PublicButton's success-lock
 * may be deprecated.
 */
export type ActionButtonProps = {
  /** Visual intent. */
  tone?: "primary" | "secondary" | "ghost";
  /** Render as a submit button inside a form (drives useFormStatus). */
  type?: "button" | "submit";
  /** Forward the click handler. Ignored when type="submit". */
  onClick?: () => void | Promise<void>;
  /** Forward an explicit href — renders an anchor instead of a button. */
  href?: string;
  /** External link target. */
  target?: "_blank" | "_self";
  /** Trailing or leading icon. */
  icon?: ReactNode;
  iconPosition?: "leading" | "trailing";
  /** Hard disabled state. */
  disabled?: boolean;
  /** Async spinner state — caller-controlled. */
  spinner?: boolean;
  /** Success-lock state — caller-controlled. Auto-clears after `successDuration` ms. */
  success?: boolean;
  /** Override the success-lock window. Defaults to SUCCESS_LOCK_MS (1200ms). */
  successDuration?: number;
  /** Label / children. */
  children: ReactNode;
  /** Optional aria-label for icon-only buttons. */
  "aria-label"?: string;
  /** Optional inline style override. */
  style?: React.CSSProperties;
};

import type * as React from "react";

export function ActionButton({
  tone = "primary",
  type = "button",
  onClick,
  href,
  target,
  icon,
  iconPosition = "leading",
  disabled,
  spinner: spinnerProp,
  success: successProp,
  successDuration = SUCCESS_LOCK_MS,
  children,
  style,
  ...rest
}: ActionButtonProps) {
  const [internalSuccess, setInternalSuccess] = useState(false);
  const success = successProp ?? internalSuccess;

  // Auto-clear success-lock after the lock window. We expose this so
  // callers don't have to remember to clear; they just flip success=true
  // when their server action resolves and the button manages its own
  // unlock cycle.
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setInternalSuccess(false), successDuration);
    return () => clearTimeout(t);
  }, [success, successDuration]);

  return (
    <ActionButtonInner
      tone={tone}
      type={type}
      onClick={onClick}
      href={href}
      target={target}
      icon={icon}
      iconPosition={iconPosition}
      disabled={disabled}
      spinner={spinnerProp}
      success={success}
      onSuccessClick={() => setInternalSuccess(true)}
      style={style}
      ariaLabel={rest["aria-label"]}
    >
      {children}
    </ActionButtonInner>
  );
}

type InnerProps = {
  tone: NonNullable<ActionButtonProps["tone"]>;
  type: NonNullable<ActionButtonProps["type"]>;
  onClick?: ActionButtonProps["onClick"];
  href?: string;
  target?: ActionButtonProps["target"];
  icon?: ReactNode;
  iconPosition: NonNullable<ActionButtonProps["iconPosition"]>;
  disabled?: boolean;
  spinner?: boolean;
  success: boolean;
  onSuccessClick: () => void;
  children: ReactNode;
  ariaLabel?: string;
  style?: React.CSSProperties;
};

function ActionButtonInner({
  tone,
  type,
  onClick,
  href,
  target,
  icon,
  iconPosition,
  disabled,
  spinner,
  success,
  onSuccessClick,
  children,
  ariaLabel,
  style,
}: InnerProps) {
  // Form-submit pending state from React 19's useFormStatus. Only
  // active when this button is inside a <form action={server-action}>.
  const formStatus = useFormStatus();
  const pending = type === "submit" ? formStatus.pending : false;

  const isLoading = pending || spinner;
  const isLocked = success || disabled;
  const isInteractable = !isLocked && !isLoading;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.6rem 1rem",
    borderRadius: RADIUS.pill,
    border: tone === "ghost" ? "1px solid transparent" : `1px solid var(${CSS_VARS.hairline})`,
    cursor: isInteractable ? "pointer" : "not-allowed",
    opacity: disabled ? 0.55 : 1,
    pointerEvents: isLocked ? "none" : "auto",
    transition: "transform 120ms ease-in-out, box-shadow 200ms ease-out, background-color 200ms ease-out",
    ...typeStyle("bodyStrong"),
    ...buildToneStyle(tone, success),
    ...style,
  };

  const handleClick = (): void => {
    if (!isInteractable) return;
    if (onClick) {
      void Promise.resolve(onClick()).then(() => {
        onSuccessClick();
      });
    }
  };

  const iconNode = isLoading ? (
    <Loader2 size={16} aria-hidden style={{ animation: "henrycoSpin 0.8s linear infinite" }} />
  ) : success ? (
    <Lock size={16} aria-hidden />
  ) : icon ? (
    <span aria-hidden style={{ display: "inline-flex" }}>{icon}</span>
  ) : null;

  const childrenNode = success ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
      <Check size={16} aria-hidden /> Locked
    </span>
  ) : (
    children
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        style={{ ...baseStyle, ...focusVisibleStyle() }}
        aria-label={ariaLabel}
        aria-disabled={isLocked || undefined}
      >
        {iconPosition === "leading" ? iconNode : null}
        {childrenNode}
        {iconPosition === "trailing" ? iconNode : null}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      aria-busy={isLoading || undefined}
      aria-disabled={isLocked || undefined}
      aria-label={ariaLabel}
      style={{ ...baseStyle, ...focusVisibleStyle() }}
    >
      {iconPosition === "leading" ? iconNode : null}
      {childrenNode}
      {iconPosition === "trailing" ? iconNode : null}
    </button>
  );
}

function buildToneStyle(
  tone: NonNullable<ActionButtonProps["tone"]>,
  success: boolean,
): React.CSSProperties {
  if (success) {
    return {
      backgroundColor: `var(${STATUS_VARS.success.text})`,
      color: `var(${CSS_VARS.surface})`,
      border: `1px solid var(${STATUS_VARS.success.text})`,
    };
  }
  if (tone === "primary") {
    return {
      backgroundColor: `var(${CSS_VARS.accent})`,
      color: `var(${CSS_VARS.textOnAccent})`,
      border: `1px solid var(${CSS_VARS.accent})`,
    };
  }
  if (tone === "secondary") {
    return {
      backgroundColor: `var(${CSS_VARS.surface})`,
      color: `var(${CSS_VARS.ink})`,
    };
  }
  // ghost
  return {
    backgroundColor: "transparent",
    color: `var(${CSS_VARS.ink})`,
  };
}
