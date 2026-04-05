export const requestSteps = [
  {
    key: "path",
    label: "What you are building",
    title: "Pick the lane that fits—package speed or custom depth.",
    body: "Packages suit familiar builds we have delivered many times. Custom suits software, portals, and one-of-a-kind products.",
  },
  {
    key: "scope",
    label: "Shape of the work",
    title: "Pages, features, and the parts people will actually use.",
    body: "Tick what matters; we refine architecture and pricing with you before anything is final.",
  },
  {
    key: "commercial",
    label: "Context & launch",
    title: "Domain, timing, budget, and anything we should study.",
    body: "Plain language is perfect. This step includes your web-address plan and reference uploads.",
  },
  {
    key: "activation",
    label: "Review & send",
    title: "Team fit, contact details, and submit.",
    body: "You get a real Studio record, clear next steps, and honest payment guidance—never a silent inbox.",
  },
] as const;

export function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value || 0)));
}

export function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function readinessBand(score: number) {
  if (score >= 82) return "High clarity";
  if (score >= 66) return "Commercially strong";
  if (score >= 50) return "Good foundation";
  return "Early brief";
}

export function routeRecommendation(pathway: "package" | "custom", readinessScore: number) {
  if (pathway === "package") {
    return readinessScore >= 70
      ? "Package route is commercially clean."
      : "Package route works, but a custom proposal may be a better fit.";
  }

  return readinessScore >= 70
    ? "Custom proposal route is ready for commercial review."
    : "Custom route is viable, but more references or feature clarity will sharpen pricing.";
}
