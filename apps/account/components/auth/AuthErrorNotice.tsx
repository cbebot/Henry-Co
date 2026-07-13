import { AlertCircle } from "lucide-react";

/**
 * AuthErrorNotice — a single, AA-safe inline error for auth forms.
 *
 * Uses --acct-red-text (not --acct-red) so the message clears WCAG AA on the
 * red-soft tint in both themes — the earlier forms rendered text-[--acct-red]
 * which failed contrast. role="alert" so assistive tech announces the failure.
 * The message itself is written elsewhere in the interface's voice (errors
 * state the fix, they don't apologise); this just carries it.
 */
export default function AuthErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="auth-error" role="alert">
      <AlertCircle size={17} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
