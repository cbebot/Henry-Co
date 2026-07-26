import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
import { HenryCoLockup } from "@henryco/ui/brand";
import { fraunces, manrope, STUDIO_PUBLIC_THEME_STYLE } from "@/components/studio/studio-public-theme";
import { getStudioPublicLocale } from "@/lib/locale-server";

/**
 * Themed shell for the focused brief flow (/request, /request/build,
 * /request/copilot, /request/guided) — V3-PUBLIC-REBUILD-studio.
 *
 * Adopts the locked --home-* design system + Fraunces + the Studio teal accent
 * so the composer reads as the same family as the marketing pages. The flow
 * stays deliberately distraction-light — but distraction-light must never mean
 * STRANDED (owner directive, 2026-07-08): a checkout-style FOCUS HEADER gives
 * exactly two ways out and nothing else — the brand mark home, and one quiet
 * return link. No nav, no search, no account chrome; the brief keeps the room.
 * The flow's logic, steps, validation, pricing, and submit are untouched.
 */
export default async function RequestLayout({ children }: { children: React.ReactNode }) {
  const locale = await getStudioPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} studio-public min-h-screen bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={STUDIO_PUBLIC_THEME_STYLE}
    >
      <header className="sticky top-0 z-40 border-b border-[color:var(--home-line)] bg-[color:var(--home-canvas)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label={t("Henry Onyx Studio home")}
            className="inline-flex items-center text-[color:var(--home-ink)] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
          >
            <HenryCoLockup height={22} accent="var(--accent, #4AC1C5)" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--home-ink-soft,var(--home-ink))] transition-colors hover:text-[color:var(--home-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t("Back to Studio")}
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
