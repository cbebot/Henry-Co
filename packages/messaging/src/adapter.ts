import type { Message } from "./types";

export interface PersistInput {
  conversationId: string;
  senderId: string;
  senderRole: string;
  body: string;            // post-safety body (masked if medium)
  attachments: string[];
  safetySeverity: string;  // audit: verdict at send time
}

export interface MessagingAdapter {
  persistMessage(input: PersistInput): Promise<Message>;
  getParticipants(conversationId: string): Promise<{ userId: string; role: string }[]>;
}
