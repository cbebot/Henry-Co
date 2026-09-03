import type { CSSProperties } from "react";
import type { PaymentSurfaceTheme } from "@henryco/payment-surface/types";

/**
 * Studio theme adapter — maps studio CSS variables onto the canonical
 * --payment-* token namespace consumed by @henryco/payment-surface.
 * Studio keeps using its own design system; the surface stays of-a-piece
 * with the rest of the studio app.
 *
 * One definition shared by every studio payment surface
 * (/pay/[paymentId], /payment, /client/payment/[invoiceId]) so the three
 * routes cannot drift apart (Stage 1 payment de-fragmentation).
 */
export const STUDIO_PAYMENT_THEME: PaymentSurfaceTheme = {
  accentVar: "var(--studio-signal, #97f4f3)",
  heroTone: "contrast",
  rootStyle: {
    ["--payment-accent" as never]: "var(--studio-signal, #97f4f3)",
    ["--payment-ink" as never]: "var(--studio-ink, white)",
    ["--payment-soft" as never]: "var(--studio-ink-soft, rgba(255,255,255,0.65))",
    ["--payment-line" as never]: "var(--studio-line, rgba(255,255,255,0.18))",
    ["--payment-surface" as never]: "color-mix(in srgb, var(--studio-surface) 88%, transparent)",
  } as CSSProperties,
};

/**
 * Same tokens, embedded spacing — for payment surfaces rendered inside the
 * client workspace shell, which already owns the page gutter and width.
 * tailwind-merge resolves these against the surface's standalone paddings.
 */
export const STUDIO_PAYMENT_THEME_EMBEDDED: PaymentSurfaceTheme = {
  ...STUDIO_PAYMENT_THEME,
  mainClassName: "max-w-none px-0 py-0 sm:px-0 sm:py-0 lg:px-0",
};
