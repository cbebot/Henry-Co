import "server-only";

import {
  attachmentDispositionHeader,
  contentDispositionHeader,
  buildDocumentFilename,
  type DocumentType,
} from "@henryco/branded-documents/filename";
import { renderDocumentToStream } from "@henryco/branded-documents/render";

type RenderInput = Parameters<typeof renderDocumentToStream>[0];

export async function streamPdfResponse({
  element,
  type,
  id,
  download,
}: {
  element: RenderInput;
  type: DocumentType;
  id: string;
  download?: boolean;
}) {
  const stream = await renderDocumentToStream(element);
  const filename = buildDocumentFilename(type, id);

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on("end", () => controller.close());
      stream.on("error", (err: unknown) => controller.error(err));
    },
    cancel() {
      (stream as unknown as { destroy?: () => void }).destroy?.();
    },
  });

  return new Response(webStream as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": download
        ? attachmentDispositionHeader(filename)
        : contentDispositionHeader(filename),
      // Certificates are public artefacts. Cache for 30 minutes at the edge so
      // verification clicks don't repeat-render the same PDF, but not so long
      // that a revocation would linger.
      "Cache-Control": "public, max-age=300, s-maxage=1800",
      "X-HenryCo-Document": type,
    },
  });
}
