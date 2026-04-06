import Link from "next/link";
import * as React from "react";
import { cn } from "../lib/cn";
import { ButtonPendingContent } from "../loading/ButtonPendingContent";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-[#C9A227] to-[#E8C24F] text-[#07111F] shadow-[0_18px_60px_rgba(201,162,39,0.28)] hover:brightness-105",
  secondary:
    "border border-black/10 bg-white/80 text-zinc-900 hover:bg-white dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
  ghost:
    "text-zinc-700 hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/8",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm rounded-2xl",
  md: "h-12 px-5 text-sm rounded-2xl",
  lg: "h-14 px-7 text-base rounded-3xl",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  pending?: boolean;
  pendingLabel?: React.ReactNode;
  spinnerLabel?: string;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export function PublicButton(props: ButtonProps | LinkProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  const className = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30",
    VARIANTS[variant],
    SIZES[size],
    props.className
  );

  if ("href" in props && props.href) {
    const { href, children, className: _className, ...rest } = props;
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  const {
    children,
    className: _className,
    pending,
    pendingLabel,
    spinnerLabel,
    disabled,
    ...rest
  } = props as ButtonProps;

  return (
    <button
      className={cn(className, pending && "cursor-wait")}
      disabled={disabled || pending}
      data-pending={pending ? "true" : undefined}
      {...rest}
    >
      <ButtonPendingContent
        pending={Boolean(pending)}
        pendingLabel={pendingLabel}
        spinnerLabel={spinnerLabel}
      >
        {children}
      </ButtonPendingContent>
    </button>
  );
}
