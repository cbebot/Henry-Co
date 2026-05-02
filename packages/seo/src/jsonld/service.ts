import { getDivisionConfig, getDivisionUrl, type DivisionKey } from "@henryco/config";
import type { JsonLdNode } from "./base";

export type ServiceOptions = {
  key: DivisionKey;
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string[];
  url: string;
};

export function buildServiceLd(opts: ServiceOptions): JsonLdNode {
  const division = getDivisionConfig(opts.key);
  const divisionUrl = getDivisionUrl(opts.key);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType,
    url: opts.url,
    areaServed: opts.areaServed?.length
      ? opts.areaServed.map((region) => ({
          "@type": "AdministrativeArea",
          name: region,
        }))
      : undefined,
    provider: {
      "@type": "Organization",
      "@id": `${divisionUrl}#organization`,
      name: division.name,
      url: divisionUrl,
    },
  };
}
