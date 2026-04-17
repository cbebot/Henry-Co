import { handleLocalePost } from "@henryco/i18n/locale-route";

export async function POST(request: Request) {
  return handleLocalePost(request);
}
