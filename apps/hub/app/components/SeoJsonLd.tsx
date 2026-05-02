import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="hub-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "hub" }),
        buildWebSiteLd({
          key: "hub",
          searchUrlTemplate: "/search?q={search_term_string}",
        }),
      ]}
    />
  );
}
