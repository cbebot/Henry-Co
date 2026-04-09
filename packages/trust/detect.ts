// ---------------------------------------------------------------------------
// detect.ts - Pure content-detection utilities (zero external dependencies)
// ---------------------------------------------------------------------------

export type Severity = "low" | "medium" | "high";

// ---- Off-platform contact detection --------------------------------------

const PHONE_RE =
  /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}\b/g;

const EMAIL_RE =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const SOCIAL_HANDLE_RE = /(?:^|\s)@[a-zA-Z0-9_]{2,30}\b/g;

const MESSAGING_APP_RE =
  /\b(whatsapp|telegram|signal|viber|wechat|line\s?app|imessage|fb\s?messenger)\b/gi;

const SOCIAL_URL_RE =
  /https?:\/\/(?:www\.)?(?:facebook|fb|instagram|twitter|x|tiktok|linkedin|snapchat|threads)\.com\/[^\s)]+/gi;

const EXTERNAL_MEETING_RE =
  /https?:\/\/(?:meet\.google|zoom\.us|teams\.microsoft|whereby|calendly)\.com\/[^\s)]+/gi;

export interface OffPlatformResult {
  detected: boolean;
  patterns: string[];
  severity: Severity;
}

export function detectOffPlatformContact(text: string): OffPlatformResult {
  const patterns: string[] = [];
  let severity: Severity = "low";

  // High severity: phone numbers & emails
  const phones = text.match(PHONE_RE);
  if (phones) {
    patterns.push(...phones.map((p) => p.trim()));
    severity = "high";
  }

  const emails = text.match(EMAIL_RE);
  if (emails) {
    patterns.push(...emails);
    severity = "high";
  }

  // Medium severity: social URLs, messaging apps, meeting links
  const socialUrls = text.match(SOCIAL_URL_RE);
  if (socialUrls) {
    patterns.push(...socialUrls);
    if (severity !== "high") severity = "medium";
  }

  const meetingLinks = text.match(EXTERNAL_MEETING_RE);
  if (meetingLinks) {
    patterns.push(...meetingLinks);
    if (severity !== "high") severity = "medium";
  }

  const messagingApps = text.match(MESSAGING_APP_RE);
  if (messagingApps) {
    patterns.push(...messagingApps.map((m) => m.trim()));
    if (severity !== "high") severity = "medium";
  }

  // Low severity: social handles
  const handles = text.match(SOCIAL_HANDLE_RE);
  if (handles) {
    patterns.push(...handles.map((h) => h.trim()));
    // severity stays at whatever it already is (only "low" if nothing else matched)
  }

  return {
    detected: patterns.length > 0,
    patterns,
    severity: patterns.length === 0 ? "low" : severity,
  };
}

// ---- Suspicious / scam content detection ---------------------------------

interface PatternEntry {
  re: RegExp;
  reason: string;
  severity: Severity;
}

const SUSPICIOUS_PATTERNS: PatternEntry[] = [
  // Urgency pressure
  { re: /\b(act\s+now|limited\s+time|hurry|urgent|don'?t\s+miss|expires?\s+soon|last\s+chance|immediately)\b/gi, reason: "Urgency pressure language detected", severity: "medium" },
  // Financial pressure
  { re: /\b(send\s+money|wire\s+transfer|western\s+union|moneygram|bitcoin\s+payment|crypto\s+payment|cash\s+app|venmo\s+me|zelle\s+me|gift\s+card|bank\s+transfer)\b/gi, reason: "Financial pressure or off-platform payment request", severity: "high" },
  // Identity theft
  { re: /\b(send\s+(your\s+)?id|passport\s+photo|driver'?s?\s+licen[cs]e\s+(photo|copy|scan)|social\s+security|ssn|national\s+id)\b/gi, reason: "Request for identity documents", severity: "high" },
  // Phishing
  { re: /\b(click\s+this\s+link|verify\s+your\s+account|confirm\s+your\s+(identity|password|credentials)|log\s*in\s+here|reset\s+your\s+password)\b/gi, reason: "Phishing language detected", severity: "high" },
  // Advance-fee / too-good-to-be-true
  { re: /\b(you('ve)?\s+won|congratulations\s+you|claim\s+your\s+prize|free\s+money|guaranteed\s+income|no\s+risk)\b/gi, reason: "Advance-fee or too-good-to-be-true language", severity: "medium" },
];

export interface SuspiciousContentResult {
  detected: boolean;
  reasons: string[];
  severity: Severity;
}

export function detectSuspiciousContent(text: string): SuspiciousContentResult {
  const reasons: string[] = [];
  let severity: Severity = "low";

  for (const { re, reason, severity: patternSeverity } of SUSPICIOUS_PATTERNS) {
    // Reset lastIndex for global regexes
    re.lastIndex = 0;
    if (re.test(text)) {
      if (!reasons.includes(reason)) {
        reasons.push(reason);
      }
      if (
        patternSeverity === "high" ||
        (patternSeverity === "medium" && severity !== "high")
      ) {
        severity = patternSeverity;
      }
    }
  }

  return {
    detected: reasons.length > 0,
    reasons,
    severity: reasons.length === 0 ? "low" : severity,
  };
}

// ---- Display sanitisation ------------------------------------------------

export function sanitizeForDisplay(text: string): string {
  let result = text;

  // Mask phone numbers: keep last 4 digits
  result = result.replace(PHONE_RE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 7) return match; // too short to be a real phone number
    return "***-" + digits.slice(-4);
  });

  // Mask emails: first 2 chars + ***@domain
  result = result.replace(EMAIL_RE, (match) => {
    const [local, domain] = match.split("@");
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  });

  return result;
}

// ---- Trust score calculation ---------------------------------------------

export interface TrustSignals {
  accountAge: number; // days since account creation
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  completedTransactions: number;
  flagCount: number;
  fraudScore: number; // 0-1 external fraud probability
}

export function calculateTrustScore(signals: TrustSignals): number {
  let score = 0;

  // Account age (max 25 pts)
  // 0 days = 0, 30 days = 10, 90 days = 18, 365+ days = 25
  score += Math.min(25, Math.round(25 * (1 - Math.exp(-signals.accountAge / 120))));

  // Verification (max 20 pts)
  if (signals.verifiedEmail) score += 10;
  if (signals.verifiedPhone) score += 10;

  // Completed transactions (max 30 pts)
  // Each transaction adds diminishing points
  score += Math.min(30, Math.round(30 * (1 - Math.exp(-signals.completedTransactions / 10))));

  // Flag penalty (subtract up to 25 pts)
  score -= Math.min(25, signals.flagCount * 5);

  // Fraud score penalty (subtract up to 30 pts)
  score -= Math.round(signals.fraudScore * 30);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}
