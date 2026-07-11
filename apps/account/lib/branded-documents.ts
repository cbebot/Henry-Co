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
 * Wrap a @react-pdf React element into a streaming Response. We never
 * buffer the full PDF in memory — `renderDocumentToStream` returns a
 * Node ReadableStream that we hand directly to the Web Response.
 *
 * For Vercel + Next.js 16, NodeJS ReadableStream is acceptable as a
 * Response body when the route is configured for the Node runtime
 * (which is the project default for /api routes that touch
 * `server-only` modules).
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
  /** When true, force the browser to prompt a download instead of inline preview. */
  download?: boolean;
}) {
  const stream = await renderDocumentToStream(element);
  const filename = buildDocumentFilename(type, id);

  // Convert Node ReadableStream → Web ReadableStream so it slots into Response.
  // Node 18+ exposes this conversion natively via stream/web Readable.toWeb,
  // but @react-pdf already returns a Node-native readable. We adapt with a
  // hand-rolled bridge so we don't pull in the toWeb helper (which has had
  // edge-runtime quirks in the past).
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on("end", () => controller.close());
      stream.on("error", (err: unknown) => controller.error(err));
    },
    cancel() {
      // Best-effort: tell @react-pdf to stop rendering if the client aborts.
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
