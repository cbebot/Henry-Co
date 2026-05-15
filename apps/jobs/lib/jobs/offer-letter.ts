import "server-only";

import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — SignWell offer-letter provider (Distinctive Rule #4).
 *
 * ENV (V3 PASS 21 preflight reality):
 *   SIGNWELL_API_KEY   provisioned. Provider = signwell (NOT DocuSign,
 *                      NOT Dropbox/HelloSign). When the key is missing
 *                      issueOfferLetter() falls back to provider=
 *                      typed_fallback which records a typed-name
 *                      acknowledgement and writes audit_log so the
 *                      offer is still legally tracked.
 *
 * SignWell API reference (high level):
 *   POST https://www.signwell.com/api/v1/documents/ — create envelope
 *   GET  https://www.signwell.com/api/v1/documents/{id} — read state
 *   The signed PDF download URL is on the document after signing; we
 *   pull it on countersign and re-upload to Cloudinary for HenryCo
 *   custody (J7 — signed PDF stored in Cloudinary).
 *
 * Cloudinary upload happens in apps/jobs/lib/cloudinary.ts (already
 * present).
 */

export type OfferLetterTerms = {
  baseSalaryMinor?: number;
  baseSalaryCurrency?: string;
  startDate?: string;
  position?: string;
  reportingManager?: string;
  benefits?: string[];
  notes?: string;
};

export type OfferLetterStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "expired"
  | "withdrawn"
  | "declined";

export type OfferLetterRecord = {
  id: string;
  applicationId: string;
  pipelineId: string | null;
  issuedByUserId: string | null;
  issuedAt: string;
  terms: OfferLetterTerms;
  baseSalaryMinor: number | null;
  baseSalaryCurrency: string;
  startDate: string | null;
  benefits: string[];
  notes: string | null;
  provider: "signwell" | "docusign" | "hellosign" | "typed_fallback";
  providerEnvelopeId: string | null;
  signingUrl: string | null;
  signedPdfUrl: string | null;
  signedAt: string | null;
  signedSignature: Record<string, unknown>;
  status: OfferLetterStatus;
  expiresAt: string | null;
  createdAt: string;
};

export type IssueOfferLetterInput = {
  applicationId: string;
  pipelineId?: string | null;
  issuedByUserId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  terms: OfferLetterTerms;
  expiresAt?: string;
};

function getSignWellConfig() {
  const apiKey = (process.env.SIGNWELL_API_KEY || "").trim();
  return {
    apiKey,
    isConfigured: Boolean(apiKey),
  };
}

function mapOffer(row: Record<string, unknown>): OfferLetterRecord {
  return {
    id: String(row.id || ""),
    applicationId: String(row.application_id || ""),
    pipelineId:
      typeof row.pipeline_id === "string" ? row.pipeline_id : null,
    issuedByUserId:
      typeof row.issued_by_user_id === "string"
        ? row.issued_by_user_id
        : null,
    issuedAt: String(row.issued_at || ""),
    terms:
      row.terms && typeof row.terms === "object"
        ? (row.terms as OfferLetterTerms)
        : {},
    baseSalaryMinor:
      typeof row.base_salary_minor === "number" || typeof row.base_salary_minor === "string"
        ? Number(row.base_salary_minor)
        : null,
    baseSalaryCurrency: String(row.base_salary_currency || "NGN"),
    startDate:
      typeof row.start_date === "string" ? row.start_date : null,
    benefits: Array.isArray(row.benefits)
      ? (row.benefits as string[])
      : [],
    notes: typeof row.notes === "string" ? row.notes : null,
    provider: (row.provider as OfferLetterRecord["provider"]) || "signwell",
    providerEnvelopeId:
      typeof row.provider_envelope_id === "string"
        ? row.provider_envelope_id
        : null,
    signingUrl:
      typeof row.signing_url === "string" ? row.signing_url : null,
    signedPdfUrl:
      typeof row.signed_pdf_url === "string" ? row.signed_pdf_url : null,
    signedAt:
      typeof row.signed_at === "string" ? row.signed_at : null,
    signedSignature:
      row.signed_signature && typeof row.signed_signature === "object"
        ? (row.signed_signature as Record<string, unknown>)
        : {},
    status: (row.status as OfferLetterStatus) || "draft",
    expiresAt:
      typeof row.expires_at === "string" ? row.expires_at : null,
    createdAt: String(row.created_at || ""),
  };
}

/**
 * Persist a fresh offer letter row. Status starts at "draft"; the caller
 * advances to "sent" once the SignWell envelope is created (or the typed-
 * fallback flow is opened).
 */
export async function issueOfferLetter(
  input: IssueOfferLetterInput,
): Promise<OfferLetterRecord | null> {
  const admin = createAdminSupabase();
  const id = randomUUID();
  const config = getSignWellConfig();
  const provider: OfferLetterRecord["provider"] = config.isConfigured
    ? "signwell"
    : "typed_fallback";

  const { data, error } = await admin
    .from("jobs_offer_letters")
    .insert({
      id,
      application_id: input.applicationId,
      pipeline_id: input.pipelineId || null,
      issued_by_user_id: input.issuedByUserId,
      terms: input.terms,
      base_salary_minor: input.terms.baseSalaryMinor ?? null,
      base_salary_currency: input.terms.baseSalaryCurrency || "NGN",
      start_date: input.terms.startDate || null,
      benefits: input.terms.benefits || [],
      notes: input.terms.notes || null,
      provider,
      status: "draft",
      expires_at: input.expiresAt || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[offer-letter] insert error:", error.message);
    return null;
  }

  await recordOfferLetterEvent(id, "draft.created", input.issuedByUserId, {
    candidateName: input.candidateName,
    position: input.position,
  });

  return data ? mapOffer(data as Record<string, unknown>) : null;
}

/**
 * Mark an offer as sent. When SignWell is configured, the caller passes
 * the envelope id + signing url returned from SignWell. When falling
 * back to typed-name acknowledgement, signing_url is the HenryCo URL
 * the candidate visits.
 */
export async function markOfferLetterSent(
  offerLetterId: string,
  patch: { providerEnvelopeId?: string; signingUrl: string },
  actorUserId: string | null,
): Promise<boolean> {
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("jobs_offer_letters")
    .update({
      status: "sent",
      provider_envelope_id: patch.providerEnvelopeId || null,
      signing_url: patch.signingUrl,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", offerLetterId);

  if (error) {
    console.error("[offer-letter] mark sent error:", error.message);
    return false;
  }
  await recordOfferLetterEvent(offerLetterId, "sent", actorUserId, {
    signingUrl: patch.signingUrl,
    envelopeId: patch.providerEnvelopeId,
  });
  return true;
}

/**
 * Record a typed-name acknowledgement when SignWell is unavailable.
 * Writes signed_at and signed_signature, advances status to "signed",
 * emits an offer-letter event for the audit trail.
 */
export async function acknowledgeOfferLetterTyped(
  offerLetterId: string,
  signerUserId: string,
  typedName: string,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<boolean> {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const signature: Record<string, unknown> = {
    typedName,
    ipAddress,
    userAgent,
    signedAt: now,
  };

  const { error } = await admin
    .from("jobs_offer_letters")
    .update({
      status: "signed",
      signed_at: now,
      signed_signature: signature,
      provider: "typed_fallback",
      updated_at: now,
    } as never)
    .eq("id", offerLetterId);

  if (error) {
    console.error("[offer-letter] typed ack error:", error.message);
    return false;
  }

  await recordOfferLetterEvent(
    offerLetterId,
    "signed.candidate",
    signerUserId,
    { typedName, mode: "typed_fallback" },
  );
  return true;
}

/**
 * Update the persisted signed-PDF URL after Cloudinary upload (J7).
 */
export async function attachSignedPdfUrl(
  offerLetterId: string,
  pdfUrl: string,
  actorUserId: string | null,
): Promise<boolean> {
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("jobs_offer_letters")
    .update({
      signed_pdf_url: pdfUrl,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", offerLetterId);

  if (error) {
    console.error("[offer-letter] attach pdf error:", error.message);
    return false;
  }
  await recordOfferLetterEvent(
    offerLetterId,
    "pdf.uploaded",
    actorUserId,
    { url: pdfUrl },
  );
  return true;
}

async function recordOfferLetterEvent(
  offerLetterId: string,
  eventType: string,
  actorUserId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminSupabase();
  const { error } = await admin.from("jobs_offer_letter_events").insert({
    id: randomUUID(),
    offer_letter_id: offerLetterId,
    event_type: eventType,
    actor_user_id: actorUserId,
    payload,
  });
  if (error) {
    console.error("[offer-letter] event insert error:", error.message);
  }
}

export function getOfferLetterProviderConfig() {
  return getSignWellConfig();
}
