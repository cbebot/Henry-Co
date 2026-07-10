import { COMPANY } from "@henryco/config";
import type { HubPublicCopy } from "@henryco/i18n";
import type {
  PublicSiteFooterCopy,
  SiteFooterColumn,
} from "@henryco/ui/public-design";

/**
 * Assemble the shared PublicSiteFooter inputs from the hub's existing (and
 * brand-corrected) i18n. ONE builder feeds BOTH the homepage and the inner-route
 * shell, so the closing footer is identical everywhere on the hub.
 *
 * Every label is reused from already-translated copy (zero new i18n keys); the
 * division links, legal entity, and brand name come straight from
 * `@henryco/config` inside PublicSiteFooter itself. The statement prefers the
 * CMS-authored blurb, falling back to the translated brand description.
 */
export type HubFooterInputs = {
  copy: PublicSiteFooterCopy;
  columns: SiteFooterColumn[];
  // NUMBER-PURGE (2026-07-10): support carries EMAIL only. The phone digits
  // must never enter this object — even unrendered, they serialize into the
  // RSC/HTML payload and Google indexes them (the exact leak the shared-footer
  // sweep in PR #463 closed elsewhere but missed here). WhatsApp is reached via
  // getSupportWhatsAppHref() (masked wa.me), never a printed number.
  support: { email: string | null };
};

export function buildHubFooter(
  hubCopy: HubPublicCopy,
  opts?: {
    statement?: string | null;
    support?: { email?: string | null };
  },
): HubFooterInputs {
  const shell = hubCopy.publicSiteShell;
  const footer = hubCopy.footer;

  return {
    copy: {
      statement: opts?.statement?.trim() || footer.description,
      divisionsLabel: shell.menuDivisionsDirectory,
      rightsReserved: footer.allRightsReserved,
      attribution: footer.builtBy,
    },
    columns: [
      {
        title: shell.colCompany,
        links: [
          { label: shell.linkAbout, href: "/about" },
          { label: shell.linkContact, href: "/contact" },
          { label: shell.linkSearch, href: "/search" },
          // V3 showcase surfaces (V3-96 S2.3: the Earning Map is linked from
          // the footer). Labels reuse the already-translated v3 eyebrows —
          // zero new i18n keys, consistent with this builder's contract.
          { label: hubCopy.v3.story.eyebrow, href: "/v3" },
          { label: hubCopy.v3.earn.eyebrow, href: "/v3/how-we-earn" },
          { label: hubCopy.v3.press.eyebrow, href: "/press/v3" },
        ],
      },
      {
        title: shell.colLegal,
        links: [
          { label: shell.linkPrivacy, href: "/privacy" },
          { label: shell.linkTerms, href: "/terms" },
        ],
      },
    ],
    support: {
      email: opts?.support?.email ?? COMPANY.group.supportEmail,
    },
  };
}
