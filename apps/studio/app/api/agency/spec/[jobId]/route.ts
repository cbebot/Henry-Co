import { NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import { verifySpecFetch } from "@/lib/agency/spec-url";
import { getBuildJob, appendBuildEvent } from "@/lib/agency/store";

/**
 * GET /api/agency/spec/[jobId]?attempt=&exp=&sig= — the credential-less
 * executor pulls its frozen BuildJobSpec here (ARCHITECTURE §2.2). The signed
 * URL (short TTL, HMAC over jobId.attempt.exp) authenticates the FETCH; there
 * is no session. Returns the spec ONLY when the signature + expiry verify AND
 * the job is still in a dispatchable stage for that attempt — so a leaked link
 * cannot pull the spec of a job that already moved on.
 *
 * The spec is already PII-scrubbed at render (spec.ts); this route adds no new
 * disclosure — it just gates the read.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENCY_CALLBACK_SECRET_ENV = "STUDIO_AGENCY_CALLBACK_SECRET";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  let secret: string;
  try {
    secret = getRequiredEnv(AGENCY_CALLBACK_SECRET_ENV, `${AGENCY_CALLBACK_SECRET_ENV} required.`);
  } catch {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const { jobId } = await ctx.params;
  const url = new URL(request.url);
  const attempt = Number(url.searchParams.get("attempt"));
  const expSec = Number(url.searchParams.get("exp"));
  const sig = String(url.searchParams.get("sig") ?? "");

  const verify = verifySpecFetch({ secret, jobId, attempt, expSec, sig });
  if (!verify.ok) {
    return NextResponse.json({ error: "unauthorized", reason: verify.reason }, { status: 401 });
  }

  const job = await getBuildJob(jobId);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  // The spec is fetchable only while the job is being dispatched for THIS
  // attempt — a link cannot resurrect a spec for a job that already advanced.
  if (job.attempt !== attempt || (job.stage !== "dispatching" && job.stage !== "queued")) {
    return NextResponse.json({ error: "not fetchable" }, { status: 409 });
  }

  await appendBuildEvent(jobId, "spec_fetched", { attempt });
  return NextResponse.json({ spec: job.spec });
}
