import type { CSSProperties } from "react";
import type { AppLocale, HubHomeCopy } from "@henryco/i18n";
import type { PublicAccountUser } from "@henryco/ui";
import { LaunchTransitionProvider } from "@henryco/ui/public-shell";
import { LivePublicSiteFooter, ScrollProgress } from "@henryco/ui/public-design";
import type { DivisionRow } from "../lib/divisions";
import type { DivisionLiveStat } from "../lib/division-stats";
import type { HubFooterInputs } from "../lib/site-footer";
import { HomeHeader, HomeSkipLink } from "./home/home-chrome";
import { HomeStandard } from "./home/home-standard";
import { HomeIndex } from "./home/home-index";
import { HomeEcosystem, type HomeEcosystemCopy } from "./home/home-ecosystem";
import { HomeOperatingStandard } from "./home/home-operating-standard";
import { HomeProof } from "./home/home-proof";
import { HomeFaq } from "./home/home-faq";

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
  footer,
  initialDivisions,
  initialFaqs,
  divisionStats,
  copy,
  locale,
  accountChip,
  heroWelcome,
  ecosystemBand,
}: {
  // Prop contract — mirrors app/(site)/page.tsx; keep the two in lockstep.
  brandTitle?: string | null;
  brandSub?: string | null;
  brandAccent?: string | null;
  /** Pre-assembled shared-footer inputs (see lib/site-footer.ts). */
  footer: HubFooterInputs;
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
  /** Pre-translated v3 showcase band copy (see home-ecosystem.tsx). */
  ecosystemBand: HomeEcosystemCopy;
}) {
  const brandTitleSafe = brandTitle?.trim() || "Henry Onyx";
  const accent = brandAccent?.trim() || "#C9A227";
  const rootStyle = { "--accent": accent } as CSSProperties;
  const divisions = initialDivisions ?? [];

  return (
    <LaunchTransitionProvider>
    <div
      id="top"
      style={rootStyle}
      className="relative min-h-screen overflow-x-hidden bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]"
    >
      <HomeSkipLink label={copy.nav.skipToContent} />
      <ScrollProgress />

      <HomeHeader
        brandTitle={brandTitleSafe}
        brandSub={brandSub ?? ""}
        copy={copy}
        accountChip={accountChip}
      />

      <main id="henryco-main" tabIndex={-1}>
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
        <HomeEcosystem copy={ecosystemBand} />
        <HomeOperatingStandard copy={copy} />
        <HomeProof copy={copy} divisions={divisions} divisionStats={divisionStats ?? {}} />
        <HomeFaq copy={copy} faqs={initialFaqs ?? []} />
      </main>

      <LivePublicSiteFooter
        copy={footer.copy}
        columns={footer.columns}
        support={footer.support}
      />
    </div>
    </LaunchTransitionProvider>
  );
}
