"use client";

import { useCallback, useState } from "react";
import { BriefCopilotPanel } from "@/components/studio/brief-copilot-panel";
import { StudioRequestBuilder } from "@/components/studio/request-builder";
import type { BriefCopilotStructured } from "@/lib/studio/brief-copilot-action";
import type { StudioRequestConfig } from "@/lib/studio/request-config";
import type { StudioRequestPresetResult } from "@/lib/studio/request-presets";
import type {
  StudioPackage,
  StudioService,
  StudioTeamProfile,
} from "@/lib/studio/types";

/**
 * Mounts the Brief Co-pilot above the existing StudioRequestBuilder.
 * When the co-pilot returns a structured draft, we increment a key and
 * pass the structured payload as `copilotSeed` so the builder remounts
 * with the seeded initial state. Users always remain free to edit any
 * field; the co-pilot is only a starting point.
 */
export function StudioBriefRequestEntry({
  services,
  packages,
  teams,
  requestConfig,
  preferredTeamId,
  presetHint,
}: {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  requestConfig: StudioRequestConfig;
  preferredTeamId: string | null;
  presetHint: StudioRequestPresetResult | null;
}) {
  const [copilotSeed, setCopilotSeed] = useState<BriefCopilotStructured | null>(null);
  const [seedVersion, setSeedVersion] = useState(0);

  const handleApply = useCallback((structured: BriefCopilotStructured) => {
    setCopilotSeed(structured);
    setSeedVersion((prev) => prev + 1);
    if (typeof window !== "undefined") {
      // Smoothly scroll to the brief builder so the seeded fields are
      // visible without a jarring jump.
      const target = document.getElementById("studio-brief-builder");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  return (
    <div className="space-y-12">
      <BriefCopilotPanel onApply={handleApply} />

      <div id="studio-brief-builder">
        <StudioRequestBuilder
          key={seedVersion}
          services={services}
          packages={packages}
          teams={teams}
          requestConfig={requestConfig}
          preferredTeamId={preferredTeamId}
          presetHint={presetHint}
          copilotSeed={copilotSeed}
        />
      </div>
    </div>
  );
}
