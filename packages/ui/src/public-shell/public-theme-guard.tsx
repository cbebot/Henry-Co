import { HenryCoThemeBlocking } from "../theme/HenryCoThemeBlocking";
import { ThemeProvider } from "../theme/ThemeProvider";
import { PublicToastProvider } from "./public-toast";

/**
 * Unified theme guard for all public HenryCo pages.
 *
 * Combines three concerns every public surface needs:
 *  1. `HenryCoThemeBlocking` — blocking script that prevents a light/dark flash
 *     before hydration.
 *  2. `ThemeProvider` — next-themes bridge for the HenryCo public theme.
 *  3. `PublicToastProvider` — shared, safe-area-aware toast surface that shared
 *     primitives (forms, CTAs, copy helpers) can emit on. Division-specific
 *     toasters keep operating independently — this is an additive shared layer.
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
  /** Mount the shared HenryCo public toast surface. Default `true`. */
  includeToasts?: boolean;
}) {
  const body = includeToasts ? (
    <PublicToastProvider>{children}</PublicToastProvider>
  ) : (
    children
  );

  return (
    <>
      <HenryCoThemeBlocking />
      <ThemeProvider>{body}</ThemeProvider>
    </>
  );
}
