"use client";

import { useState, useTransition } from "react";
import { acceptInvitationAction } from "@/app/(account)/business/actions";
import { StatusLine, buttonCls } from "@/components/business/form-bits";

export default function AcceptInvitationButton({
  token,
  label,
  copy,
}: {
  token: string;
  label: string;
  copy: { invalid: string };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      // On success the action redirects; only failures return here.
      if (result && !result.ok) setError(result.error ?? copy.invalid);
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" disabled={pending} onClick={onClick} className={buttonCls}>
        {label}
      </button>
      {error ? <StatusLine tone="error" message={error} /> : null}
    </div>
  );
}
