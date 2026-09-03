import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyDraftToFields, type ProductFieldValues } from "./draft-apply";

const baseFields = (): ProductFieldValues => ({
  title: "",
  slug: "",
  summary: "",
  description: "",
  category_slug: "furniture",
  brand_slug: "",
  base_price: "",
  compare_at_price: "",
  stock: "",
  sku: "",
  lead_time: "",
  delivery_note: "",
  material: "",
  warranty: "",
  cod_eligible: false,
  feature_requested: false,
});

describe("applyDraftToFields — core listing copy overwrites", () => {
  it("overwrites title, summary, and description even when the form already has values", () => {
    const current = {
      ...baseFields(),
      title: "Old title",
      summary: "Old summary",
      description: "Old story",
    };
    const { next, applied } = applyDraftToFields(
      { title: "Aso-oke throw pillow", summary: "Handwoven accent pillow", description: "A pillow story." },
      current,
      "idea text",
    );
    assert.equal(next.title, "Aso-oke throw pillow");
    assert.equal(next.summary, "Handwoven accent pillow");
    assert.equal(next.description, "A pillow story.");
    assert.deepEqual([...applied].sort(), ["description", "summary", "title"]);
  });

  it("falls back to the seller's idea for the title when the draft has none", () => {
    const { next, applied } = applyDraftToFields(
      { summary: "S", description: "D" },
      baseFields(),
      "Handwoven aso-oke pillow",
    );
    assert.equal(next.title, "Handwoven aso-oke pillow");
    assert.ok(applied.includes("title"));
  });

  it("appends specifications to the description with a blank line when specs are non-empty", () => {
    const { next } = applyDraftToFields(
      { description: "The story.", specifications: "- Cotton\n- 45cm" },
      baseFields(),
      "idea",
    );
    assert.equal(next.description, "The story.\n\n- Cotton\n- 45cm");
  });

  it("does not glue an empty spec block onto the description", () => {
    const { next } = applyDraftToFields(
      { description: "The story.", specifications: "   " },
      baseFields(),
      "idea",
    );
    assert.equal(next.description, "The story.");
  });
});

describe("applyDraftToFields — factual fields fill only when empty", () => {
  it("fills material, warranty, delivery_note, and lead_time when they are empty", () => {
    const { next, applied } = applyDraftToFields(
      {
        description: "D",
        material: "Cotton",
        warranty: "6 months",
        deliveryNote: "Ships from Lagos",
        leadTime: "3 days",
      },
      baseFields(),
      "idea",
    );
    assert.equal(next.material, "Cotton");
    assert.equal(next.warranty, "6 months");
    assert.equal(next.delivery_note, "Ships from Lagos");
    assert.equal(next.lead_time, "3 days");
    for (const name of ["material", "warranty", "delivery_note", "lead_time"]) {
      assert.ok(applied.includes(name), `${name} should be listed as applied`);
    }
  });

  it("never overwrites facts the seller already stated", () => {
    const current = {
      ...baseFields(),
      material: "Genuine leather",
      warranty: "1 year",
      delivery_note: "Pickup only",
      lead_time: "48 hours",
    };
    const { next, applied } = applyDraftToFields(
      {
        material: "Faux leather",
        warranty: "None",
        deliveryNote: "Nationwide",
        leadTime: "2 weeks",
      },
      current,
      "",
    );
    assert.equal(next.material, "Genuine leather");
    assert.equal(next.warranty, "1 year");
    assert.equal(next.delivery_note, "Pickup only");
    assert.equal(next.lead_time, "48 hours");
    assert.deepEqual(applied, []);
  });
});

describe("applyDraftToFields — empty drafts never blank anything", () => {
  it("is a no-op for an entirely empty draft with an empty idea", () => {
    const current = {
      ...baseFields(),
      title: "Keep me",
      summary: "Keep me too",
      description: "And me",
      material: "Oak",
    };
    const { next, applied } = applyDraftToFields(
      { title: "", summary: "", description: "", category: "", specifications: "" },
      current,
      "",
    );
    assert.deepEqual(next, current);
    assert.deepEqual(applied, []);
  });

  it("keeps the existing title when the draft and idea are both blank", () => {
    const current = { ...baseFields(), title: "Existing title" };
    const { next } = applyDraftToFields({ summary: "S" }, current, "   ");
    assert.equal(next.title, "Existing title");
  });
});

describe("applyDraftToFields — the applied list is honest", () => {
  it("lists exactly the fields that changed, nothing else", () => {
    const current = { ...baseFields(), summary: "Same summary", lead_time: "5 days" };
    const { applied } = applyDraftToFields(
      { summary: "Same summary", description: "New story", leadTime: "9 days" },
      current,
      "",
    );
    assert.deepEqual(applied, ["description"]);
  });

  it("leaves boolean fields untouched and out of the applied list", () => {
    const current = { ...baseFields(), cod_eligible: true };
    const { next, applied } = applyDraftToFields({ description: "D" }, current, "idea");
    assert.equal(next.cod_eligible, true);
    assert.equal(next.feature_requested, false);
    assert.ok(!applied.includes("cod_eligible"));
    assert.ok(!applied.includes("feature_requested"));
  });

  it("does not mutate the record it was given", () => {
    const current = baseFields();
    const frozen = JSON.stringify(current);
    applyDraftToFields({ title: "T", description: "D" }, current, "idea");
    assert.equal(JSON.stringify(current), frozen);
  });
});
