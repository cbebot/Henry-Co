import type { Division } from "@/domain/division";

export type ContactPayload = {
  name: string;
  email: string;
  topic: string;
  message: string;
  divisionSlug?: string | null;
};

export type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  divisionSlug: string;
  status: "completed" | "pending" | "mock";
  at: string;
};

export type DbResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ContactSubmitResult = { ok: true } | { ok: false; error: string };

export type DatabaseAdapter = {
  /** Insert corporate contact; local mock stores on-device only. */
  submitContact(payload: ContactPayload): Promise<ContactSubmitResult>;
  /**
   * Division list from remote, or `null` to fall back to bundled catalog.
   */
  fetchDivisions(): Promise<DbResult<Division[] | null>>;
  /** Cross-module activity (orders, applications) — fully mocked in local. */
  listActivity(limit?: number): Promise<DbResult<ActivityItem[]>>;
};
