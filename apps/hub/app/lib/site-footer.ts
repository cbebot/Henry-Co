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
  support: { email: string | null; phone: string | null };
};

export function buildHubFooter(
  hubCopy: HubPublicCopy,
  opts?: {
    statement?: string | null;
    support?: { email?: string | null; phone?: string | null };
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
      phone: opts?.support?.phone ?? COMPANY.group.supportPhone,
    },
  };
}
