"use client";

import { Link2 } from "lucide-react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioMiscCopy } from "@henryco/i18n";
import { StudioFileField } from "@/components/studio/studio-file-field";

export function StudioReferenceAttachments() {
  const locale = useHenryCoLocale();
  const copy = getStudioMiscCopy(locale);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--studio-signal)]">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          {copy.referenceAttachments.inspirationLinksTitle}
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--studio-ink-soft)]">
          {copy.referenceAttachments.inspirationLinksDescription}
        </p>
        <div className="mt-3 grid gap-3">
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder={copy.referenceAttachments.referencePlaceholder1}
            inputMode="url"
            autoComplete="url"
          />
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder={copy.referenceAttachments.referencePlaceholder2}
            inputMode="url"
            autoComplete="url"
          />
          <input
            name="referenceLinks"
            className="studio-input rounded-[1.2rem] px-4 py-3"
            placeholder={copy.referenceAttachments.referencePlaceholder3}
            inputMode="url"
            autoComplete="url"
          />
        </div>
      </div>

      <div className="mt-1">
        <StudioFileField
          name="referenceFiles"
          multiple
          title={copy.referenceAttachments.moodboardsTitle}
          description={copy.referenceAttachments.moodboardsDescription}
          footerHint={copy.referenceAttachments.moodboardsFooterHint}
        />
      </div>
    </div>
  );
}
