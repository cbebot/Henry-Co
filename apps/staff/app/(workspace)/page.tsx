import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * (workspace) root — DASH-9 G9 308 stub.
 *
 * Old: V1 staff workspace landing.
 * New: 308 to /modules/staff-overview (Track C operator briefing).
 *
 * Cleanup: 30-day soak then deletion (G14).
 */
export default function WorkspaceRedirect(): never {
  permanentRedirect("/modules/staff-overview");
}
