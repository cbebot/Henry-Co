import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import {
  INTERNAL_COMMS_UNAVAILABLE,
  isInternalCommsStorageError,
  logInternalCommsError,
} from "@/app/lib/internal-comms-errors";

export const runtime = "nodejs";

type MemberRow = {
  user_id: string;
  label: string;
  email_hint: string | null;
  source: "staff" | "owner" | "auth";
  can_dm: boolean;
};

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email.slice(0, 3) + "…";
  const safeLocal = local.length <= 2 ? `${local[0] ?? ""}…` : `${local.slice(0, 2)}…`;
  return `${safeLocal}@${domain}`;
}

export async function GET(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
  const admin = createAdminSupabase();

  const members = new Map<string, MemberRow>();

  const { data: staffRows, error: staffError } = await admin
    .from("workspace_staff_memberships")
    .select("user_id, full_name, normalized_email, profile_role, is_active")
    .eq("is_active", true)
    .not("user_id", "is", null)
    .limit(400);

  if (staffError) {
    if (isInternalCommsStorageError(staffError)) {
      logInternalCommsError("members/staff", staffError);
    }
  } else {
    for (const row of staffRows || []) {
      const uid = String(row.user_id || "").trim();
      if (!uid || uid === auth.user.id) continue;
      const name = String(row.full_name || "").trim();
      const email = String(row.normalized_email || "").trim();
      const role = String(row.profile_role || "").trim();
      const label = name || email || role || "Team member";
      members.set(uid, {
        user_id: uid,
        label,
        email_hint: email ? maskEmail(email) : null,
        source: "staff",
        can_dm: true,
      });
    }
  }

  const { data: ownerRows, error: ownerError } = await admin
    .from("owner_profiles")
    .select("user_id, email, role")
    .limit(200);

  if (ownerError) {
    if (isInternalCommsStorageError(ownerError)) {
      logInternalCommsError("members/owners", ownerError);
    }
  } else {
    for (const row of ownerRows || []) {
      const uid = String(row.user_id || "").trim();
      if (!uid || uid === auth.user.id) continue;
      const email = String(row.email || "").trim();
      const label = email ? email.split("@")[0] || "Owner" : "Owner";
      if (!members.has(uid)) {
        members.set(uid, {
          user_id: uid,
          label,
          email_hint: email ? maskEmail(email) : null,
          source: "owner",
          can_dm: true,
        });
      }
    }
  }

  if (q.length >= 2) {
    let page = 1;
    while (page <= 4) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const batch = data?.users ?? [];
      for (const u of batch) {
        const uid = u.id;
        if (!uid || uid === auth.user.id) continue;
        const email = u.email?.trim() || "";
        const meta = (u.user_metadata || {}) as Record<string, unknown>;
        const name =
          String(meta.full_name || meta.name || meta.display_name || "").trim() || email.split("@")[0] || "User";
        if (members.has(uid)) continue;
        members.set(uid, {
          user_id: uid,
          label: name,
          email_hint: email ? maskEmail(email) : null,
          source: "auth",
          can_dm: false,
        });
      }
      if (batch.length < 200) break;
      page += 1;
    }
  }

  let list = [...members.values()];

  if (q.length >= 2) {
    list = list.filter((m) => {
      const hay = `${m.label} ${m.email_hint || ""} ${m.user_id}`.toLowerCase();
      return hay.includes(q);
    });
  }

  list.sort((a, b) => a.label.localeCompare(b.label));

  const degraded =
    Boolean(staffError && isInternalCommsStorageError(staffError)) &&
    Boolean(ownerError && isInternalCommsStorageError(ownerError));

  return NextResponse.json({
    members: list.slice(0, 80),
    degraded,
    hint: degraded ? INTERNAL_COMMS_UNAVAILABLE : null,
  });
}
