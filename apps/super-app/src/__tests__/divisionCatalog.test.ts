import { DIVISION_CATALOG, filterDivisions } from "@/domain/divisionCatalog";

describe("divisionCatalog", () => {
  it("includes eight divisions", () => {
    expect(DIVISION_CATALOG).toHaveLength(8);
  });

  it("filters by query", () => {
    const res = filterDivisions({
      query: "market",
      sectorId: "all",
      status: "all",
      featuredOnly: false,
    });
    expect(res.some((d) => d.slug === "marketplace")).toBe(true);
  });

  it("filters coming soon", () => {
    const res = filterDivisions({
      query: "",
      sectorId: "all",
      status: "coming_soon",
      featuredOnly: false,
    });
    expect(res.every((d) => d.status === "coming_soon")).toBe(true);
  });
});
