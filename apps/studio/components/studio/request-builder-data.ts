/**
 * The brief is split into four stages that mirror the real production
 * sequence we follow at Henry & Co. Studio after a project is signed:
 *
 *   1. PATH      — Define the kind of thing being built. This decision
 *                  drives every downstream filter (pages, modules,
 *                  framework, backend), so duplicates and irrelevant
 *                  options are removed automatically once chosen.
 *   2. SCOPE     — Pages, features, and the actual tech stack the team
 *                  will use during build (programming language, framework,
 *                  backend, hosting). What you tick here lands in the
 *                  proposal as priced line-items.
 *   3. COMMERCIAL— Domain plan, budget, urgency, and supporting context.
 *   4. ACTIVATION— Review the restated brief and exact price, attach
 *                  references, pick a team, add contact, and submit. The
 *                  brief becomes a real Studio lead with a senior team
 *                  assigned by name.
 *
 * Each stage is independently navigable (forward and back) and progress is
 * persisted across step changes — leave the page and the saved selections
 * are preserved in the in-flight component state until submit.
 */
export const requestSteps = [
  {
    key: "path",
    label: "Path",
    title: "Pick the lane that fits — package speed or custom depth.",
    body: "Packages suit familiar builds we have delivered many times. Custom suits software, portals, and one-of-a-kind products. Your choice here filters every option you'll see next.",
  },
  {
    key: "scope",
    label: "Scope",
    title: "Pages, features, and the actual tech stack we'll use.",
    body: "Tick what matters. Each page or feature is a priced line-item. Choose your programming language, framework, backend, and host — or let Henry & Co. recommend.",
  },
  {
    key: "commercial",
    label: "Context",
    title: "Domain, timing, budget, and anything we should study.",
    body: "Plain language is perfect. This step covers your web-address plan, budget, and the context that shapes your proposal.",
  },
  {
    key: "activation",
    label: "Review",
    title: "Review the brief, confirm the price, and submit.",
    body: "See the full brief and the exact price restated, add any references, choose your team, and submit — you get a real Studio record and clear next steps, never a silent inbox.",
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
