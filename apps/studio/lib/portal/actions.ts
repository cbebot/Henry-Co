"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { getClientPortalViewer } from "@/lib/portal/auth";
import { clean, koboFromAmount } from "@/lib/portal/helpers";
import { writeStudioLog } from "@/lib/studio/store";

const ALLOWED_PROOF_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

const MAX_PROOF_SIZE = 10 * 1024 * 1024; // 10 MB

type CloudinaryUpload = {
  secure_url: string;
  public_id: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
};

async function uploadProofToCloudinary(file: File, invoiceId: string): Promise<CloudinaryUpload | null> {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  const baseFolder = String(process.env.CLOUDINARY_FOLDER || "henryco/studio").trim();

  if (!cloudName || !apiKey || !apiSecret) return null;

  const folder = `${baseFolder}/payment-proofs/${clean(invoiceId).slice(0, 32) || "unscoped"}`;
  const safeName = clean(file.name)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "proof";
  const publicId = `proof-${Date.now()}-${safeName}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signaturePayload).digest("hex");

  const isImage = String(file.type || "").toLowerCase().startsWith("image/");
  const resourcePath = isImage ? "image/upload" : "raw/upload";

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourcePath}`,
    { method: "POST", body: form }
  );

  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as CloudinaryUpload | null;
  if (!payload?.secure_url || !payload?.public_id) return null;
  return payload;
}

export type PaymentProofResult =
  | { ok: true; paymentId: string; invoiceId: string }
  | {
      ok: false;
      reason:
        | "missing_fields"
        | "invalid_file_type"
        | "file_too_large"
        | "invoice_not_found"
        | "upload_failed"
        | "duplicate_submission"
        | "server_error"
        | "unauthorised";
    };

