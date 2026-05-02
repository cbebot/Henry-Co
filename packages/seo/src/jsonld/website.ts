import { getDivisionConfig, getDivisionUrl, type DivisionKey } from "@henryco/config";
import type { JsonLdNode } from "./base";

export type WebSiteOptions = {
  key: DivisionKey;
  searchUrlTemplate?: string;
};

export function buildWebSiteLd(opts: WebSiteOptions): JsonLdNode {
  const division = getDivisionConfig(opts.key);
  const url = getDivisionUrl(opts.key);
  const searchAction = opts.searchUrlTemplate
    ? {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: new URL(opts.searchUrlTemplate, url).toString(),
        },
        "query-input": "required name=search_term_string",
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    name: division.name,
    description: division.description,
    url,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      "@id": `${url}#organization`,
    },
    potentialAction: searchAction,
  };
}
