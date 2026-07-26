"use server";

/**
 * V3-40 — model lifecycle server actions (owner one-taps on the risk queue).
 *
 * Both re-derive the caller's roles server-side (a direct POST cannot bypass
 * the page gate) and require OWNER access inside the lifecycle lib. Promotion
 * enforces the ≥30-day shadow window; rollback requires a reason and releases
 * open enforcements taken under the rolled-back version.
 */

import { revalidatePath } from "next/cache";
import { requireSecurityStaffActor } from "@/lib/risk/actor";
import { promoteRiskModel, rollbackRiskModel } from "@/lib/risk/lifecycle";

export async function promoteRiskModelAction(formData: FormData): Promise<void> {
  const version = String(formData.get("version") ?? "").trim();
  if (!version) throw new Error("Version is required.");
  const actor = await requireSecurityStaffActor();
  const result = await promoteRiskModel(version, actor);
  if (!result.ok) throw new Error(result.message);
  revalidatePath("/modules/staff-risk");
}

export async function rollbackRiskModelAction(formData: FormData): Promise<void> {
  const version = String(formData.get("version") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!version) throw new Error("Version is required.");
  const actor = await requireSecurityStaffActor();
  const result = await rollbackRiskModel(version, reason, actor);
  if (!result.ok) throw new Error(result.message);
  revalidatePath("/modules/staff-risk");
}
