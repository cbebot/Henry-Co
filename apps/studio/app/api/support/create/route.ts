import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioAccountUrl } from "@/lib/studio/links";
import { createSupportThread } from "@/lib/studio/shared-account";

export const runtime = "nodejs";

/**
 * V3-ACTIONS-01 — dual-mode: async submissions (x-henryco-async / Accept:
 * application/json) get JSON so the page acknowledges in place; native posts
 * keep the redirect (303 so the browser switches to GET — a 307 re-POSTs to
 * the destination page and Next throws "Failed to find Server Action").
 */
function wantsJson(request: Request) {
  return (
    request.headers.get("x-henryco-async") === "1" ||
    (request.headers.get("accept") || "").includes("application/json")
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") || getStudioAccountUrl());
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const category = String(formData.get("category") || "general").trim();
  const priority = String(formData.get("priority") || "normal").trim();
  const referenceType = String(formData.get("referenceType") || "").trim() || null;
  const referenceId = String(formData.get("referenceId") || "").trim() || null;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (wantsJson(request)) {
      return NextResponse.json(
        { ok: false, error: "Sign in to continue.", code: "auth_required" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  }

  if (!subject || !body) {
    if (wantsJson(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "A subject and a message are required.",
          code: "missing-fields",
        },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  }

  await createSupportThread({
    userId: user.id,
    subject,
    category,
    priority,
    referenceType,
    referenceId,
    initialMessage: body,
    senderId: user.id,
    senderType: "customer",
  });

  if (wantsJson(request)) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.redirect(new URL(redirectTo, request.url), 303);
}
