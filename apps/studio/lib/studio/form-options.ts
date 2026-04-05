/** Human labels for staff queue controls (avoid raw enum strings in UI). */

export const STUDIO_LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_ready", label: "Proposal ready" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export const STUDIO_PROPOSAL_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
] as const;
