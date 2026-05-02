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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#organization`,
    name: division.name,
    legalName:
      opts.key === "hub" ? COMPANY.group.legalName : `${COMPANY.group.legalName} — ${division.shortName}`,
    description: division.description,
    url,
    logo: opts.logoUrl,
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
