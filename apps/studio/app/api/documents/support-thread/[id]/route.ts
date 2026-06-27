import { NextResponse, type NextRequest } from "next/server";
import {
  SupportThreadExportDocument,
  type SupportMessage,
} from "@henryco/branded-documents";

import { requireStudioRoles } from "@/lib/studio/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { streamPdfResponse } from "@/lib/branded-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export async function GET(request: NextRequest, ctx: RouteParams) {
  // Auth guard — redirects to /account if the viewer lacks the support
  // roles. We don't need the viewer object here; the redirect side-effect
  // is enough to lock the endpoint down.
  await requireStudioRoles(["studio_owner", "client_success"]);
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing thread id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const wantsDownload = url.searchParams.get("download") === "1";

  const admin = createAdminSupabase();
  // STU-1 — `support_threads` is a SHARED cross-division table keyed by id
  // only. Pin `division = "studio"` (STRICT) so a studio staffer can never
  // export another division's thread PII. A non-studio (or NULL-division)
  // row returns 404 — NOT 403 — so the endpoint isn't an existence oracle.
  const { data: thread } = await admin
    .from("support_threads")
    .select(
      "id, user_id, subject, division, status, created_at, updated_at, reference_id, category",
    )
    .eq("id", id)
    .eq("division", "studio")
    .maybeSingle();
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const { data: messages } = await admin
    .from("support_messages")
    .select("id, sender_type, sender_id, body, attachments, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  // Resolve a friendly customer label from customer_profiles. Falls back
  // to the user_id stub when the row is missing or we have no email.
  let customerName = "Customer";
  let customerEmail: string | null = null;
  if (thread.user_id) {
    const { data: profile } = await admin
      .from("customer_profiles")
      .select("full_name, email")
      .eq("id", thread.user_id)
      .maybeSingle<{ full_name: string | null; email: string | null }>();
    customerName = (profile?.full_name || "").trim() || "Customer";
    customerEmail = profile?.email || null;
  }

  const mapped: SupportMessage[] = (messages || []).map((row) => {
    const raw = row as Record<string, unknown>;
    const senderType = asString(raw.sender_type);
    const isCustomer = senderType === "customer";
    return {
      id: asString(raw.id),
      senderType: isCustomer
        ? "customer"
        : senderType === "system"
          ? "system"
          : "agent",
      senderName: isCustomer
        ? customerName
        : senderType === "system"
          ? "Henry Onyx"
          : "Henry Onyx Studio",
      body: asString(raw.body),
      createdAt: asString(raw.created_at, new Date().toISOString()),
      attachments: Array.isArray(raw.attachments)
        ? (raw.attachments as Array<Record<string, unknown>>).map((a) => ({
            name: asString(a.name) || "attachment",
            mimeType: asString(a.mime_type) || asString(a.mimeType) || null,
          }))
        : [],
    };
  });

  const subject = asString(thread.subject) || "Studio support thread";
  const division = asString(thread.division) || "studio";

  const element = SupportThreadExportDocument({
    thread: {
      id: asString(thread.id),
      referenceNo: asString(thread.reference_id) || asString(thread.id).slice(0, 8),
      subject,
      division,
      status: asString(thread.status) || "open",
      openedAt: asString(thread.created_at, new Date().toISOString()),
      lastUpdatedAt:
        asString(thread.updated_at) ||
        asString(thread.created_at, new Date().toISOString()),
    },
    customer: { name: customerName, email: customerEmail },
    messages: mapped,
  });

  return streamPdfResponse({
    element,
    type: "SupportThread",
    id,
    download: wantsDownload,
  });
}
