import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="learn-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "learn" }),
        buildWebSiteLd({ key: "learn" }),
      ]}
    />
  );
}
