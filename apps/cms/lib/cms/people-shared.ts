import type { Person } from "./people";

/**
 * Client-safe People constants, types, and PURE mappers — shared by the server
 * routes, the server data layer, and the client editor. No "use client" and no
 * server-only imports (the Person import is type-only, so it is erased), so this
 * module is safe to import from BOTH server components and client components.
 * Mappers live here (not in the "use client" actions module) so server routes
 * can call them during render without hitting a client-reference at runtime.
 */
export const PERSON_KINDS = ["owner", "leadership", "team", "manager"] as const;

/** The editable fields a person editor sends to the write layer. */
export type PersonInput = {
  id?: string;
  full_name: string;
  role_title: string;
  job_title: string;
  kind: string;
  group_key: string;
  department: string;
  page_slug: string;
  division_slug: string;
  short_bio: string;
  long_bio: string;
  photo_url: string;
  email: string;
  phone: string;
  linkedin_url: string;
  is_owner: boolean;
  is_manager: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

/** Map a fully-typed Person (server read) into the editor's input shape. */
export function personToInput(p: Person): PersonInput {
  return {
    id: p.id,
    full_name: p.full_name,
    role_title: p.role_title,
    job_title: p.job_title,
    kind: p.kind,
    group_key: p.group_key,
    department: p.department,
    page_slug: p.page_slug,
    division_slug: p.division_slug,
    short_bio: p.short_bio,
    long_bio: p.long_bio,
    photo_url: p.photo_url,
    email: p.email,
    phone: p.phone,
    linkedin_url: p.linkedin_url,
    is_owner: p.is_owner,
    is_manager: p.is_manager,
    is_featured: p.is_featured,
    is_published: p.is_published,
    sort_order: p.sort_order,
  };
}

/** A blank person for the "new person" route. */
export const EMPTY_PERSON_INPUT: PersonInput = {
  full_name: "",
  role_title: "",
  job_title: "",
  kind: "team",
  group_key: "leadership",
  department: "",
  page_slug: "about",
  division_slug: "",
  short_bio: "",
  long_bio: "",
  photo_url: "",
  email: "",
  phone: "",
  linkedin_url: "",
  is_owner: false,
  is_manager: false,
  is_featured: false,
  is_published: true,
  sort_order: 100,
};
