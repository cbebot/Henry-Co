import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runBundleQaGates } from "@/lib/agency/qa-gates";

const cleanBundle = {
  siteName: "River Oak Advisory",
  tagline: "Calm, trusted guidance",
  sections: [
    { kind: "hero", heading: "River Oak", body: "Advisory that earns trust.", items: [] },
    { kind: "services", heading: "What we do", body: "", items: ["Planning", "Tax"] },
  ],
  theme: { accent: "#0f766e", surface: "#ffffff", ink: "#0b0f14", fontFamily: "serif" },
};

describe("QA gates — machine, never AI-waivable", () => {
  it("passes a clean bundle", () => {
    const report = runBundleQaGates(cleanBundle);
    assert.equal(report.ok, true);
    assert.ok(report.gates.every((g) => g.severity !== "fail"));
  });

  it("hard-fails an invalid bundle", () => {
    const report = runBundleQaGates({ sections: [] });
    assert.equal(report.ok, false);
    assert.ok(report.gates.some((g) => g.key === "bundle_schema" && g.severity === "fail"));
  });

  it("hard-fails a bundle carrying a secret shape", () => {
    const report = runBundleQaGates({
      ...cleanBundle,
      sections: [{ kind: "about", heading: "Notes", body: "key sk-ABCDEF0123456789ABCDEF here", items: [] }],
    });
    assert.equal(report.ok, false);
    assert.ok(report.gates.some((g) => g.key === "no_secrets" && g.severity === "fail"));
  });

  it("hard-fails a bundle leaking a provider self-identification", () => {
    const report = runBundleQaGates({
      ...cleanBundle,
      sections: [{ kind: "about", heading: "About", body: "This site was built on Claude by the team.", items: [] }],
    });
    assert.equal(report.ok, false);
    assert.ok(report.gates.some((g) => g.key === "provider_opacity" && g.severity === "fail"));
  });

  it("does NOT flag a topical mention of a named API", () => {
    const report = runBundleQaGates({
      ...cleanBundle,
      sections: [{ kind: "services", heading: "Integrations", body: "We integrate with Stripe and OpenAI's API for you.", items: [] }],
    });
    // "OpenAI's API" is topical, not self-identification — opacity gate passes.
    assert.ok(report.gates.find((g) => g.key === "provider_opacity")?.severity === "pass");
  });

  it("hard-fails invisible text (ink === surface)", () => {
    const report = runBundleQaGates({
      ...cleanBundle,
      theme: { accent: "#0f766e", surface: "#ffffff", ink: "#ffffff", fontFamily: "sans" },
    });
    assert.equal(report.ok, false);
    assert.ok(report.gates.some((g) => g.key === "a11y_contrast" && g.severity === "fail"));
  });
});
