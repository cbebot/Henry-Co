"use client";

import { Shield, X } from "lucide-react";
import { useTransition } from "react";
import { endImpersonationAction } from "@/app/(staff)/owner/impersonate/actions";

export default function ImpersonationBanner({
  targetName,
  targetRole,
}: {
  targetName: string;
  targetRole: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-400/30 bg-amber-500/95 px-4 py-3 text-center text-sm font-semibold text-amber-950 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-3">
        <Shield className="h-4 w-4" />
        <span>
          Viewing as <strong>{targetName}</strong> ({targetRole}) — All actions
          are audit-logged
        </span>
        <button
          onClick={() => startTransition(() => endImpersonationAction())}
          disabled={pending}
          className="ml-4 inline-flex items-center gap-1.5 rounded-full bg-amber-950/20 px-4 py-1.5 text-xs font-bold text-amber-950 transition hover:bg-amber-950/30"
        >
          <X className="h-3 w-3" />
          {pending ? "Restoring..." : "Exit impersonation"}
        </button>
      </div>
    </div>
  );
}
