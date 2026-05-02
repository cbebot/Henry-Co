import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="marketplace-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "marketplace" }),
        buildWebSiteLd({
          key: "marketplace",
          searchUrlTemplate: "/search?q={search_term_string}",
        }),
      ]}
    />
  );
}
