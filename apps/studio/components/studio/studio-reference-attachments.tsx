"use client";

import { Link2 } from "lucide-react";
import { StudioFileField } from "@/components/studio/studio-file-field";

export function StudioReferenceAttachments() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          Inspiration links (optional)
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
          Paste sites you admire, competitors to surpass, or internal PDFs that show tone. Rough links are fine—we care
          more about direction than perfection.
        </p>
        <div className="mt-3 grid gap-3">
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder="https://a-site-whose-pace-you-like.com"
            inputMode="url"
            autoComplete="url"
          />
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder="Another reference (optional)"
            inputMode="url"
            autoComplete="url"
          />
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder="Third link (optional)"
            inputMode="url"
            autoComplete="url"
          />
        </div>
      </div>

      <div className="mt-1">
        <StudioFileField
          name="referenceFiles"
          multiple
          title="Moodboards, notes, or exports"
          description="Screenshots, short PDFs, or a messy deck—upload what you have. We only use this to understand you."
          footerHint="Files stay inside your Studio brief and project record; they are never published to the web."
        />
      </div>
    </div>
  );
}
