import { NextResponse } from "next/server";
import { buildLocaleCookieOptions } from "./cookie";
import { normalizeLocale, type AppLocale } from "./locales";

type Body = { locale?: string };

/**
 * Shared POST handler: `{ "locale": "fr" }` → sets `henryco_locale` with optional parent domain.
 */
export async function handleLocalePost(request: Request): Promise<NextResponse> {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = normalizeLocale(body.locale) as AppLocale;
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    "";

  const res = NextResponse.json({ ok: true, locale });
  const o = buildLocaleCookieOptions(locale, host);
  res.cookies.set(o.name, o.value, {
    path: o.path,
    maxAge: o.maxAge,
    sameSite: o.sameSite,
    ...(o.domain ? { domain: o.domain } : {}),
  });

  return res;
}
