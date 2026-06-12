import { HenryCoThemeBlocking } from "../theme/HenryCoThemeBlocking";
import { ThemeProvider } from "../theme/ThemeProvider";
import { FeedbackToastViewport } from "../feedback";

/**
 * Unified theme guard for all public HenryCo pages.
 *
 * Combines three concerns every public surface needs:
 *  1. `HenryCoThemeBlocking` — blocking script that prevents a light/dark flash
 *     before hydration.
 *  2. `ThemeProvider` — next-themes bridge for the HenryCo public theme.
 *  3. `FeedbackToastViewport` — the Henry Onyx action-feedback toast surface
 *     (V3-FEEDBACK-01): any client component or action-result branch calls
 *     `toast.success(...)` from `@henryco/ui/feedback` and this viewport
 *     renders it in the shared toast language (replaces the retired
 *     PublicToastProvider — no provider needed, the bus is module-level).
 *
 * Place once in the root layout `<body>`.
 *
 * If a division already owns a dedicated toast root and wants to keep its
 * surface as the only one visible, pass `includeToasts={false}`.
 */
export function PublicThemeGuard({
  children,
  includeToasts = true,
}: {
  children: React.ReactNode;
  /** Mount the shared HenryCo feedback toast surface. Default `true`. */
  includeToasts?: boolean;
}) {
  return (
    <>
      <HenryCoThemeBlocking />
      <ThemeProvider>
        {children}
        {includeToasts ? <FeedbackToastViewport /> : null}
      </ThemeProvider>
    </>
  );
}
