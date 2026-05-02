/**
 * Typesense collection definitions.
 *
 * Each collection is the source-of-truth for:
 *   - the Typesense schema POSTed at provisioning time
 *   - the `role_visibility` baseline used when no per-document override exists
 *   - the staff-only flag (server-side filter; never trusted from client)
 *   - the "user-scoped" flag (forces an owner_user_id filter at query time)
 *
 * Adding a new entity = add a row here, ship a migration that adds the
 * source table to the outbox, and add a hydrator to the worker. Three
 * touchpoints, all in this package and adjacent migrations.
 */

import type { SearchDivision, SearchRoleVisibility } from "./types";

export interface TypesenseField {
  name: string;
  type: "string" | "string[]" | "int32" | "int64" | "float" | "bool" | "object" | "auto";
  facet?: boolean;
  optional?: boolean;
  index?: boolean;
  sort?: boolean;
}

export interface CollectionDefinition {
  name: string;
  division: SearchDivision;
  /** Default visibility if a document does not specify role_visibility. */
  default_visibility: SearchRoleVisibility[];
  /** When true, only staff/staff_owner/platform_owner can query this collection. */
  staff_only: boolean;
  /** When true, queries require user_id and results are filtered by owner_user_id. */
  user_scoped: boolean;
  /** Typesense `default_sorting_field`. Recency is the universal default. */
  default_sorting_field: "updated_at";
  fields: TypesenseField[];
}

const BASE_FIELDS: TypesenseField[] = [
  { name: "id", type: "string", index: false },
  { name: "type", type: "string", facet: true },
  { name: "division", type: "string", facet: true },
  { name: "title", type: "string" },
  { name: "summary", type: "string", optional: true },
  { name: "deep_link", type: "string", index: false },
  { name: "role_visibility", type: "string[]", facet: true },
  { name: "trust_state", type: "string", facet: true },
  { name: "created_at", type: "int64", sort: true },
  { name: "updated_at", type: "int64", sort: true },
  { name: "tags", type: "string[]", facet: true, optional: true },
  { name: "badge", type: "string", optional: true, index: false },
  { name: "icon", type: "string", optional: true, index: false },
  { name: "owner_user_id", type: "string", optional: true, facet: true },
  { name: "staff_scope", type: "string", optional: true, facet: true },
  // ranking signals stored as flat fields for sortability
  { name: "ranking_signals.popularity", type: "float", optional: true, sort: true },
  { name: "ranking_signals.promotion", type: "float", optional: true, sort: true },
  { name: "ranking_signals.workflow_urgency", type: "float", optional: true, sort: true },
];

function defineCollection(input: {
  name: string;
  division: SearchDivision;
  default_visibility: SearchRoleVisibility[];
  staff_only?: boolean;
  user_scoped?: boolean;
  extraFields?: TypesenseField[];
}): CollectionDefinition {
  return {
    name: input.name,
    division: input.division,
    default_visibility: input.default_visibility,
    staff_only: input.staff_only ?? false,
    user_scoped: input.user_scoped ?? false,
    default_sorting_field: "updated_at",
    fields: [...BASE_FIELDS, ...(input.extraFields ?? [])],
  };
}

