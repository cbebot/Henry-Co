export type DivisionStatus = "active" | "coming_soon";

export type Division = {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  description: string;
  status: DivisionStatus;
  featured: boolean;
  accentHex: string;
  subdomain: string;
  visitUrl: string;
  iconName: string;
  sectors: string[];
};

export type DivisionBookmark = {
  divisionId: string;
  savedAt: number;
};
