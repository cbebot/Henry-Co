import { renderJsonLd, type JsonLdNode } from "../jsonld/base";

export type JsonLdProps = {
  data: JsonLdNode | JsonLdNode[];
  id?: string;
};

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: renderJsonLd(data) }}
    />
  );
}
