export type ContextAnchorType =
  | "support" | "order" | "listing" | "booking" | "job"
  | "studio_project" | "property_inquiry" | "learn_cohort" | "direct";

export interface ContextAnchor {
  type: ContextAnchorType;
  id: string | null;          // null for "direct"
  division: string;
}

export type DeliveryState = "queued" | "sent" | "delivered" | "seen" | "failed";

export interface Participant {
  userId: string;             // STABLE FK — the owner-correctness anchor
  role: string;               // buyer | seller | staff | client | system | ...
  lastReadAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string;               // already contact-safety-checked before persist
  attachments: string[];      // media://private/... refs only
  deliveryState: DeliveryState;
  createdAt: string;
}

export interface Conversation {
  id: string;
  anchor: ContextAnchor;
  division: string;
  subject: string | null;
  status: "open" | "closed";
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
