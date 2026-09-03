/** View models for the owner inbox UI (serializable; no DB types leak to client). */

export type InboxAddressFilter = {
  address: string;
  label: string;
  total: number;
  unread: number;
};

export type InboxListItem = {
  id: string;
  fromAddress: string;
  fromName: string | null;
  toAddress: string;
  subject: string;
  snippet: string | null;
  receivedAt: string;
  isRead: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  attachmentCount: number;
  isSpam: boolean;
};

export type InboxAttachmentView = {
  id: string;
  filename: string;
  contentType: string | null;
  sizeBytes: number;
  captured: boolean;
  isInline: boolean;
  signedUrl: string | null;
};

export type InboxMessageDetail = InboxListItem & {
  messageId: string | null;
  replyTo: string | null;
  cc: string[];
  textBody: string | null;
  htmlBody: string | null;
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  attachmentsTruncated: boolean;
  headers: Record<string, string>;
  sentAt: string | null;
  attachments: InboxAttachmentView[];
};

export type InboxSummary = {
  totalUnread: number;
  totalAll: number;
  totalArchived: number;
  addresses: InboxAddressFilter[];
  /** True when the per-address chip counts were computed from a capped scan
   *  (so chip totals may undercount; the headline totals stay exact). */
  addressesCapped: boolean;
};

export type InboxListResult = {
  items: InboxListItem[];
  summary: InboxSummary;
  /** True when the inbox backend (Supabase) is not reachable — UI degrades. */
  connected: boolean;
};
