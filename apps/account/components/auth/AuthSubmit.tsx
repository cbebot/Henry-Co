"use client";

import { ButtonPendingContent } from "@henryco/ui";
import { Magnetic } from "@henryco/ui/public-design";

/**
 * AuthSubmit — the single primary action of an auth form: ink on gold, with
 * the Lagos-doctrine magnetic pull (the canonical @henryco/ui Magnetic — a few
 * px toward the cursor on pointer-fine devices, inert on touch / reduced-motion)
 * and a pending state driven by the shared ButtonPendingContent spinner.
 */
export default function AuthSubmit({
  label,
  pendingLabel,
  pending = false,
  disabled = false,
}: {
  label: string;
  pendingLabel: string;
  pending?: boolean;
  disabled?: boolean;
}) {
  return (
    <Magnetic strength={3} className="auth-submit-magnet">
      <button type="submit" className="auth-submit" disabled={pending || disabled}>
        <ButtonPendingContent pending={pending} pendingLabel={pendingLabel} spinnerLabel={label}>
          {label}
        </ButtonPendingContent>
      </button>
    </Magnetic>
  );
}
