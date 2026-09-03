export type JobsChipTone = "good" | "warn" | "risk" | "info" | "neutral";

const STAGE_TONE: Record<string, JobsChipTone> = {
  submitted: "info",
  review: "info",
  reviewing: "info",
  screening: "info",
  shortlisted: "good",
  interview: "good",
  offer: "good",
  hired: "good",
  rejected: "risk",
  withdrawn: "neutral",
  archived: "neutral",
};

export function stageTone(stage: string | null | undefined): JobsChipTone {
  const k = String(stage ?? "").trim().toLowerCase();
  return STAGE_TONE[k] ?? "info";
}

const ICON_TONE: Record<string, "good" | "warn" | "risk" | "info"> = {
  high: "good",
  ready: "good",
  active: "info",
  needs_attention: "warn",
  blocked: "risk",
};

export function iconTone(state: string | null | undefined): "good" | "warn" | "risk" | "info" {
  const k = String(state ?? "").trim().toLowerCase();
  return ICON_TONE[k] ?? "info";
}

export function readinessTone(score: number): JobsChipTone {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  if (score === 0) return "neutral";
  return "risk";
}
