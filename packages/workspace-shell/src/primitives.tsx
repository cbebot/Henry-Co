import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { WorkspaceTone } from "./types";

/* ──────────────────────────────────────────────────────────────────
   Cards
   ────────────────────────────────────────────────────────────────── */

export type WorkspaceCardProps = {
  className?: string;
  elevated?: boolean;
  children: ReactNode;
};

/**
 * Token-aware surface card. The two variants share padding intent but
 * differ on shadow depth + border weight — `elevated` is for the page's
 * primary card (eg. the active project card on /client home).
 */
export function WorkspaceCard({ className = "", elevated = false, children }: WorkspaceCardProps) {
  const base = elevated ? "ws-card-elev" : "ws-card";
  return <section className={`${base} ${className}`.trim()}>{children}</section>;
}

/* ──────────────────────────────────────────────────────────────────
   Buttons
   ────────────────────────────────────────────────────────────────── */

export type WorkspaceButtonVariant = "primary" | "secondary" | "ghost";

export type WorkspaceButtonProps = {
  variant?: WorkspaceButtonVariant;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function WorkspaceButton({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...rest
}: WorkspaceButtonProps) {
  const variantClass =
    variant === "primary"
      ? "ws-button-primary"
      : variant === "secondary"
        ? "ws-button-secondary"
        : "ws-button-ghost";
  return (
    <button type={type} className={`ws-button ${variantClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

/**
 * Anchor-flavored button — same styles, renders as <a>. Useful for nav
 * CTAs that should follow link semantics.
 */
export type WorkspaceLinkButtonProps = {
  variant?: WorkspaceButtonVariant;
  className?: string;
  children: ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function WorkspaceLinkButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: WorkspaceLinkButtonProps) {
  const variantClass =
    variant === "primary"
      ? "ws-button-primary"
      : variant === "secondary"
        ? "ws-button-secondary"
        : "ws-button-ghost";
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return (
    <a className={`ws-button ${variantClass} ${className}`.trim()} {...rest}>
      {children}
    </a>
  );
}

/* ──────────────────────────────────────────────────────────────────
   StatusBadge
   ────────────────────────────────────────────────────────────────── */

export type WorkspaceStatusBadgeProps = {
  tone: WorkspaceTone;
  label: string;
  size?: "default" | "sm";
};

export function WorkspaceStatusBadge({ tone, label, size = "default" }: WorkspaceStatusBadgeProps) {
  return (
    <span className="ws-status-badge" data-tone={tone} data-size={size}>
      {label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────
   EmptyState
   ────────────────────────────────────────────────────────────────── */

export type WorkspaceEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "default" | "muted";
};

export function WorkspaceEmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "default",
}: WorkspaceEmptyStateProps) {
  return (
    <div className="ws-empty-state" data-tone={tone}>
      {Icon ? (
        <span className="ws-empty-state-icon" aria-hidden>
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <div className="ws-empty-state-title">{title}</div>
      {body ? <p className="ws-empty-state-body">{body}</p> : null}
      {action}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Divider
   ────────────────────────────────────────────────────────────────── */

export function WorkspaceDivider({ className = "" }: { className?: string }) {
  return <hr className={`ws-divider ${className}`.trim()} />;
}
