// V3-40 — governed model loading (server-only).
//
// The scoring config is DATA (model_versions.config), owner-ratified per version.
// Two hard rules enforced here before any entity is scored under a config:
//   * structural validation (validateRiskModelConfig throws on malformed configs),
//   * opacity: a config must never carry a provider/model name — assertClientSafe
//     deep-walks it and throws on any forbidden key, so a poisoned config can never
//     even enter the scoring path, let alone a client payload.

import "server-only";

import { assertClientSafe } from "@henryco/ai-gateway";
import {
  validateRiskModelConfig,
  type RiskModelConfig,
  type RiskModelStatus,
} from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";

export interface ModelVersionRow {
  model_kind: string;
  version: string;
  status: RiskModelStatus;
  config: Record<string, unknown>;
}

export function parseModelRow(row: ModelVersionRow): RiskModelConfig {
  // Opacity gate FIRST: refuse configs carrying provider/model/cost vocabulary.
  assertClientSafe(row.config);
  const raw = row.config as {
    weights?: Record<string, number>;
    behavioralScales?: Record<string, number>;
    thresholds?: { monitor: number; review: number; freeze: number };
    advisoryCapPoints?: number;
  };
  const config: RiskModelConfig = {
    modelKind: row.model_kind,
    version: row.version,
    status: row.status,
    weights: raw.weights ?? {},
    behavioralScales: (raw.behavioralScales ?? {}) as RiskModelConfig["behavioralScales"],
    thresholds: raw.thresholds ?? { monitor: 30, review: 60, freeze: 85 },
    advisoryCapPoints: raw.advisoryCapPoints ?? 0,
  };
  validateRiskModelConfig(config);
  return config;
}

/**
 * The ONE model the batch scores under: the `live` version when one exists,
 * otherwise the newest `shadow` version. Absent table / no rows → null (the
 * risk system silently contributes nothing pre-activation).
 */
export async function loadActiveRiskModel(modelKind = "fraud_risk"): Promise<RiskModelConfig | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("model_versions")
      .select("model_kind, version, status, config, created_at")
      .eq("model_kind", modelKind)
      .in("status", ["live", "shadow"])
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return null;
    const rows = data as unknown as (ModelVersionRow & { created_at: string })[];
    const live = rows.find((row) => row.status === "live");
    const chosen = live ?? rows.find((row) => row.status === "shadow");
    if (!chosen) return null;
    return parseModelRow(chosen);
  } catch {
    return null;
  }
}
