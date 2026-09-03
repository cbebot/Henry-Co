import "server-only";

import { randomUUID } from "node:crypto";
import { runAiTask, noBillingPort } from "@henryco/ai-gateway/server";
import { interpretFounderAssistOutput } from "@henryco/ai-gateway";
import { createAdminSupabase } from "@/lib/supabase";
import { buildCompanyFactsForFounderAI } from "./company-facts";

/**
 * Founder Intelligence F2b — the morning-brief NARRATIVE.
 *
 * The daily owner report is deterministic and correct without any model: every
 * number in it comes straight from the live datasets. When Founder Intelligence
 * is live, this composes the executive OPENING on top — the same brain, the
 * same company-facts grounding, the same audit trail — so the brief reads like
 * a chief of staff wrote it. Best-effort by contract: any failure returns null
 * and the brief ships without a narrative, never late and never broken.
 */
export async function composeMorningBriefNarrative(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE !== "1") return null;
  try {
    const company = await buildCompanyFactsForFounderAI();
    const result = await runAiTask(
      {
        surface: "hub.founder.assist",
        actorId: "founder-cron:morning-brief",
        input: {
          messages: [
            {
              role: "user",
              content:
                "Compose my morning brief narrative: in four to six sentences, the headline of where the company stands this morning, the two or three numbers that matter most today, what changed, and the one decision today points to. Prose only — the full numbers follow below your narrative. No navigation buttons.",
            },
          ],
          company,
        },
        idempotencyKey: randomUUID(),
      },
      { billing: noBillingPort, audit: { supabase: createAdminSupabase() as never } },
    );
    if (!result.ok) return null;
    const turn = interpretFounderAssistOutput(result.value.output);
    const narrative = turn?.reply?.trim() ?? "";
    return narrative.length > 0 ? narrative.slice(0, 2400) : null;
  } catch {
    return null;
  }
}
