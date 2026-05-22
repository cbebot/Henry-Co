import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { loadOwnerReconcileTrace } from "@/lib/owner-reconcile-trace";
import { getHubPublicLocale } from "@/lib/locale-server";
import { autoTranslate } from "@/lib/i18n/auto-translate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * V3 PASS 21 / H5 — owner metric trace resolver endpoint.
 *
 * Every metric card on the Track B owner workspace declares a stable
 * `traceId`. The MetricTraceDrawer client calls this endpoint with
 * `?id=<traceId>` and renders the underlying SQL filter + result
 * sample + execution timestamp + caveat.
 *
 * Owner-only RLS is enforced at the route layer (`requireOwner()`).
 * The resolver itself uses the admin client (SECURITY DEFINER style)
 * — the route is the chokepoint.
 */
export async function GET(request: Request) {
  const locale = await getHubPublicLocale();
  const tx = (s: string) => autoTranslate(s, locale);

  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const url = new URL(request.url);
  const traceId = (url.searchParams.get("id") || "").trim();
  if (!traceId) {
    return NextResponse.json({ error: await tx("trace id is required.") }, { status: 400 });
  }

  const trace = await loadOwnerReconcileTrace(traceId);
  if (!trace) {
    return NextResponse.json({ error: await tx("Trace not found."), id: traceId }, { status: 404 });
  }

  return NextResponse.json({ trace });
}
