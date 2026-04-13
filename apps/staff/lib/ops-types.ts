export type OpsTone = "info" | "success" | "warning" | "critical";

export type OpsMetric = {
  label: string;
  value: string;
  hint: string;
};

export type OpsQueueItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  ownerRole: string;
  statusLabel: string;
  tone: OpsTone;
  meta?: string | null;
};

export type OpsLink = {
  href: string;
  label: string;
  description: string;
};
