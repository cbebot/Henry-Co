import { HenryCoThemeBlocking } from "../theme/HenryCoThemeBlocking";
import { ThemeProvider } from "../theme/ThemeProvider";

/**
 * Unified theme guard for all public HenryCo pages.
 * Combines the blocking script (no-flash) with the ThemeProvider (next-themes).
 * Place once in the root layout <body>.
 */
export function PublicThemeGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HenryCoThemeBlocking />
      <ThemeProvider>{children}</ThemeProvider>
    </>
  );
}
