/**
 * Public design system — the CTA / button system (V3-PUBLIC-DESIGN-01).
 *
 * One accent-aware button language: `primary` (accent fill, dark ink — AA on gold),
 * `secondary` (hairline + faint surface), `ghost` (text-only). Renders an <a> when
 * `href` is given, else a <button>. Server-safe; works in RSC or (when imported by a
 * client form) as a client submit button via `type="submit"`.
 *
 * Discipline (audit): one dominant primary invitation per surface; demote the rest
 * to secondary/ghost. Never stack three co-equal primaries.
 */
import type { MouseEventHandler, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";

const cta = cva(
  "home-focus inline-flex items-center justify-center gap-2 rounded-full font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--home-accent)] text-[color:var(--home-accent-ink)] hover:bg-[color:var(--home-accent-strong)]",
        secondary:
          "border border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] text-[color:var(--home-ink)] hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)]",
        ghost: "text-[color:var(--home-ink-70)] hover:text-[color:var(--home-ink)]",
      },
      size: {
        md: "px-6 py-3 text-sm",
        lg: "px-7 py-3.5 text-[0.95rem]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type PublicCTAProps = VariantProps<typeof cta> & {
  children: ReactNode;
  className?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** When set, renders an <a>; otherwise a <button>. */
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  name?: string;
  value?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  "aria-label"?: string;
};

export function PublicCTA({
  children,
  className,
  variant,
  size,
  leadingIcon,
  trailingIcon,
  href,
  target,
  rel,
  type = "button",
  name,
  value,
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: PublicCTAProps) {
  const cls = cn(cta({ variant, size }), className);
  const inner = (
    <>
      {leadingIcon}
      {children}
      {trailingIcon}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cls}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      name={name}
      value={value}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cls}
    >
      {inner}
    </button>
  );
}
