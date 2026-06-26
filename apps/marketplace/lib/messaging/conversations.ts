import "server-only";

import { randomUUID } from "node:crypto";
import { maskContactsForDisplay } from "@henryco/trust/detect";
import { createAdminSupabase } from "@/lib/supabase";
import type { MarketplaceViewerContext } from "@/lib/marketplace/types";

type AdminClient = ReturnType<typeof createAdminSupabase>;

export type MarketplaceConversationAnchorType = "listing" | "order";
export type MarketplaceConversationParty = "buyer" | "vendor";

export type MarketplaceConversationSummary = {
  id: string;
  conversationNo: string;
  anchorType: MarketplaceConversationAnchorType;
  anchorId: string;
  buyerUserId: string | null;
  vendorId: string;
  subject: string | null;
  status: string;
  lastMessageAt: string | null;
  /** Already screened at write-time; re-masked here as defense-in-depth. */
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceConversationMessageView = {
  id: string;
  conversationId: string;
  senderKind: "buyer" | "vendor" | "system";
  senderUserId: string | null;
  /** Display-masked at read for any legacy/unscreened row. */
  body: string;
  createdAt: string;
};

export type MarketplaceConversationThread = {
  conversation: MarketplaceConversationSummary;
  messages: MarketplaceConversationMessageView[];
  viewerParty: MarketplaceConversationParty;
};

export type MarketplaceCounterpart =
  | { kind: "listing"; vendorId: string }
  | { kind: "order"; buyerUserId: string | null; vendorIds: string[] };

function clipPreview(value: string): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function makeConversationNo(): string {
  const now = new Date();
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate(),
  ).padStart(2, "0")}`;
  // 48-bit nonce so a conversation_no unique collision is negligible — the only
  // realistic insert conflict is then the (buyer, vendor, anchor) dedupe index,
  // which findOrCreateConversation recovers from by re-reading the winner's row.
  const nonce = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `MKT-CONV-${date}-${nonce}`;
}

function mapConversationRow(row: Record<string, unknown>): MarketplaceConversationSummary {
  const preview = row.last_message_preview ? maskContactsForDisplay(String(row.last_message_preview)) : null;
  return {
    id: String(row.id),
    conversationNo: String(row.conversation_no || ""),
    anchorType: (String(row.anchor_type) === "order" ? "order" : "listing") as MarketplaceConversationAnchorType,
    anchorId: String(row.anchor_id || ""),
    buyerUserId: row.buyer_user_id ? String(row.buyer_user_id) : null,
    vendorId: String(row.vendor_id || ""),
    subject: row.subject ? String(row.subject) : null,
    status: String(row.status || "open"),
    lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
    lastMessagePreview: preview,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

/**
 * Whether the viewer is acting as a member of the given vendor. This is the
 * app-layer mirror of the RLS membership subquery (role='vendor',
 * scope_type='vendor', active) and is the only thing that authorizes the vendor
 * side of a thread.
 */
export function viewerVendorScopeIds(viewer: MarketplaceViewerContext): Set<string> {
  const scopeIds = new Set<string>();
  for (const membership of viewer.memberships) {
    if (membership.role === "vendor" && membership.scopeType === "vendor" && membership.scopeId) {
      scopeIds.add(membership.scopeId);
    }
  }
  return scopeIds;
}

/**
 * Resolve the counterpart party ids for an anchor. listing -> the owning
 * vendor; order -> the buyer (orders.user_id) plus every distinct vendor on the
 * order (order_groups.vendor_id). Identity-minimized: never reads buyer
 * email/phone/address.
 */
export async function resolveCounterpart(
  admin: AdminClient,
  anchorType: MarketplaceConversationAnchorType,
  anchorId: string,
): Promise<MarketplaceCounterpart | null> {
  if (anchorType === "listing") {
    const { data } = await admin
      .from("marketplace_products")
      .select("vendor_id")
      .eq("id", anchorId)
      .maybeSingle();
    const vendorId = data?.vendor_id ? String(data.vendor_id) : "";
    if (!vendorId) return null;
    return { kind: "listing", vendorId };
  }

  const { data: order } = await admin
    .from("marketplace_orders")
    .select("id, user_id")
    .eq("id", anchorId)
    .maybeSingle();
  if (!order?.id) return null;

  const { data: groups } = await admin
    .from("marketplace_order_groups")
    .select("vendor_id")
    .eq("order_id", order.id);

  const vendorIds = Array.from(
    new Set(
      ((groups ?? []) as Array<Record<string, unknown>>)
        .map((group) => (group.vendor_id ? String(group.vendor_id) : ""))
        .filter(Boolean),
    ),
  );

  return {
    kind: "order",
    buyerUserId: order.user_id ? String(order.user_id) : null,
    vendorIds,
  };
}

async function resolveVendorMemberUserIds(admin: AdminClient, vendorId: string): Promise<string[]> {
  const { data } = await admin
    .from("marketplace_role_memberships")
    .select("user_id")
    .eq("scope_id", vendorId)
    .eq("role", "vendor")
    .eq("scope_type", "vendor")
    .eq("is_active", true);

  return Array.from(
    new Set(
      ((data ?? []) as Array<Record<string, unknown>>)
        .map((row) => (row.user_id ? String(row.user_id) : ""))
        .filter(Boolean),
    ),
  );
}

async function upsertParticipant(
  admin: AdminClient,
  input: { conversationId: string; userId: string; partyKind: MarketplaceConversationParty; vendorId: string | null },
): Promise<void> {
  await admin
    .from("marketplace_conversation_participants")
    .upsert(
      {
        conversation_id: input.conversationId,
        user_id: input.userId,
        party_kind: input.partyKind,
        vendor_id: input.vendorId,
      } as never,
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true },
    );
}

/**
 * Idempotent thread resolver. Dedupes on the unique
 * (buyer_user_id, vendor_id, anchor_type, anchor_id) index; on first creation it
 * also seeds the buyer + vendor-member participant rows (read-state). Every
 * write is service-role (RLS has no INSERT policy on these tables).
 */
export async function findOrCreateConversation(
  admin: AdminClient,
  input: {
    buyerUserId: string;
    vendorId: string;
    anchorType: MarketplaceConversationAnchorType;
    anchorId: string;
    subject?: string | null;
  },
): Promise<MarketplaceConversationSummary> {
  const matchExisting = async () => {
    const { data } = await admin
      .from("marketplace_conversations")
      .select(
        "id, conversation_no, anchor_type, anchor_id, buyer_user_id, vendor_id, subject, status, last_message_at, last_message_preview, created_at, updated_at",
      )
      .eq("buyer_user_id", input.buyerUserId)
      .eq("vendor_id", input.vendorId)
      .eq("anchor_type", input.anchorType)
      .eq("anchor_id", input.anchorId)
      .maybeSingle();
    return data ? mapConversationRow(data as Record<string, unknown>) : null;
  };

  let conversation = await matchExisting();

  if (!conversation) {
    const { data, error } = await admin
      .from("marketplace_conversations")
      .insert({
        conversation_no: makeConversationNo(),
        anchor_type: input.anchorType,
        anchor_id: input.anchorId,
        buyer_user_id: input.buyerUserId,
        vendor_id: input.vendorId,
        subject: input.subject ? String(input.subject).slice(0, 200) : null,
        status: "open",
      } as never)
      .select(
        "id, conversation_no, anchor_type, anchor_id, buyer_user_id, vendor_id, subject, status, last_message_at, last_message_preview, created_at, updated_at",
      )
      .maybeSingle();

    if (error || !data) {
      // Lost a creation race (unique index) — re-read the row the winner wrote.
      conversation = await matchExisting();
      if (!conversation) {
        throw new Error(error?.message || "Failed to create marketplace conversation.");
      }
    } else {
      conversation = mapConversationRow(data as Record<string, unknown>);
    }
  }

  // Seed/refresh read-state participant rows (idempotent).
  await upsertParticipant(admin, {
    conversationId: conversation.id,
    userId: input.buyerUserId,
    partyKind: "buyer",
    vendorId: null,
  });
  const vendorMemberIds = await resolveVendorMemberUserIds(admin, input.vendorId);
  for (const memberId of vendorMemberIds) {
    await upsertParticipant(admin, {
      conversationId: conversation.id,
      userId: memberId,
      partyKind: "vendor",
      vendorId: input.vendorId,
    });
  }

  return conversation;
}

/** Stamp the screened body as the inbox preview + advance last_message_at. */
export async function bumpConversation(
  admin: AdminClient,
  conversationId: string,
  screenedBody: string,
): Promise<void> {
  await admin
    .from("marketplace_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: clipPreview(screenedBody),
    } as never)
    .eq("id", conversationId);
}

/** Self read-state upsert for the viewer (mark_read). Service-role write. */
export async function markConversationRead(
  admin: AdminClient,
  input: { conversationId: string; userId: string; partyKind: MarketplaceConversationParty; vendorId: string | null },
): Promise<void> {
  await admin
    .from("marketplace_conversation_participants")
    .upsert(
      {
        conversation_id: input.conversationId,
        user_id: input.userId,
        party_kind: input.partyKind,
        vendor_id: input.vendorId,
        last_read_at: new Date().toISOString(),
      } as never,
      { onConflict: "conversation_id,user_id" },
    );
}

export async function getBuyerConversations(buyerUserId: string): Promise<MarketplaceConversationSummary[]> {
  if (!buyerUserId) return [];
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("marketplace_conversations")
    .select(
      "id, conversation_no, anchor_type, anchor_id, buyer_user_id, vendor_id, subject, status, last_message_at, last_message_preview, created_at, updated_at",
    )
    .eq("buyer_user_id", buyerUserId)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapConversationRow);
}

export async function getVendorConversations(scopeId: string): Promise<MarketplaceConversationSummary[]> {
  if (!scopeId) return [];
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("marketplace_conversations")
    .select(
      "id, conversation_no, anchor_type, anchor_id, buyer_user_id, vendor_id, subject, status, last_message_at, last_message_preview, created_at, updated_at",
    )
    .eq("vendor_id", scopeId)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapConversationRow);
}

/**
 * Single thread for a viewer, with app-layer authz (viewer is the buyer OR a
 * member of the conversation's vendor) layered on top of RLS. Returns null when
 * the viewer is not a party. Every message body is display-masked at read.
 */
export async function getConversationForViewer(
  conversationId: string,
  viewer: MarketplaceViewerContext,
): Promise<MarketplaceConversationThread | null> {
  if (!conversationId || !viewer.user) return null;
  const admin = createAdminSupabase();

  const { data: convoRow } = await admin
    .from("marketplace_conversations")
    .select(
      "id, conversation_no, anchor_type, anchor_id, buyer_user_id, vendor_id, subject, status, last_message_at, last_message_preview, created_at, updated_at",
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (!convoRow) return null;

  const conversation = mapConversationRow(convoRow as Record<string, unknown>);

  const isBuyer = Boolean(conversation.buyerUserId) && conversation.buyerUserId === viewer.user.id;
  const isVendorMember = viewerVendorScopeIds(viewer).has(conversation.vendorId);
  if (!isBuyer && !isVendorMember) return null;

  const { data: messageRows } = await admin
    .from("marketplace_conversation_messages")
    .select("id, conversation_id, sender_kind, sender_user_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages: MarketplaceConversationMessageView[] = ((messageRows ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: String(row.id),
      conversationId: String(row.conversation_id),
      senderKind: (["buyer", "vendor", "system"].includes(String(row.sender_kind))
        ? String(row.sender_kind)
        : "system") as MarketplaceConversationMessageView["senderKind"],
      senderUserId: row.sender_user_id ? String(row.sender_user_id) : null,
      body: maskContactsForDisplay(String(row.body ?? "")),
      createdAt: String(row.created_at || ""),
    }),
  );

  return { conversation, messages, viewerParty: isBuyer ? "buyer" : "vendor" };
}
