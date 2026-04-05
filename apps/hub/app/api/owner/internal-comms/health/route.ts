import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { ownerAuthDeniedResponse } from "@/lib/owner-api-auth";
import { createAdminSupabase } from "@/app/lib/supabase-admin";
import { HQ_IC_STORAGE_BUCKET } from "@/app/lib/internal-comms-upload-rules";
import { isInternalCommsStorageError, logInternalCommsError } from "@/app/lib/internal-comms-errors";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireOwner();
  if (!auth.ok) {
    return ownerAuthDeniedResponse(auth);
  }

  const admin = createAdminSupabase();
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  async function probeTable(name: string) {
    const { error } = await admin.from(name).select("id").limit(1);
    if (error) {
      logInternalCommsError(`health/${name}`, error);
      checks[name] = {
        ok: false,
        detail: isInternalCommsStorageError(error) ? "schema_or_cache" : "query_error",
      };
    } else {
      checks[name] = { ok: true };
    }
  }

  await probeTable("hq_internal_comm_threads");
  await probeTable("hq_internal_comm_messages");
  await probeTable("hq_internal_comm_thread_members");
  await probeTable("hq_internal_comm_attachments");
  await probeTable("hq_internal_comm_presence");

  const { data: buckets, error: bErr } = await admin.storage.listBuckets();
  if (bErr) {
    checks.storage = { ok: false, detail: "list_buckets_failed" };
  } else {
    const hit = (buckets || []).some((b) => b.name === HQ_IC_STORAGE_BUCKET);
    checks.storage = { ok: hit, detail: hit ? undefined : "bucket_missing" };
  }

  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ ok, checks, bucket: HQ_IC_STORAGE_BUCKET }, { status: ok ? 200 : 503 });
}
