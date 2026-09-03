import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { StudioBriefDraft } from "../../../lib/studio/request-fields";
import type { BriefCopilotStructured } from "../../../lib/studio/brief-copilot-structured";
import {
  COMPOSER_SECTIONS,
  composeChangeDescription,
  diffStructuredAgainstDraft,
  sectionForErrorKey,
  sectionIsComplete,
  sectionSummary,
} from "./sections";

const t = (text: string) => text;

/** A fully-populated draft, the shape an AI on-ramp leaves in localStorage. */
function seededDraft(overrides: Partial<StudioBriefDraft> = {}): StudioBriefDraft {
  return {
    stepIndex: 1,
    serviceKind: "website",
    pathway: "custom",
    selectedPackageId: "",
    selectedTeamId: "",
    selectedProjectType: "Executive company website",
    selectedPlatform: "Public site + private operations dashboard",
    selectedDesign: "Quiet luxury and high-trust",
    preferredLanguage: "English",
    selectedPages: ["Homepage and offer pages", "About, team, and trust pages"],
    selectedModules: ["CMS or structured content management"],
    selectedAddOns: ["SEO foundation"],
    selectedTech: ["Cloud-native / serverless preferred"],
    selectedProgrammingLanguage: "TypeScript",
    selectedFramework: "Next.js (React) — App Router",
    selectedBackend: "Supabase (Postgres + Auth + Storage)",
    selectedHosting: "Vercel (managed Next.js / Edge)",
    businessType: "Professional services firm",
    budgetBand: "₦3,500,000",
    urgency: "Standard delivery lane",
    timeline: "4-6 weeks",
    goals: "More qualified leads and calmer client onboarding.",
    scopeNotes: "Public site, services detail, and a small insights hub.",
    inspirationSummary: "Calm, editorial, high trust.",
    domainIntentJson: JSON.stringify({ path: "new", desiredLabel: "acme.ng" }),
    ...overrides,
  };
}

/** A structured result identical to the seeded draft (no-op revision). */
function structuredMatching(draft: StudioBriefDraft): BriefCopilotStructured {
  return {
    projectType: draft.selectedProjectType,
    platformPreference: draft.selectedPlatform,
    designDirection: draft.selectedDesign,
    preferredLanguage: draft.preferredLanguage,
    frameworkPreference: draft.selectedFramework,
    backendPreference: draft.selectedBackend,
    hostingPreference: draft.selectedHosting,
    pageRequirements: [...draft.selectedPages],
    requiredFeatures: [...draft.selectedModules],
    addonServices: [...draft.selectedAddOns],
    techPreferences: [...draft.selectedTech],
    businessType: draft.businessType,
    budgetBand: draft.budgetBand,
    urgency: draft.urgency,
    timeline: draft.timeline,
    goals: draft.goals,
    scopeNotes: draft.scopeNotes,
    summary: "",
    confidence: 0.8,
    uncertainties: [],
  };
}

describe("COMPOSER_SECTIONS field membership", () => {
  it("covers every brief field of the draft exactly once (stepIndex + selectedTeamId excluded)", () => {
    const draftKeys = Object.keys(seededDraft()) as (keyof StudioBriefDraft)[];
    const briefKeys = draftKeys.filter(
      (key) => key !== "stepIndex" && key !== "selectedTeamId",
    );
    const sectionKeys = COMPOSER_SECTIONS.flatMap((section) => section.fields);
    assert.equal(new Set(sectionKeys).size, sectionKeys.length, "no field appears twice");
    assert.deepEqual(
      [...sectionKeys].sort(),
      [...briefKeys].sort(),
      "sections own exactly the brief-relevant draft fields",
    );
  });

  it("declares the six approved sections in order", () => {
    assert.deepEqual(
      COMPOSER_SECTIONS.map((section) => section.key),
      ["project", "scope", "stack", "business", "domain", "goals"],
    );
  });
});

describe("sectionSummary", () => {
  it("renders non-empty prose parts for every section of a seeded draft", () => {
    const draft = seededDraft();
    for (const section of COMPOSER_SECTIONS) {
      const parts = sectionSummary(section.key, draft, { t, packageName: null });
      assert.ok(parts.length > 0, `${section.key} summary has parts`);
      for (const part of parts) {
        assert.ok(part.trim().length > 0, `${section.key} part is non-empty`);
      }
    }
  });

  it("summarises scope with counts and domain with the desired name", () => {
    const draft = seededDraft();
    const scope = sectionSummary("scope", draft, { t, packageName: null }).join(" · ");
    assert.match(scope, /2 pages/);
    assert.match(scope, /1 feature\b/);
    const domain = sectionSummary("domain", draft, { t, packageName: null }).join(" · ");
    assert.match(domain, /acme\.ng/);
  });

  it("names the chosen package on the package lane", () => {
    const draft = seededDraft({ pathway: "package", selectedPackageId: "pkg-1" });
    const parts = sectionSummary("project", draft, { t, packageName: "Launch Site" });
    assert.match(parts.join(" · "), /Launch Site/);
  });
});

