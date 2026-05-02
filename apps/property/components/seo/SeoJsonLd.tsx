import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="property-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "property" }),
        buildWebSiteLd({
          key: "property",
          searchUrlTemplate: "/search?q={search_term_string}",
        }),
      ]}
    />
  );
}
