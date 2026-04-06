import { createAdminSupabase } from "@/app/lib/supabase-admin";

export type AdminClient = ReturnType<typeof createAdminSupabase>;

export type ThreadAccessRow = {
  id: string;
  slug: string;
  kind: string;
  title: string;
  division: string | null;
  visibility: string | null;
  created_at: string;
  updated_at: string;
};

export type ThreadAccessContext = {
  memberRoleByThread: Map<string, string>;
  isOwnerAdmin: boolean;
  isActiveStaff: boolean;
  divisionSet: Set<string>;
};

export async function listActiveOwnerIds(admin: AdminClient) {
  const { data } = await admin
    .from("owner_profiles")
    .select("user_id, role")
    .eq("is_active", true)
    .in("role", ["owner", "admin"]);

  return (data || [])
    .map((row) => String(row.user_id || "").trim())
    .filter(Boolean);
}

export async function fetchThread(admin: AdminClient, threadId: string) {
  const { data, error } = await admin
    .from("hq_internal_comm_threads")
    .select("id, slug, kind, title, division, visibility, created_at, updated_at")
    .eq("id", threadId)
    .maybeSingle();

  if (error) return { ok: false as const, error };
  if (!data) return { ok: false as const, error: new Error("not_found") };
  return { ok: true as const, thread: data as ThreadAccessRow };
}

export async function loadThreadAccessContext(admin: AdminClient, userId: string): Promise<ThreadAccessContext> {
  const [{ data: memberRows }, { data: ownerRow }, { data: staffRow }, { data: divRows }] = await Promise.all([
    admin.from("hq_internal_comm_thread_members").select("thread_id, role").eq("user_id", userId),
    admin
      .from("owner_profiles")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    admin.from("workspace_staff_memberships").select("id").eq("user_id", userId).eq("is_active", true).maybeSingle(),
    admin
      .from("workspace_division_memberships")
      .select("division")
      .eq("user_id", userId)
      .eq("is_active", true),
  ]);

  const memberRoleByThread = new Map<string, string>();
  for (const row of memberRows || []) {
    const tid = String(row.thread_id || "").trim();
    if (tid) memberRoleByThread.set(tid, String(row.role || "member").toLowerCase());
  }

  const role = String(ownerRow?.role || "").trim().toLowerCase();
  const isOwnerAdmin = Boolean(ownerRow && ["owner", "admin"].includes(role));
  const isActiveStaff = Boolean(staffRow);
  const divisionSet = new Set(
    (divRows || []).map((r) => String(r.division || "").trim()).filter(Boolean)
  );

  return { memberRoleByThread, isOwnerAdmin, isActiveStaff, divisionSet };
}

export function canReadThreadFast(thread: ThreadAccessRow, ctx: ThreadAccessContext): boolean {
  if (ctx.memberRoleByThread.has(thread.id)) return true;
  const vis = String(thread.visibility || "members_only");
  if (vis !== "all_owners") return false;
  return ctx.isOwnerAdmin;
}

export function canWriteThreadFast(thread: ThreadAccessRow, ctx: ThreadAccessContext): boolean {
  const role = ctx.memberRoleByThread.get(thread.id);
  if (role) {
    return role !== "observer";
  }
  const vis = String(thread.visibility || "members_only");
  if (vis === "all_owners" && ctx.isOwnerAdmin) {
    return true;
  }
  return false;
}

export async function syncThreadMembers(
  admin: AdminClient,
  threadId: string,
  userIds: string[],
  role: "owner" | "member" | "observer" = "owner"
) {
  const uniqueIds = [...new Set(userIds.map((value) => String(value || "").trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return null;

  const { error } = await admin.from("hq_internal_comm_thread_members").upsert(
    uniqueIds.map((userId) => ({
      thread_id: threadId,
      user_id: userId,
      role,
    })),
    { onConflict: "thread_id,user_id" }
  );

  return error ?? null;
}

export async function upsertThreadMemberActivity(
  admin: AdminClient,
  input: {
    threadId: string;
    userId: string;
    defaultRole?: "owner" | "member" | "observer";
    pinned?: boolean;
    lastReadAt?: string;
  }
) {
  const { data: existing, error: loadError } = await admin
    .from("hq_internal_comm_thread_members")
    .select("role")
    .eq("thread_id", input.threadId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (loadError) {
    return loadError;
  }

  const payload: Record<string, unknown> = {};
  if (typeof input.pinned === "boolean") payload.pinned = input.pinned;
  if (typeof input.lastReadAt === "string" && input.lastReadAt.trim()) {
    payload.last_read_at = input.lastReadAt;
  }

  if (existing) {
    if (Object.keys(payload).length === 0) return null;
    const { error } = await admin
      .from("hq_internal_comm_thread_members")
      .update(payload)
      .eq("thread_id", input.threadId)
      .eq("user_id", input.userId);
    return error ?? null;
  }

  const { error } = await admin.from("hq_internal_comm_thread_members").insert({
    thread_id: input.threadId,
    user_id: input.userId,
    role: input.defaultRole || "owner",
    ...payload,
  });

  return error ?? null;
}

export async function assertThreadReadable(
  admin: AdminClient,
  userId: string,
  threadId: string,
  ctx?: ThreadAccessContext
) {
  const t = await fetchThread(admin, threadId);
  if (!t.ok) {
    return { ok: false as const, status: 404 as const, message: "Thread not found." };
  }
  const access = ctx ?? (await loadThreadAccessContext(admin, userId));
  if (!canReadThreadFast(t.thread, access)) {
    return { ok: false as const, status: 403 as const, message: "You do not have access to this thread." };
  }
  return { ok: true as const, thread: t.thread, ctx: access };
}

export async function assertThreadWritable(
  admin: AdminClient,
  userId: string,
  threadId: string,
  ctx?: ThreadAccessContext
) {
  const readable = await assertThreadReadable(admin, userId, threadId, ctx);
  if (!readable.ok) return readable;
  if (!canWriteThreadFast(readable.thread, readable.ctx)) {
    return { ok: false as const, status: 403 as const, message: "You cannot post in this thread." };
  }
  return readable;
}
