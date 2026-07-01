// V3-12 — studio brief co-pilot: the pure structured-output parser + deterministic fallback,
// extracted from brief-copilot-action.ts so it is unit-testable and importable without pulling
// in next/headers. No server imports; the gateway's studio.brief.staff prompt instructs the
// exact JSON shape normaliseStructured parses.

export type BriefCopilotStructured = {
  projectType: string;
  platformPreference: string;
  designDirection: string;
  preferredLanguage: string;
  frameworkPreference: string;
  backendPreference: string;
  hostingPreference: string;
  pageRequirements: string[];
  requiredFeatures: string[];
  addonServices: string[];
  techPreferences: string[];
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  goals: string;
  scopeNotes: string;
  summary: string;
  confidence: number;
  uncertainties: string[];
};

function clampString(value: unknown, maxLength = 200, fallback = ""): string {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

function clampArray(value: unknown, max = 8, itemMax = 80): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clampString(item, itemMax, ""))
    .filter((item) => item.length > 0)
    .slice(0, max);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function normaliseStructured(raw: unknown): BriefCopilotStructured | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  return {
    projectType: clampString(r.projectType, 80, "Custom website"),
    platformPreference: clampString(r.platformPreference, 80, "Best-fit recommendation"),
    designDirection: clampString(r.designDirection, 200, "Quiet luxury and high-trust"),
    preferredLanguage: clampString(r.preferredLanguage, 40, "English"),
    frameworkPreference: clampString(
      r.frameworkPreference,
      80,
      "Henry Onyx's framework recommendation"
    ),
    backendPreference: clampString(
      r.backendPreference,
      80,
      "Henry Onyx recommends the backend"
    ),
    hostingPreference: clampString(r.hostingPreference, 80, "Henry Onyx recommends the host"),
    pageRequirements: clampArray(r.pageRequirements, 12, 60),
    requiredFeatures: clampArray(r.requiredFeatures, 10, 80),
    addonServices: clampArray(r.addonServices, 5, 60),
    techPreferences: clampArray(r.techPreferences, 8, 60),
    businessType: clampString(r.businessType, 60, "Not specified"),
    budgetBand: clampString(r.budgetBand, 40, "Not sure yet"),
    urgency: clampString(r.urgency, 60, "No fixed deadline"),
    timeline: clampString(r.timeline, 80, "To be confirmed"),
    goals: clampString(r.goals, 600, ""),
    scopeNotes: clampString(r.scopeNotes, 1000, ""),
    summary: clampString(r.summary, 240, ""),
    confidence: clampNumber(r.confidence, 0, 1, 0.5),
    uncertainties: clampArray(r.uncertainties, 4, 140),
  };
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function uniqueList(items: string[], max: number) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, max);
}

function redactSensitiveText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[phone removed]")
    .trim();
}

function resolveFallbackProjectType(input: string) {
  if (includesAny(input, ["redesign", "revamp", "refresh existing"])) return "Website redesign";
  if (includesAny(input, ["mobile app", "react native", "flutter", "ios", "android"])) {
    return "Mobile app";
  }
  if (includesAny(input, ["internal", "ops", "operation", "admin", "staff tool"])) {
    return "Internal ops tool";
  }
  if (includesAny(input, ["storefront", "ecommerce", "e-commerce", "shop", "cart"])) {
    return "Storefront";
  }
  if (includesAny(input, ["platform", "saas", "dashboard", "portal", "marketplace"])) {
    return "Web app or platform";
  }
  if (includesAny(input, ["landing", "funnel", "campaign"])) return "Landing page or funnel";
  if (includesAny(input, ["brand", "identity", "logo"])) return "Brand system";
  if (includesAny(input, ["website", "site", "web"])) return "Custom website";
  return "Other";
}

function resolveFallbackPlatform(input: string) {
  if (input.includes("react native")) return "React Native";
  if (input.includes("flutter")) return "Flutter";
  if (input.includes("shopify")) return "Shopify";
  if (input.includes("wordpress")) return "WordPress";
  if (input.includes("webflow")) return "Webflow";
  if (input.includes("next.js") || input.includes("nextjs")) return "Next.js";
  if (includesAny(input, ["saas", "dashboard", "portal", "platform", "internal"])) return "Next.js";
  return "Best-fit recommendation";
}

