import type { CSSProperties } from "react";
import type { AppLocale, HubHomeCopy } from "@henryco/i18n";
import type { PublicAccountUser } from "@henryco/ui";
import type { DivisionRow } from "../lib/divisions";
import type { DivisionLiveStat } from "../lib/division-stats";
import { HomeHeader, HomeSkipLink } from "./home/home-chrome";
import { HomeStandard } from "./home/home-standard";
import { HomeIndex } from "./home/home-index";
import { HomeOperatingStandard } from "./home/home-operating-standard";
import { HomeProof } from "./home/home-proof";
import { HomeFooter } from "./home/home-footer";

/**
 * HubHomeClient — the company homepage's thin orchestrator.
 *
 * A server-component shell: it owns the always-dark canvas, the `--accent`
 * custom property, and the landmark scaffold (skip link → header → <main> →
 * footer), then composes self-contained client islands. Each editorial section
 * is its own component; the shell ships no client JS of its own.
 *
 * The section ids (`standard`, `engines`, `standard-why`, …) are the anchor and
 * scroll-spy targets the header navigates between, so they must stay in sync
 * with SPY_IDS in home-chrome.tsx.
 */
export default function HubHomeClient({
  brandTitle,
  brandSub,
  brandAccent,
  brandLogoUrl,
  brandFooterBlurb,
  initialDivisions,
  divisionStats,
  copy,
  locale,
  accountChip,
  heroWelcome,
}: {
  // 14-prop contract — mirrors app/(site)/page.tsx; do not change shape.
  brandTitle?: string | null;
  brandSub?: string | null;
  brandAccent?: string | null;
  brandLogoUrl?: string | null;
  brandFooterBlurb?: string | null;
  intro?: string | null;
  initialDivisions?: DivisionRow[];
  initialFaqs?: Array<{ question?: string | null; answer?: string | null }>;
  divisionStats?: Record<string, DivisionLiveStat>;
  hasServerError?: boolean;
  copy: HubHomeCopy;
  locale: AppLocale;
  accountChip?: {
    user: PublicAccountUser | null;
    loginHref: string;
    signupHref: string;
    accountHref: string;
  };
  /** Subtle signed-in hero line (first name). */
  heroWelcome?: string | null;
}) {
  const brandTitleSafe = brandTitle?.trim() || "Henry & Co.";
  const accent = brandAccent?.trim() || "#C9A227";
  const rootStyle = { "--accent": accent } as CSSProperties;
  const divisions = initialDivisions ?? [];

  return (
    <div
      id="top"
      style={rootStyle}
      className="relative min-h-screen overflow-x-hidden bg-[#050816] text-white"
    >
      <HomeSkipLink label={copy.nav.skipToContent} />

      <HomeHeader
        brandTitle={brandTitleSafe}
        brandSub={brandSub ?? ""}
        brandLogoUrl={brandLogoUrl ?? null}
        copy={copy}
        accountChip={accountChip}
      />

      <main id="henryco-main" tabIndex={-1}>
        {/* Editorial sections land here, stage by stage. Empty bordered blocks
            for now — sized so anchor links and scroll-spy resolve. */}
        <HomeStandard
          copy={copy}
          locale={locale}
          divisions={divisions}
          divisionStats={divisionStats ?? {}}
          heroWelcome={heroWelcome ?? null}
          accent={accent}
        />
        <HomeIndex
          copy={copy}
          divisions={divisions}
          divisionStats={divisionStats ?? {}}
        />
        <HomeOperatingStandard copy={copy} />
        <HomeProof copy={copy} divisions={divisions} divisionStats={divisionStats ?? {}} />
        <section id="questions" className="min-h-[70vh] scroll-mt-24" />
      </main>

      <HomeFooter
        brandTitle={brandTitleSafe}
        brandFooterBlurb={brandFooterBlurb ?? null}
        divisions={divisions}
        copy={copy}
      />
    </div>
  );
}
