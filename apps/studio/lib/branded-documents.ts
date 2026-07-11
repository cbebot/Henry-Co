import "server-only";

import {
  attachmentDispositionHeader,
  contentDispositionHeader,
  buildDocumentFilename,
  type DocumentType,
} from "@henryco/branded-documents/filename";
import { renderDocumentToStream } from "@henryco/branded-documents/render";

type RenderInput = Parameters<typeof renderDocumentToStream>[0];

/**
 * Streams a @react-pdf React element to a Web Response without buffering
 * the full PDF in memory.
 *
 * For Vercel + Next.js 16, NodeJS ReadableStream is acceptable as a
 * Response body when the route is configured for the Node runtime
 * (the default for /api routes that touch `server-only` modules).
 */
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
      stream.on("data", (chunk: Buffer) =>
        controller.enqueue(new Uint8Array(chunk)),
      );
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
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      "X-HenryCo-Document": type,
    },
  });
}