function resolveFallbackBackend(input: string) {
  if (input.includes("supabase")) return "Supabase";
  if (input.includes("firebase")) return "Firebase";
  if (input.includes("postgres") || input.includes("postgresql")) return "Postgres";
  if (input.includes("node")) return "Node.js API";
  if (input.includes("python")) return "Python backend";
  if (includesAny(input, ["auth", "login", "payment", "database", "admin", "dashboard", "api"])) {
    return "Henry Onyx recommends the backend";
  }
  return "Henry Onyx recommends the backend";
}

function resolveFallbackHosting(input: string) {
  if (input.includes("vercel")) return "Vercel";
  if (input.includes("aws")) return "AWS";
  if (input.includes("gcp") || input.includes("google cloud")) return "Google Cloud";
  if (input.includes("cloudflare")) return "Cloudflare";
  return "Henry Onyx recommends the host";
}

function resolveFallbackBudget(input: string) {
  const wordNumbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    fifteen: 15,
    twenty: 20,
  };
  const numericMillions = [...input.matchAll(/(\d+(?:\.\d+)?)\s*(?:m|million|mn)\b/g)].map(
    (match) => Number(match[1])
  );
  const wordMillions = Object.entries(wordNumbers)
    .filter(([word]) => input.includes(`${word} million`))
    .map(([, amount]) => amount);
  const amounts = [...numericMillions, ...wordMillions].filter(Number.isFinite);
  const maxAmount = amounts.length ? Math.max(...amounts) : 0;

  if (!maxAmount) return "Not sure yet";
  if (maxAmount < 1) return "Below ₦1M";
  if (maxAmount <= 3) return "₦1M – ₦3M";
  if (maxAmount <= 8) return "₦3M – ₦8M";
  if (maxAmount <= 20) return "₦8M – ₦20M";
  return "₦20M+";
}

function resolveFallbackUrgency(input: string) {
  if (includesAny(input, ["asap", "urgent", "immediately", "two weeks", "2 weeks"])) {
    return "ASAP — within 2 weeks";
  }
  if (includesAny(input, ["four weeks", "4 weeks", "one month", "next month"])) {
    return "Within 4 weeks";
  }
  if (includesAny(input, ["six weeks", "6 weeks", "eight weeks", "8 weeks"])) {
    return "Within 8 weeks";
  }
  if (includesAny(input, ["ten weeks", "10 weeks", "twelve weeks", "12 weeks", "quarter"])) {
    return "Within 3 months";
  }
  return "No fixed deadline";
}

function resolveFallbackBusinessType(input: string) {
  if (input.includes("logistics")) return "Logistics operations";
  if (includesAny(input, ["investment", "investor", "finance", "fintech"])) return "Financial services";
  if (includesAny(input, ["agency", "studio", "creative"])) return "Agency operations";
  if (includesAny(input, ["school", "learn", "education", "course"])) return "Education";
  if (includesAny(input, ["clinic", "health", "medical"])) return "Healthcare";
  if (includesAny(input, ["real estate", "property"])) return "Real estate";
  if (includesAny(input, ["restaurant", "food", "hotel", "hospitality"])) return "Hospitality";
  return "Digital business";
}

function buildFallbackPages(input: string, projectType: string) {
  const pages =
    projectType === "Internal ops tool"
      ? ["Login", "Operations dashboard", "Project intake", "Reporting"]
      : projectType === "Mobile app"
        ? ["Onboarding", "User dashboard", "Core workflow", "Settings"]
        : projectType === "Storefront"
          ? ["Home", "Product catalog", "Product detail", "Cart", "Checkout"]
          : ["Home", "Services", "About", "Contact"];

  if (includesAny(input, ["admin", "compliance"])) pages.push("Admin dashboard");
  if (includesAny(input, ["client portal", "customer portal", "portal"])) pages.push("Client portal");
  if (includesAny(input, ["analytics", "reporting", "reports"])) pages.push("Analytics");
  if (includesAny(input, ["payment", "invoice", "bank transfer"])) pages.push("Payments");
  if (includesAny(input, ["courier", "dispatch", "tracking"])) pages.push("Tracking dashboard");
  return uniqueList(pages, 12);
}

