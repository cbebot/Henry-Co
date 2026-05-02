/**
 * /pay/[paymentId] route layout.
 *
 * Inherits theme + locale + toast + AssistDock from the root layout.
 * Adds the studio-page background and a comfortable min-height so the
 * focused payment page never looks orphaned. We deliberately do not
 * render ProjectWorkspaceHeader here — the /pay route is a deliberate
 * single-purpose surface and the in-page back-link handles navigation.
 */
export default function PayRouteLayout({ children }: { children: React.ReactNode }) {
  return <div className="studio-page studio-shell min-h-screen">{children}</div>;
}
