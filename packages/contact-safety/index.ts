export type ContactSafetyAction = "allow" | "mask" | "block";

export interface ContactSafetyResult {
  action: ContactSafetyAction;
  maskedText: string;
  patterns: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export function contactSafety(text: string): ContactSafetyResult {
  return { action: "allow", maskedText: text, patterns: [], severity: "low" };
}
