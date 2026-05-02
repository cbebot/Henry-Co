import {
  JsonLd,
  buildOrganizationLd,
  buildWebSiteLd,
} from "@henryco/seo";

export function SeoJsonLd() {
  return (
    <JsonLd
      id="jobs-seo-jsonld"
      data={[
        buildOrganizationLd({ key: "jobs" }),
        buildWebSiteLd({
          key: "jobs",
          searchUrlTemplate: "/jobs?q={search_term_string}",
        }),
      ]}
    />
  );
}
