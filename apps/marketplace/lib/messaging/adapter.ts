import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, MessagingAdapter, PersistInput } from "@henryco/messaging";

/**
 * Marketplace implementation of the shared @henryco/messaging MessagingAdapter.
 *
 * This is the seam that lets the buyer<->seller send path route through the
 * unified @henryco/messaging/server `sendMessage` pipeline, inheriting:
 *   - block-before-persist contact safety (the pipeline screens, then calls
 *     persistMessage only for allow/mask), and
 *   - notify-by-stable-userId (the pipeline resolves getParticipants, drops the
 *     sender, and notifies the rest by their user id — never email/phone).
 *
 * The adapter takes the service-role client as a parameter rather than building
 * one itself: every write here MUST go through `createAdminSupabase()` (RLS has
 * no INSERT policy on these tables, so a client-context write would fail), and
 * keeping the client injected keeps this module free of `server-only`/`@/`
 * imports so it can be unit-tested with a fake client under `tsx --test`.
 */
export function createMarketplaceMessagingAdapter(admin: SupabaseClient): MessagingAdapter {
  return {
    async persistMessage(input: PersistInput): Promise<Message> {
      const { data, error } = await admin
        .from("marketplace_conversation_messages")
        .insert({
          conversation_id: input.conversationId,
          // senderRole is the domain party ('buyer' | 'vendor'); it maps 1:1 to
          // the sender_kind check constraint. 'system' is reserved for non-user
          // rows and is never produced by this send path.
          sender_kind: input.senderRole,
          sender_user_id: input.senderId,
          // input.body is already post-safety (masked when medium); the pipeline
          // guarantees a high/critical body is rejected before we ever get here.
          body: input.body,
          message_type: "text",
        } as never)
        .select("id, conversation_id, sender_kind, sender_user_id, body, created_at")
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Failed to persist marketplace conversation message.");
      }

      const row = data as Record<string, unknown>;
      return {
        id: String(row.id),
        conversationId: String(row.conversation_id),
        senderId: row.sender_user_id ? String(row.sender_user_id) : "",
        senderRole: String(row.sender_kind),
        body: String(row.body ?? ""),
        attachments: [],
        deliveryState: "sent",
        createdAt: String(row.created_at),
      };
    },

    async getParticipants(conversationId: string): Promise<{ userId: string; role: string }[]> {
      const { data: convo } = await admin
        .from("marketplace_conversations")
        .select("buyer_user_id, vendor_id")
        .eq("id", conversationId)
        .maybeSingle();

      if (!convo) return [];
      const conversation = convo as Record<string, unknown>;

      const participants: { userId: string; role: string }[] = [];

      if (conversation.buyer_user_id) {
        participants.push({ userId: String(conversation.buyer_user_id), role: "buyer" });
      }

      // Resolve the vendor party from live, active vendor memberships rather than
      // from a (mutable) participants row — so notification recipients are always
      // the current vendor team and a tampered participant row can never redirect
      // a notification. user_id can be null on email-only seeds; those are dropped.
      if (conversation.vendor_id) {
        const { data: members } = await admin
          .from("marketplace_role_memberships")
          .select("user_id")
          .eq("scope_id", conversation.vendor_id)
          .eq("role", "vendor")
          .eq("scope_type", "vendor")
          .eq("is_active", true);

        for (const member of (members ?? []) as Array<Record<string, unknown>>) {
          if (member.user_id) {
            participants.push({ userId: String(member.user_id), role: "vendor" });
          }
        }
      }

      // De-duplicate by stable user id (a vendor member could also be the buyer).
      const seen = new Set<string>();
      return participants.filter((p) => (seen.has(p.userId) ? false : (seen.add(p.userId), true)));
    },
  };
}
