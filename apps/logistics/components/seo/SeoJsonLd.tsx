import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="logistics-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "logistics" }),
        buildWebSiteLd({ key: "logistics" }),
      ]}
    />
  );
}
