import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="care-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "care" }),
        buildWebSiteLd({ key: "care" }),
      ]}
    />
  );
}
