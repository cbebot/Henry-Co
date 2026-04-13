import "server-only";

import { createStaffAdminSupabase } from "@/lib/supabase/admin";

function toText(value: unknown) {
  return String(value ?? "").trim();
}

export type KycSubmission = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  fileUrl: string | null;
};

export type KycQueueSummary = {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  queue: KycSubmission[];
};

export async function getKycQueue(): Promise<KycQueueSummary> {
  const admin = createStaffAdminSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [pendingRes, reviewedTodayRes] = await Promise.all([
    admin
      .from("customer_verification_submissions")
      .select("id, user_id, document_type, status, submitted_at, reviewed_at, document_id")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(50),
    admin
      .from("customer_verification_submissions")
      .select("id, status")
      .neq("status", "pending")
      .gte("reviewed_at", todayIso)
      .limit(200),
  ]);

  const pending = (pendingRes.data ?? []) as Array<Record<string, unknown>>;
  const reviewedToday = (reviewedTodayRes.data ?? []) as Array<Record<string, unknown>>;

  // Resolve user info.
  const userIds = [...new Set(pending.map((r) => toText(r.user_id)))].filter(Boolean);
  const { data: profiles } = userIds.length
    ? await admin.from("customer_profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as Array<Record<string, unknown>> };

  const profileMap = new Map(
    (profiles || []).map((p: Record<string, unknown>) => [
      toText(p.id),
      { name: toText(p.full_name), email: toText(p.email) },
    ])
  );

  // Resolve document file URLs.
  const docIds = pending.map((r) => toText(r.document_id)).filter(Boolean);
  const { data: docs } = docIds.length
    ? await admin.from("customer_documents").select("id, file_url").in("id", docIds)
    : { data: [] as Array<Record<string, unknown>> };

  const docMap = new Map(
    (docs || []).map((d: Record<string, unknown>) => [
      toText(d.id),
      toText(d.file_url),
    ])
  );

  const approvedToday = reviewedToday.filter((r) => toText(r.status) === "approved").length;
  const rejectedToday = reviewedToday.filter((r) => toText(r.status) === "rejected").length;

  return {
    pendingCount: pending.length,
    approvedToday,
    rejectedToday,
    queue: pending.map((r) => {
      const uid = toText(r.user_id);
      const profile = profileMap.get(uid);
      const docId = toText(r.document_id);
      return {
        id: toText(r.id),
        userId: uid,
        userName: profile?.name || "User",
        userEmail: profile?.email || "",
        documentType: toText(r.document_type),
        status: toText(r.status),
        submittedAt: toText(r.submitted_at),
        reviewedAt: r.reviewed_at ? toText(r.reviewed_at) : null,
        fileUrl: docMap.get(docId) || null,
      };
    }),
  };
}