export async function submitPaymentProofAction(formData: FormData): Promise<PaymentProofResult> {
  const invoiceId = clean(formData.get("invoiceId"));
  const invoiceToken = clean(formData.get("invoiceToken"));
  const paymentReference = clean(formData.get("paymentReference"));
  const notes = clean(formData.get("notes"));
  const proof = formData.get("proof");

  if (!invoiceId || !paymentReference || !(proof instanceof File) || proof.size === 0) {
    return { ok: false, reason: "missing_fields" };
  }

  const mime = String(proof.type || "").toLowerCase();
  if (!ALLOWED_PROOF_MIME.has(mime)) {
    return { ok: false, reason: "invalid_file_type" };
  }

  if (proof.size > MAX_PROOF_SIZE) {
    return { ok: false, reason: "file_too_large" };
  }

  const viewer = await getClientPortalViewer();

  if (!hasAdminSupabaseEnv()) {
    return { ok: false, reason: "server_error" };
  }
  const admin = createAdminSupabase();

  const { data: invoiceRow } = await admin
    .from("studio_invoices")
    .select(
      "id,project_id,client_user_id,normalized_email,invoice_number,amount_kobo,currency,status,invoice_token,milestone_id"
    )
    .eq("id", invoiceId)
    .maybeSingle<Record<string, unknown>>();

  if (!invoiceRow) return { ok: false, reason: "invoice_not_found" };

  const tokenMatches = !!invoiceToken && clean(invoiceRow.invoice_token) === invoiceToken;
  const userMatches =
    !!viewer &&
    (clean(invoiceRow.client_user_id) === viewer.userId ||
      (!!viewer.normalizedEmail && clean(invoiceRow.normalized_email) === viewer.normalizedEmail));

  if (!tokenMatches && !userMatches) {
    return { ok: false, reason: "unauthorised" };
  }

  if (clean(invoiceRow.status) === "paid") {
    return { ok: false, reason: "duplicate_submission" };
  }

  const { data: existingPayments } = await admin
    .from("studio_payments")
    .select("id,payment_reference,status")
    .eq("invoice_id", invoiceId)
    .order("submitted_at", { ascending: false });

  const duplicate = (existingPayments ?? []).find(
    (row) => clean(row.payment_reference) === paymentReference && clean(row.status) !== "rejected"
  );
  if (duplicate) {
    return { ok: false, reason: "duplicate_submission" };
  }

  const upload = await uploadProofToCloudinary(proof, invoiceId);
  if (!upload) return { ok: false, reason: "upload_failed" };

  const paymentId = randomUUID();
  const submittedAt = new Date().toISOString();
  const amountKobo = Number(invoiceRow.amount_kobo) || 0;
  const currency = clean(invoiceRow.currency) || "NGN";
  const projectId = clean(invoiceRow.project_id);
  const milestoneId = clean(invoiceRow.milestone_id) || null;

  const { error: insertError } = await admin.from("studio_payments").insert({
    id: paymentId,
    project_id: projectId,
    milestone_id: milestoneId,
    invoice_id: invoiceId,
    client_user_id: viewer?.userId ?? (clean(invoiceRow.client_user_id) || null),
    normalized_email: viewer?.normalizedEmail ?? (clean(invoiceRow.normalized_email) || null),
    label: clean(invoiceRow.invoice_number) || "Studio invoice",
    amount: Math.round(amountKobo / 100),
    amount_kobo: amountKobo,
    currency,
    status: "submitted",
    method: "bank_transfer",
    payment_method: "bank_transfer",
    payment_reference: paymentReference,
    reference: paymentReference,
    proof_url: upload.secure_url,
    proof_public_id: upload.public_id,
    proof_name: proof.name,
    notes: notes || null,
    submitted_at: submittedAt,
    created_at: submittedAt,
    updated_at: submittedAt,
  } as never);

  if (insertError) {
    return { ok: false, reason: "server_error" };
  }

  await admin
    .from("studio_invoices")
    .update({
      status: "pending_verification",
      updated_at: submittedAt,
    } as never)
    .eq("id", invoiceId);

  await admin.from("studio_project_updates").insert({
    id: randomUUID(),
    project_id: projectId,
    kind: "payment_received",
    update_type: "payment_received",
    author_id: viewer?.userId ?? null,
    title: "Payment proof received",
    summary: `Reference ${paymentReference} submitted for invoice ${clean(invoiceRow.invoice_number)}.`,
    body: notes || null,
    metadata: {
      invoice_id: invoiceId,
      payment_id: paymentId,
      reference: paymentReference,
      amount_kobo: amountKobo,
    },
    created_at: submittedAt,
  } as never);

  await writeStudioLog({
    eventType: "studio_payment_proof_submitted",
    route: "/payment",
    success: true,
    meta: {
      userId: viewer?.userId ?? null,
      email: viewer?.normalizedEmail ?? null,
      role: "client",
    },
    details: { invoice_id: invoiceId, payment_id: paymentId },
  });

  revalidatePath("/client/dashboard");
  revalidatePath("/client/payments");
  revalidatePath(`/client/projects/${projectId}`);

  return { ok: true, paymentId, invoiceId };
}

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "missing_body" | "unauthorised" | "server_error" };

export async function sendProjectMessageAction(formData: FormData): Promise<SendMessageResult> {
  const projectId = clean(formData.get("projectId"));
  const body = clean(formData.get("body"));
  const attachmentsRaw = clean(formData.get("attachments"));

  if (!projectId || !body) return { ok: false, reason: "missing_body" };

  const viewer = await getClientPortalViewer();
  if (!viewer) return { ok: false, reason: "unauthorised" };

  const supabase = await createSupabaseServer();
  const { data: project } = await supabase
    .from("studio_projects")
    .select("id,client_user_id,normalized_email")
    .eq("id", projectId)
    .maybeSingle<Record<string, unknown>>();

  if (!project) return { ok: false, reason: "unauthorised" };

  const owns =
    clean(project.client_user_id) === viewer.userId ||
    (!!viewer.normalizedEmail && clean(project.normalized_email) === viewer.normalizedEmail);
  if (!owns) return { ok: false, reason: "unauthorised" };

  let attachments: Array<{ url: string; name: string; type: string; size: number }> = [];
  if (attachmentsRaw) {
    try {
      const parsed = JSON.parse(attachmentsRaw);
      if (Array.isArray(parsed)) {
        attachments = parsed
          .map((item) => ({
            url: clean((item as { url?: string }).url),
            name: clean((item as { name?: string }).name),
            type: clean((item as { type?: string }).type),
            size: Number((item as { size?: number }).size) || 0,
          }))
          .filter((item) => item.url);
      }
    } catch {
      attachments = [];
    }
  }

  const messageId = randomUUID();
  const createdAt = new Date().toISOString();

  const { error } = await supabase.from("studio_project_messages").insert({
    id: messageId,
    project_id: projectId,
    sender_id: viewer.userId,
    sender: viewer.fullName || viewer.email || "Studio client",
    sender_role: "client",
    body,
    attachments,
    read_by: [viewer.userId],
    is_internal: false,
    created_at: createdAt,
  } as never);

  if (error) return { ok: false, reason: "server_error" };

  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath("/client/messages");
  revalidatePath("/client/dashboard");

  return { ok: true, messageId };
}

