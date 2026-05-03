import {
  COMPANY,
  getDivisionConfig,
  getDivisionUrl,
  type DivisionKey,
} from "@henryco/config";
import type { JsonLdNode } from "./base";

export type OrganizationOptions = {
  key: DivisionKey;
  logoUrl?: string;
  sameAs?: string[];
};

export function buildOrganizationLd(opts: OrganizationOptions): JsonLdNode {
  const division = getDivisionConfig(opts.key);
  const url = getDivisionUrl(opts.key);
  // Fall back to the platform-served brand monogram so Google Knowledge
  // Panels and rich results always have a logo, even before a CMS-provided
  // override exists. The asset ships in every app's public/brand/ dir.
  const logo = opts.logoUrl || `${url}/brand/monogram.svg`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: division.name,
    legalName:
      opts.key === "hub" ? COMPANY.group.legalName : `${COMPANY.group.legalName} — ${division.shortName}`,
    description: division.description,
    url,
    logo,
    email: division.supportEmail,
    telephone: division.supportPhone,
    sameAs: opts.sameAs,
    parentOrganization:
      opts.key === "hub"
        ? undefined
        : {
            "@type": "Organization",
            "@id": `https://${COMPANY.group.baseDomain}#organization`,
            name: COMPANY.group.legalName,
            url: `https://${COMPANY.group.baseDomain}`,
          },
  };
}
