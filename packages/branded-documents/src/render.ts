import "server-only";

import { renderToStream, renderToBuffer } from "@react-pdf/renderer";

import { registerFonts } from "./fonts/index";

type RenderInput = Parameters<typeof renderToStream>[0];

export async function renderDocumentToStream(element: RenderInput) {
  registerFonts();
  return renderToStream(element);
}

export async function renderDocumentToBuffer(element: RenderInput) {
  registerFonts();
  return renderToBuffer(element);
}
