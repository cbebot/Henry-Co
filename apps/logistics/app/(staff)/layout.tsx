import type { ReactNode } from "react";

/**
 * V3 PASS 21 — (staff) layout wrapper.
 *
 * The (staff) route group hosts the four operator workspaces (rider,
 * dispatcher, manager, owner). Each child route ships its own
 * `WorkspaceShell` mount because the sidebar items, division token,
 * and badges differ per role.
 *
 * This wrapper exists to keep the route group neutral — it does not
 * inject chrome of its own. Pages here run dynamic + no-revalidate so
 * authenticated checks always re-evaluate.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function StaffLayoutWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