export type ApproveDeliverableResult =
  | { ok: true; deliverableId: string }
  | { ok: false; reason: "not_found" | "unauthorised" | "server_error" };

export async function approveDeliverableAction(formData: FormData): Promise<ApproveDeliverableResult> {
  const deliverableId = clean(formData.get("deliverableId"));
  const projectId = clean(formData.get("projectId"));
  if (!deliverableId || !projectId) return { ok: false, reason: "not_found" };

  const viewer = await getClientPortalViewer();
  if (!viewer) return { ok: false, reason: "unauthorised" };

  const supabase = await createSupabaseServer();
  const approvedAt = new Date().toISOString();

  const { error } = await supabase
    .from("studio_deliverables")
    .update({
      status: "approved",
      approved_at: approvedAt,
      approved_by: viewer.userId,
    } as never)
    .eq("id", deliverableId)
    .eq("project_id", projectId);

  if (error) return { ok: false, reason: "server_error" };

  if (hasAdminSupabaseEnv()) {
    const admin = createAdminSupabase();
    await admin.from("studio_project_updates").insert({
      id: randomUUID(),
      project_id: projectId,
      kind: "approval_given",
      update_type: "approval_given",
      author_id: viewer.userId,
      title: "Deliverable approved",
      summary: `Client approved a deliverable.`,
      body: null,
      metadata: { deliverable_id: deliverableId },
      created_at: approvedAt,
    } as never);
  }

  revalidatePath(`/client/projects/${projectId}`);
  revalidatePath("/client/files");
  revalidatePath("/client/dashboard");

  return { ok: true, deliverableId };
}

export type MarkMessagesReadResult = { ok: boolean; count: number };

export async function markProjectMessagesReadAction(
  formData: FormData
): Promise<MarkMessagesReadResult> {
  const projectId = clean(formData.get("projectId"));
  if (!projectId) return { ok: false, count: 0 };

  const viewer = await getClientPortalViewer();
  if (!viewer) return { ok: false, count: 0 };

  if (!hasAdminSupabaseEnv()) return { ok: false, count: 0 };

  const admin = createAdminSupabase();
  const { data: messages } = await admin
    .from("studio_project_messages")
    .select("id,read_by")
    .eq("project_id", projectId)
    .eq("is_internal", false);

  if (!messages || messages.length === 0) return { ok: true, count: 0 };

  let updated = 0;
  for (const message of messages) {
    const readBy = Array.isArray((message as { read_by?: unknown[] }).read_by)
      ? ((message as { read_by: string[] }).read_by ?? []).filter(Boolean)
      : [];
    if (readBy.includes(viewer.userId)) continue;

    await admin
      .from("studio_project_messages")
      .update({ read_by: [...readBy, viewer.userId] } as never)
      .eq("id", (message as { id: string }).id);
    updated += 1;
  }

  if (updated > 0) {
    revalidatePath(`/client/projects/${projectId}`);
    revalidatePath("/client/messages");
  }

  return { ok: true, count: updated };
}

export async function attachMessageFileAction(formData: FormData): Promise<
  | { ok: true; url: string; publicId: string; type: string; name: string; size: number }
  | { ok: false; reason: "no_file" | "upload_failed" | "unauthorised" }
> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, reason: "no_file" };
  }

  const viewer = await getClientPortalViewer();
  if (!viewer) return { ok: false, reason: "unauthorised" };

  const upload = await uploadProofToCloudinary(file, `message-${viewer.userId}`);
  if (!upload) return { ok: false, reason: "upload_failed" };

  // Note: koboFromAmount is referenced to keep the import surface intentional;
  // the helper is also used by callers of this module.
  void koboFromAmount;

  return {
    ok: true,
    url: upload.secure_url,
    publicId: upload.public_id,
    type: file.type || "application/octet-stream",
    name: file.name,
    size: file.size,
  };
}
