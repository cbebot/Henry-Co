/**
 * Zod schemas for runtime validation of SearchDocument shapes.
 *
 * Used at the indexing boundary (worker, backfill) so that no
 * malformed document enters Typesense, and at the role-resolver
 * boundary so that incoming SearchInput is shaped correctly.
 */

import { z } from "zod";

export const searchDivisionSchema = z.enum([
  "hub",
  "account",
  "care",
  "marketplace",
  "jobs",
  "learn",
  "logistics",
  "property",
  "studio",
  "staff",
]);

export const searchTypeSchema = z.enum([
  "division",
  "page",
  "workflow",
  "help",
  "marketplace_product",
  "marketplace_store",
  "marketplace_order",
  "job_listing",
  "job_application",
  "job_help",
  "learn_course",
  "learn_certificate",
  "learn_help",
  "logistics_tracking",
  "logistics_help",
  "property_listing",
  "property_search",
  "property_help",
  "studio_service",
  "studio_project",
  "studio_help",
  "account_workflow",
  "staff_queue",
  "staff_item",
]);

export const trustStateSchema = z.enum([
  "unknown",
  "unverified",
  "pending_review",
  "verified",
  "premium_verified",
  "restricted",
  "frozen",
  "archived",
  "closed",
  "deleted",
]);

export const roleVisibilitySchema = z.enum([
  "public",
  "authenticated",
  "owner",
  "staff",
  "staff_owner",
  "platform_owner",
]);

export const rankingSignalsSchema = z
  .object({
    popularity: z.number().min(0).max(1).optional(),
    promotion: z.number().min(-1).max(1).optional(),
    workflow_urgency: z.number().min(0).max(1).optional(),
  })
  .strict();

export const searchDocumentSchema = z.object({
  id: z.string().min(1).max(256),
  type: searchTypeSchema,
  division: searchDivisionSchema,
  title: z.string().min(1).max(512),
  summary: z.string().max(2048),
  deep_link: z.string().url().or(z.string().startsWith("/")),
  role_visibility: z.array(roleVisibilitySchema).min(1),
  trust_state: trustStateSchema,
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  ranking_signals: rankingSignalsSchema,
  tags: z.array(z.string().min(1).max(64)).max(64),
  badge: z.string().max(64).optional(),
  icon: z.string().max(64).optional(),
  owner_user_id: z.string().uuid().optional(),
  staff_scope: z.string().max(64).optional(),
});

export const searchInputSchema = z.object({
  query: z.string().max(256),
  user_id: z.string().uuid().optional(),
  role_visibility: z.array(roleVisibilitySchema).optional(),
  primary_division: searchDivisionSchema.optional(),
  collections: z.array(z.string().min(1).max(128)).optional(),
  divisions_filter: z.array(searchDivisionSchema).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().max(256).optional(),
});

export type SearchDocumentParsed = z.infer<typeof searchDocumentSchema>;
export type SearchInputParsed = z.infer<typeof searchInputSchema>;