describe("sectionIsComplete", () => {
  it("treats a seeded draft as complete everywhere", () => {
    const draft = seededDraft();
    for (const section of COMPOSER_SECTIONS) {
      assert.equal(sectionIsComplete(section.key, draft), true, section.key);
    }
  });

  it("flags the package lane without a package", () => {
    assert.equal(
      sectionIsComplete("project", seededDraft({ pathway: "package", selectedPackageId: "" })),
      false,
    );
    assert.equal(
      sectionIsComplete("project", seededDraft({ pathway: "package", selectedPackageId: "p1" })),
      true,
    );
  });

  it("flags an empty scope", () => {
    const draft = seededDraft({ selectedPages: [], selectedModules: [], selectedAddOns: [] });
    assert.equal(sectionIsComplete("scope", draft), false);
  });

  it("flags missing budget or business type", () => {
    assert.equal(sectionIsComplete("business", seededDraft({ budgetBand: "  " })), false);
    assert.equal(sectionIsComplete("business", seededDraft({ businessType: "" })), false);
  });

  it("flags short goals or scope notes (validateStep thresholds)", () => {
    assert.equal(sectionIsComplete("goals", seededDraft({ goals: "Grow." })), false);
    assert.equal(sectionIsComplete("goals", seededDraft({ scopeNotes: "Site." })), false);
  });

  it("flags an undecided domain, accepts a decided one", () => {
    assert.equal(sectionIsComplete("domain", seededDraft({ domainIntentJson: "" })), false);
    assert.equal(
      sectionIsComplete("domain", seededDraft({ domainIntentJson: JSON.stringify({ path: "later" }) })),
      true,
    );
    assert.equal(sectionIsComplete("domain", seededDraft({ domainIntentJson: "{oops" })), false);
  });

  it("keeps stack complete on defaults (recommendations are honest answers)", () => {
    assert.equal(sectionIsComplete("stack", seededDraft()), true);
  });
});

describe("sectionForErrorKey", () => {
  it("maps every validateStep error key to its owning section", () => {
    assert.equal(sectionForErrorKey("selectedPackageId"), "project");
    assert.equal(sectionForErrorKey("scope"), "scope");
    assert.equal(sectionForErrorKey("goals"), "goals");
    assert.equal(sectionForErrorKey("scopeNotes"), "goals");
    assert.equal(sectionForErrorKey("budgetBand"), "business");
    assert.equal(sectionForErrorKey("anything-else"), null);
  });
});

describe("diffStructuredAgainstDraft", () => {
  it("returns no diff when the structured brief matches the draft", () => {
    const draft = seededDraft();
    assert.deepEqual(diffStructuredAgainstDraft(structuredMatching(draft), draft), []);
  });

  it("ignores list ordering (set semantics)", () => {
    const draft = seededDraft();
    const structured = structuredMatching(draft);
    structured.pageRequirements = [...draft.selectedPages].reverse();
    assert.deepEqual(diffStructuredAgainstDraft(structured, draft), []);
  });

  it("keeps draft values where the structured field is empty (overlay semantics)", () => {
    const draft = seededDraft();
    const structured = structuredMatching(draft);
    structured.goals = "";
    structured.pageRequirements = [];
    assert.deepEqual(diffStructuredAgainstDraft(structured, draft), []);
  });

  it("reports a two-field change with from/to values", () => {
    const draft = seededDraft();
    const structured = structuredMatching(draft);
    structured.pageRequirements = ["Homepage and offer pages"];
    structured.requiredFeatures = [
      "CMS or structured content management",
      "Bookings, scheduling, or calendar logic",
    ];
    const diff = diffStructuredAgainstDraft(structured, draft);
    assert.equal(diff.length, 2);
    const pages = diff.find((entry) => entry.field === "selectedPages");
    assert.ok(pages);
    assert.deepEqual(pages.from, draft.selectedPages);
    assert.deepEqual(pages.to, ["Homepage and offer pages"]);
    const modules = diff.find((entry) => entry.field === "selectedModules");
    assert.ok(modules);
    assert.deepEqual(modules.to, structured.requiredFeatures);
  });

  it("adds a serviceKind follow-on when the new project type implies another lane", () => {
    const draft = seededDraft();
    const structured = structuredMatching(draft);
    structured.projectType = "Mobile app";
    const diff = diffStructuredAgainstDraft(structured, draft);
    const kind = diff.find((entry) => entry.field === "serviceKind");
    assert.ok(kind, "serviceKind change proposed");
    assert.equal(kind.to, "mobile_app");
    assert.ok(diff.some((entry) => entry.field === "selectedProjectType"));
  });

  it("never proposes a serviceKind change when the project type is unchanged", () => {
    const draft = seededDraft({ serviceKind: "internal_system" });
    const structured = structuredMatching(draft);
    const diff = diffStructuredAgainstDraft(structured, draft);
    assert.ok(!diff.some((entry) => entry.field === "serviceKind"));
  });
});

describe("composeChangeDescription", () => {
  it("wraps the current brief and the requested change in the agreed frame", () => {
    const text = composeChangeDescription(seededDraft(), "Make it 3 pages and add booking.");
    assert.match(text, /^CURRENT BRIEF:\n/);
    assert.match(text, /\nREQUESTED CHANGE:\nMake it 3 pages and add booking\./);
    assert.match(text, /Return the FULL updated brief\.$/);
  });

  it("stays within the action's 1600-character ceiling even on a fat draft", () => {
    const fat = seededDraft({
      selectedPages: Array.from({ length: 12 }, (_, i) => `Page surface number ${i + 1}`),
      selectedModules: Array.from({ length: 10 }, (_, i) => `Functional module number ${i + 1}`),
      selectedAddOns: Array.from({ length: 5 }, (_, i) => `Growth add-on number ${i + 1}`),
      selectedTech: Array.from({ length: 8 }, (_, i) => `Stack preference number ${i + 1}`),
      goals: "g".repeat(600),
      scopeNotes: "s".repeat(1000),
      inspirationSummary: "i".repeat(400),
    });
    const text = composeChangeDescription(fat, "Trim it down to a lean launch scope please.");
    assert.ok(text.length <= 1600, `length ${text.length} <= 1600`);
    assert.match(text, /REQUESTED CHANGE:/);
  });
});