function buildFallbackFeatures(input: string) {
  const features = ["Responsive interface", "Secure contact capture", "Admin-ready content model"];
  if (includesAny(input, ["auth", "login", "member", "kyc", "two-factor", "2fa"])) {
    features.push("Authentication and access control");
  }
  if (includesAny(input, ["payment", "invoice", "bank transfer", "checkout"])) {
    features.push("Payment and invoice flow");
  }
  if (includesAny(input, ["dashboard", "analytics", "reporting", "reports"])) {
    features.push("Dashboard and reporting");
  }
  if (includesAny(input, ["file", "document", "sign documents"])) {
    features.push("Document handling");
  }
  if (includesAny(input, ["mobile", "courier", "dispatch"])) {
    features.push("Mobile workflow support");
  }
  if (includesAny(input, ["integrate", "integration", "accounting", "api"])) {
    features.push("Third-party integration");
  }
  return uniqueList(features, 10);
}

export function buildFallbackStructured(description: string): BriefCopilotStructured {
  const safeDescription = redactSensitiveText(description);
  const input = safeDescription.toLowerCase();
  const projectType = resolveFallbackProjectType(input);
  const platformPreference = resolveFallbackPlatform(input);
  const requiredFeatures = buildFallbackFeatures(input);
  const urgency = resolveFallbackUrgency(input);
  const pageRequirements = buildFallbackPages(input, projectType);
  const techPreferences = uniqueList(
    [
      input.includes("next.js") || input.includes("nextjs") ? "Next.js" : "",
      input.includes("react native") ? "React Native" : "",
      input.includes("flutter") ? "Flutter" : "",
      input.includes("supabase") ? "Supabase" : "",
      input.includes("postgres") ? "Postgres" : "",
      input.includes("stripe") ? "Stripe" : "",
      input.includes("paystack") ? "Paystack" : "",
      input.includes("vercel") ? "Vercel" : "",
    ],
    8
  );

  return {
    projectType,
    platformPreference,
    designDirection: includesAny(input, ["luxury", "executive", "premium", "restrained"])
      ? "Restrained, executive, high-trust interface"
      : "Clean, modern, high-trust product experience",
    preferredLanguage: "English",
    frameworkPreference:
      platformPreference === "Best-fit recommendation"
        ? "Henry Onyx's framework recommendation"
        : platformPreference,
    backendPreference: resolveFallbackBackend(input),
    hostingPreference: resolveFallbackHosting(input),
    pageRequirements,
    requiredFeatures,
    addonServices: uniqueList(
      [
        includesAny(input, ["seo", "search"]) ? "SEO setup" : "",
        includesAny(input, ["analytics", "reporting"]) ? "Analytics wiring" : "",
        includesAny(input, ["payment", "invoice", "checkout"]) ? "Payment setup" : "",
        includesAny(input, ["copy", "content"]) ? "Copy refinement" : "",
      ],
      5
    ),
    techPreferences,
    businessType: resolveFallbackBusinessType(input),
    budgetBand: resolveFallbackBudget(input),
    urgency,
    timeline:
      urgency === "No fixed deadline"
        ? "To be confirmed"
        : urgency.replace("ASAP — ", ""),
    goals: safeDescription.slice(0, 600),
    scopeNotes: `Initial structured draft generated from the supplied paragraph. Review scope, integrations, payment needs, content ownership, and launch constraints before submitting.`,
    summary: `${projectType} brief with ${requiredFeatures.slice(0, 3).join(", ").toLowerCase()}.`,
    confidence: countWords(safeDescription) >= 35 ? 0.68 : 0.56,
    uncertainties: uniqueList(
      [
        "Confirm final budget range.",
        "Confirm launch deadline and priority features.",
        "Confirm integrations and admin access needs.",
        techPreferences.length === 0 ? "Confirm preferred technology stack." : "",
      ],
      4
    ),
  };
}

export function parseAssistantJson(text: string): unknown {
  const trimmed = text.trim();
  // Anthropic Haiku 4.5 in JSON mode usually returns clean JSON; strip a
  // possible code-fence just in case.
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(fenced);
  } catch {
    // Find the first {…} block as a last-ditch fallback.
    const start = fenced.indexOf("{");
    const end = fenced.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) return null;
    try {
      return JSON.parse(fenced.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
