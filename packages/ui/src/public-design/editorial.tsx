/**
 * Public design system — editorial list + card (V3-PUBLIC-DESIGN-01).
 *
 * The audit's recurring failure is "a wall of equal glass cards". The default
 * container language here is instead a HAIRLINE-DIVIDED LIST (`EditorialList` /
 * `EditorialRow`) — space + a rule do the work chrome used to. `Card` exists for the
 * genuine card moments (a tile that must read as a discrete object), kept calm:
 * hairline border, faint surface, optional one-step hover lift. Server-safe.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "../cn";

/** A hairline-divided list — the editorial alternative to a card grid. */
export function EditorialList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul role="list" className={cn("divide-y divide-[color:var(--home-line)]", className)}>
      {children}
    </ul>
  );
}

/**
 * One hairline row: an optional mono index, a serif title, one body line, and an
 * optional trailing slot (a value, a chevron). Becomes a link when `href` is set.
 */
export function EditorialRow({
  index,
  title,
  body,
  trailing,
  href,
  className,
}: {
  index?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <div className={cn("flex items-baseline gap-4 py-5", href && "home-lift", className)}>
      {index !== undefined ? (
        <span className="home-num shrink-0 text-sm text-[color:var(--home-accent-text)]">{index}</span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="home-title">{title}</div>
        {body ? <p className="home-body-sm mt-1.5 text-[color:var(--home-ink-60)]">{body}</p> : null}
      </div>
      {trailing ? <div className="shrink-0 self-center">{trailing}</div> : null}
    </div>
  );
  return (
    <li>
      {href ? (
        <a href={href} className="home-focus block no-underline">
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}

/** A calm card for genuine discrete-object moments (not a default — prefer lists). */
export function Card({
  children,
  className,
  interactive = false,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: ElementType;
}) {
  return (
    <As
      className={cn(
        "rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-6 sm:p-7",
        interactive && "home-lift hover:border-[color:var(--home-line-15)] hover:bg-[color:var(--home-surface-04)]",
        className,
      )}
    >
      {children}
    </As>
  );
}