export const COLLECTIONS: CollectionDefinition[] = [
  defineCollection({
    name: "hc_marketplace_products",
    division: "marketplace",
    default_visibility: ["public"],
    extraFields: [
      { name: "category", type: "string", facet: true, optional: true },
      { name: "brand", type: "string", facet: true, optional: true },
      { name: "store_id", type: "string", facet: true, optional: true },
      { name: "verified_seller", type: "bool", facet: true, optional: true },
    ],
  }),
  defineCollection({
    name: "hc_marketplace_stores",
    division: "marketplace",
    default_visibility: ["public"],
    extraFields: [{ name: "verified_seller", type: "bool", facet: true, optional: true }],
  }),
  defineCollection({
    name: "hc_property_listings",
    division: "property",
    default_visibility: ["public"],
    extraFields: [
      { name: "area", type: "string", facet: true, optional: true },
      { name: "listing_type", type: "string", facet: true, optional: true },
      { name: "bedrooms", type: "int32", facet: true, optional: true },
    ],
  }),
  defineCollection({
    name: "hc_property_areas",
    division: "property",
    default_visibility: ["public"],
  }),
  defineCollection({
    name: "hc_jobs_postings",
    division: "jobs",
    default_visibility: ["public"],
    extraFields: [
      { name: "category", type: "string", facet: true, optional: true },
      { name: "remote", type: "bool", facet: true, optional: true },
      { name: "employer_id", type: "string", facet: true, optional: true },
    ],
  }),
  defineCollection({
    name: "hc_jobs_employers",
    division: "jobs",
    default_visibility: ["public"],
  }),
  defineCollection({
    name: "hc_learn_courses",
    division: "learn",
    default_visibility: ["public"],
    extraFields: [
      { name: "category", type: "string", facet: true, optional: true },
      { name: "instructor_id", type: "string", facet: true, optional: true },
    ],
  }),
  defineCollection({
    name: "hc_learn_certificates",
    division: "learn",
    // Certificate verification is a public route (verify.henrycogroup.com style),
    // but private-by-default unless the issuer marks it public.
    default_visibility: ["public"],
    extraFields: [{ name: "issued_at", type: "int64", optional: true, sort: true }],
  }),
  defineCollection({
    name: "hc_care_services",
    division: "care",
    default_visibility: ["public"],
  }),
  defineCollection({
    name: "hc_care_providers",
    division: "care",
    default_visibility: ["public"],
  }),
  defineCollection({
    name: "hc_logistics_shipments",
    division: "logistics",
    default_visibility: ["staff", "staff_owner", "platform_owner"],
    staff_only: true,
    extraFields: [
      { name: "shipment_state", type: "string", facet: true, optional: true },
      { name: "origin_city", type: "string", facet: true, optional: true },
    ],
  }),
  defineCollection({
    name: "hc_studio_projects",
    division: "studio",
    default_visibility: ["staff", "staff_owner", "platform_owner"],
    staff_only: true,
    extraFields: [{ name: "project_state", type: "string", facet: true, optional: true }],
  }),
  defineCollection({
    name: "hc_support_threads",
    division: "account",
    default_visibility: ["owner", "staff", "platform_owner"],
    user_scoped: true,
    extraFields: [{ name: "thread_state", type: "string", facet: true, optional: true }],
  }),
  defineCollection({
    name: "hc_notifications",
    division: "account",
    default_visibility: ["owner"],
    user_scoped: true,
    extraFields: [{ name: "category", type: "string", facet: true, optional: true }],
  }),
  defineCollection({
    name: "hc_workflows",
    division: "account",
    default_visibility: ["owner"],
    user_scoped: true,
    extraFields: [
      { name: "cta_label", type: "string", optional: true, index: false },
      { name: "due_at", type: "string", optional: true, index: false },
    ],
  }),
];

export const COLLECTIONS_BY_NAME: Readonly<Record<string, CollectionDefinition>> = Object.freeze(
  Object.fromEntries(COLLECTIONS.map((c) => [c.name, c])),
);

export function listPermittedCollections(input: {
  role_visibility: ReadonlyArray<string>;
  divisions_filter?: ReadonlyArray<SearchDivision>;
}): CollectionDefinition[] {
  const isStaff =
    input.role_visibility.includes("staff") ||
    input.role_visibility.includes("staff_owner") ||
    input.role_visibility.includes("platform_owner");

  return COLLECTIONS.filter((collection) => {
    if (collection.staff_only && !isStaff) return false;
    if (input.divisions_filter && !input.divisions_filter.includes(collection.division)) {
      return false;
    }
    return true;
  });
}
