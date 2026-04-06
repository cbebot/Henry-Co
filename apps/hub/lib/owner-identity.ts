import type { WorkforceMember } from "@/lib/owner-workforce-catalog";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function looksLikeUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Short technical reference — never the primary label. */
export function formatTechnicalId(value: string): string {
  const v = value.trim();
  if (v.length <= 12) return v;
  return `${v.slice(0, 8)}…${v.slice(-4)}`;
}

export function workforceMemberPrimaryLabel(member: WorkforceMember): string {
  const name = member.fullName?.trim();
  if (name) return name;
  if (member.email?.trim()) return member.email.trim();
  return "Unnamed member";
}

export function workforceMemberSecondaryLine(member: WorkforceMember): string | null {
  if (member.email?.trim() && member.fullName?.trim()) return member.email.trim();
  return null;
}

export function buildWorkforceIdentityMap(members: WorkforceMember[]) {
  const byId = new Map<string, WorkforceMember>();
  for (const m of members) {
    byId.set(m.id, m);
  }
  return byId;
}

export function resolveUserIdToLabel(userId: string | null | undefined, byId: Map<string, WorkforceMember>): string | null {
  if (!userId || !looksLikeUuid(userId)) return null;
  const m = byId.get(userId);
  if (!m) return null;
  const primary = workforceMemberPrimaryLabel(m);
  const email = m.email?.trim();
  if (email && !primary.toLowerCase().includes(email.toLowerCase())) {
    return `${primary} · ${email}`;
  }
  return primary;
}

/** Known audit row keys that may carry a user id (Supabase / custom). */
const AUDIT_USER_ID_KEYS = [
  "actor_id",
  "user_id",
  "performed_by",
  "performed_by_user_id",
  "target_user_id",
  "changed_by",
  "created_by",
  "admin_user_id",
] as const;

export function extractUserIdsFromAuditRow(row: Record<string, unknown>): string[] {
  const out = new Set<string>();
  for (const key of AUDIT_USER_ID_KEYS) {
    const v = row[key];
    if (typeof v === "string" && looksLikeUuid(v)) out.add(v);
  }
  return [...out];
}

export function formatAuditActorDisplay(
  row: Record<string, unknown>,
  byId: Map<string, WorkforceMember>
): string {
  for (const key of AUDIT_USER_ID_KEYS) {
    const resolved = resolveUserIdToLabel(typeof row[key] === "string" ? row[key] : null, byId);
    if (resolved) return resolved;
  }
  const role = row.actor_role ?? row.role;
  if (typeof role === "string" && role.trim()) return role.trim();
  const legacy = row.actor_id ?? row.user_id;
  if (typeof legacy === "string" && legacy.trim()) {
    const r = resolveUserIdToLabel(legacy, byId);
    if (r) return r;
    if (looksLikeUuid(legacy)) return `User ${formatTechnicalId(legacy)}`;
  }
  return "—";
}

export function formatAuditEntityDisplay(
  row: Record<string, unknown>,
  byId: Map<string, WorkforceMember>
): string {
  const entity = row.entity;
  const entityId = row.entity_id;

  if (typeof entity === "string") {
    const entityText = entity.trim();
    if (entityText && !looksLikeUuid(entity)) {
      if (typeof entityId === "string" && looksLikeUuid(entityId)) {
        const person = resolveUserIdToLabel(entityId, byId);
        if (person) return `${entityText}: ${person}`;
        return `${entityText} · ${formatTechnicalId(entityId)}`;
      }
      return entityText;
    }
  }

  if (typeof entityId === "string" && entityId.trim()) {
    const person = resolveUserIdToLabel(entityId, byId);
    if (person) return person;
    if (looksLikeUuid(entityId)) return `Record ${formatTechnicalId(entityId)}`;
    return entityId;
  }
  if (typeof entity === "string" && entity.trim()) return entity.trim();
  return "—";
}
