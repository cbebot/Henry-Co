import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { signInboxAttachment, uploadInboxAttachment } from "./media";
import { buildEmailInsert, type InboundEmailPayload } from "./payload";
import type {
  InboxAddressFilter,
  InboxListItem,
  InboxListResult,
  InboxMessageDetail,
  InboxSummary,
} from "./types";

/**
 * Owner-inbox data layer. All access is via the service-role admin client
 * (RLS-bypassing) and every caller sits behind requireOwner(). Reads degrade to
 * an empty/disconnected result rather than throwing (preview-env contract).
 */

const EMAILS_TABLE = "received_emails";
const ATTACH_TABLE = "received_email_attachments";

type AdminClient = ReturnType<typeof createAdminSupabase>;

function adminOrNull(): AdminClient | null {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
}

function addressLabel(address: string): string {
  const local = address.split("@")[0] ?? address;
  if (!local) return address;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function mapListItem(row: Record<string, unknown>): InboxListItem {
  return {
    id: String(row.id),
    fromAddress: String(row.from_address ?? ""),
    fromName: (row.from_name as string | null) ?? null,
    toAddress: String(row.to_address ?? ""),
    subject: String(row.subject ?? "(no subject)"),
    snippet: (row.snippet as string | null) ?? null,
    receivedAt: String(row.received_at ?? new Date().toISOString()),
    isRead: Boolean(row.is_read),
    isArchived: Boolean(row.is_archived),
    hasAttachments: Boolean(row.has_attachments),
    attachmentCount: Number(row.attachment_count ?? 0),
    isSpam: Boolean(row.is_spam),
  };
}

// ── Write (webhook) ──────────────────────────────────────────────────────────

export type RecordResult =
  | { status: "created"; id: string }
  | { status: "duplicate"; id: string | null }
  | { status: "error"; error: string };

/**
 * Idempotently capture each attachment by stable position. Safe to re-enter:
 * positions already stored are skipped (no re-upload, no duplicate row), so a
 * Worker retry after a mid-loop crash RESUMES instead of dropping the rest.
 */
async function reconcileAttachments(
  admin: AdminClient,
  emailId: string,
  payload: InboundEmailPayload,
): Promise<{ anyUncaptured: boolean }> {
  if (payload.attachments.length === 0) return { anyUncaptured: false };

  const { data: existingRows } = await admin
    .from(ATTACH_TABLE)
    .select("position")
    .eq("email_id", emailId);
  const present = new Set<number>(
    ((existingRows ?? []) as Array<{ position: number }>).map((r) => Number(r.position)),
  );

  let anyUncaptured = false;
  for (let position = 0; position < payload.attachments.length; position++) {
    const att = payload.attachments[position];
    if (present.has(position)) {
      // Already stored on a prior attempt — don't re-upload or duplicate.
      if (!att.captured) anyUncaptured = true;
      continue;
    }

    let mediaRef: string | null = null;
    let captured = false;
    if (att.captured && att.contentBase64) {
      try {
        const bytes = Buffer.from(att.contentBase64, "base64");
        if (bytes.length > 0) {
          mediaRef = await uploadInboxAttachment({
            emailId,
            filename: att.filename,
            contentType: att.contentType,
            bytes,
          });
          captured = true;
        }
      } catch {
        mediaRef = null;
        captured = false;
      }
    }
    if (!captured) anyUncaptured = true;

    // upsert + ignoreDuplicates: concurrent retries collide on (email_id, position)
    // and the loser is dropped rather than duplicating the row.
    await admin.from(ATTACH_TABLE).upsert(
      {
        email_id: emailId,
        position,
        filename: att.filename,
        content_type: att.contentType,
        size_bytes: att.sizeBytes,
        media_ref: mediaRef,
        captured,
        is_inline: att.isInline,
        content_id: att.contentId,
      },
      { onConflict: "email_id,position", ignoreDuplicates: true },
    );
  }

  return { anyUncaptured };
}

/** Idempotently store an inbound message + its attachments. */
export async function recordInboundEmail(payload: InboundEmailPayload): Promise<RecordResult> {
  const admin = adminOrNull();
  if (!admin) return { status: "error", error: "supabase_unconfigured" };

  const insert = buildEmailInsert(payload, new Date().toISOString());

  // On a duplicate (redelivery/retry), still reconcile attachments so a prior
  // partial capture is completed rather than silently lost.
  const existing = await admin
    .from(EMAILS_TABLE)
    .select("id")
    .eq("dedupe_key", insert.dedupe_key)
    .maybeSingle();
  if (existing.data?.id) {
    const id = String(existing.data.id);
    await reconcileAttachments(admin, id, payload);
    return { status: "duplicate", id };
  }

  const { data, error } = await admin.from(EMAILS_TABLE).insert(insert).select("id").single();
  if (error || !data) {
    // Unique-violation race -> a concurrent delivery already stored it.
    if (error && String((error as { code?: string }).code) === "23505") {
      const dup = await admin
        .from(EMAILS_TABLE)
        .select("id")
        .eq("dedupe_key", insert.dedupe_key)
        .maybeSingle();
      if (dup.data?.id) {
        const id = String(dup.data.id);
        await reconcileAttachments(admin, id, payload);
        return { status: "duplicate", id };
      }
    }
    return { status: "error", error: error?.message ?? "insert_failed" };
  }

  const emailId = String(data.id);
  const { anyUncaptured } = await reconcileAttachments(admin, emailId, payload);

  if (anyUncaptured && !insert.attachments_truncated) {
    await admin.from(EMAILS_TABLE).update({ attachments_truncated: true }).eq("id", emailId);
  }

  return { status: "created", id: emailId };
}

// ── Read (owner UI) ──────────────────────────────────────────────────────────

const ADDR_SCAN_CAP = 5000;

async function buildSummary(admin: AdminClient): Promise<InboxSummary> {
  const empty: InboxSummary = {
    totalUnread: 0,
    totalAll: 0,
    totalArchived: 0,
    addresses: [],
    addressesCapped: false,
  };
  try {
    const [allCount, unreadCount, archivedCount, addrRows] = await Promise.all([
      admin.from(EMAILS_TABLE).select("*", { count: "exact", head: true }).eq("is_archived", false),
      admin
        .from(EMAILS_TABLE)
        .select("*", { count: "exact", head: true })
        .eq("is_archived", false)
        .eq("is_read", false),
      admin.from(EMAILS_TABLE).select("*", { count: "exact", head: true }).eq("is_archived", true),
      // Per-address aggregate over the active (non-archived) inbox. Capped scan;
      // headline totals above stay exact. addressesCapped flags an undercount.
      admin
        .from(EMAILS_TABLE)
        .select("to_address, is_read")
        .eq("is_archived", false)
        .limit(ADDR_SCAN_CAP),
    ]);

    const byAddress = new Map<string, { total: number; unread: number }>();
    for (const r of (addrRows.data ?? []) as Array<{ to_address: string; is_read: boolean }>) {
      const addr = String(r.to_address ?? "").toLowerCase();
      if (!addr) continue;
      const cur = byAddress.get(addr) ?? { total: 0, unread: 0 };
      cur.total += 1;
      if (!r.is_read) cur.unread += 1;
      byAddress.set(addr, cur);
    }
    const addresses: InboxAddressFilter[] = [...byAddress.entries()]
      .map(([address, c]) => ({ address, label: addressLabel(address), total: c.total, unread: c.unread }))
      .sort((a, b) => b.unread - a.unread || b.total - a.total || a.address.localeCompare(b.address));

    return {
      totalAll: allCount.count ?? 0,
      totalUnread: unreadCount.count ?? 0,
      totalArchived: archivedCount.count ?? 0,
      addresses,
      addressesCapped: (addrRows.data?.length ?? 0) >= ADDR_SCAN_CAP,
    };
  } catch {
    return empty;
  }
}

export async function getInboxList(opts: {
  address?: string | null;
  archived?: boolean;
  limit?: number;
}): Promise<InboxListResult> {
  const emptySummary: InboxSummary = {
    totalUnread: 0,
    totalAll: 0,
    totalArchived: 0,
    addresses: [],
    addressesCapped: false,
  };
  const admin = adminOrNull();
  if (!admin) return { items: [], summary: emptySummary, connected: false };

  const limit = Math.min(Math.max(opts.limit ?? 100, 10), 300);
  try {
    let q = admin
      .from(EMAILS_TABLE)
      .select(
        "id, from_address, from_name, to_address, subject, snippet, received_at, is_read, is_archived, has_attachments, attachment_count, is_spam",
      )
      .eq("is_archived", Boolean(opts.archived))
      .order("received_at", { ascending: false })
      .limit(limit);
    if (opts.address) q = q.eq("to_address", opts.address.toLowerCase());

    const { data, error } = await q;
    if (error) return { items: [], summary: emptySummary, connected: false };

    const items = ((data ?? []) as Array<Record<string, unknown>>).map(mapListItem);
    const summary = await buildSummary(admin);
    return { items, summary, connected: true };
  } catch {
    return { items: [], summary: emptySummary, connected: false };
  }
}

export async function getInboxMessage(id: string): Promise<InboxMessageDetail | null> {
  const admin = adminOrNull();
  if (!admin) return null;
  try {
    const { data, error } = await admin.from(EMAILS_TABLE).select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;

    const { data: attRows } = await admin
      .from(ATTACH_TABLE)
      .select("*")
      .eq("email_id", id)
      .order("created_at", { ascending: true });

    const attachments = await Promise.all(
      ((attRows ?? []) as Array<Record<string, unknown>>).map(async (a) => ({
        id: String(a.id),
        filename: String(a.filename ?? "attachment"),
        contentType: (a.content_type as string | null) ?? null,
        sizeBytes: Number(a.size_bytes ?? 0),
        captured: Boolean(a.captured),
        isInline: Boolean(a.is_inline),
        signedUrl:
          a.captured && a.media_ref ? await signInboxAttachment(String(a.media_ref)) : null,
      })),
    );

    return {
      ...mapListItem(row),
      messageId: (row.message_id as string | null) ?? null,
      replyTo: (row.reply_to as string | null) ?? null,
      cc: Array.isArray(row.cc_addresses) ? (row.cc_addresses as string[]) : [],
      textBody: (row.text_body as string | null) ?? null,
      htmlBody: (row.html_body as string | null) ?? null,
      spf: (row.spf as string | null) ?? null,
      dkim: (row.dkim as string | null) ?? null,
      dmarc: (row.dmarc as string | null) ?? null,
      attachmentsTruncated: Boolean(row.attachments_truncated),
      headers:
        row.headers && typeof row.headers === "object"
          ? (row.headers as Record<string, string>)
          : {},
      sentAt: (row.sent_at as string | null) ?? null,
      attachments,
    };
  } catch {
    return null;
  }
}

export async function markInboxRead(id: string, ownerId: string | null): Promise<void> {
  const admin = adminOrNull();
  if (!admin) return;
  await admin
    .from(EMAILS_TABLE)
    .update({ is_read: true, read_at: new Date().toISOString(), read_by: ownerId })
    .eq("id", id);
}

export async function markInboxUnread(id: string): Promise<void> {
  const admin = adminOrNull();
  if (!admin) return;
  await admin.from(EMAILS_TABLE).update({ is_read: false, read_at: null, read_by: null }).eq("id", id);
}

export async function setInboxArchived(id: string, archived: boolean): Promise<void> {
  const admin = adminOrNull();
  if (!admin) return;
  await admin
    .from(EMAILS_TABLE)
    .update({ is_archived: archived, archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
}
