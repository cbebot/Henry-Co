import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="studio-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "studio" }),
        buildWebSiteLd({ key: "studio" }),
      ]}
    />
  );
}
