export type DivisionStatus = "active" | "coming_soon" | "paused";

export type DivisionSector =
  | "fabric_care"
  | "technology"
  | "design"
  | "commerce"
  | "marketplace"
  | "premium_retail"
  | "vendor_platforms"
  | "general"
  | "property"
  | "real_estate"
  | "education"
  | "academy"
  | "internal_training"
  | "certification"
  | "logistics"
  | "delivery"
  | "building_materials"
  | "interior_finishes"
  | "construction_supply"
  | "engineering_support"
  | "architectural_products"
  | "project_procurement"
  | "home_improvement"
  | "commercial_development";

export type Division = {
  slug: string;
  name: string;
  shortName: string;
  status: DivisionStatus;
  featured: boolean;
  summary: string;
  highlights: string[];
  destinationUrl: string;
  sectors: DivisionSector[];
  accentHex: string;
};
