import { RouteLiveRefresh } from "@henryco/ui";
import { requireStaff } from "@/lib/staff-auth";
import { StaffPageHeader } from "@/components/StaffPrimitives";
import SharedSupportDesk from "@/components/support/SharedSupportDesk";
import { getStaffSupportDeskSnapshot } from "@/lib/support-desk";

export const dynamic = "force-dynamic";

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireStaff();
  const params = (await searchParams) ?? {};
  const read = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] ?? "" : value ?? "";

  const snapshot = await getStaffSupportDeskSnapshot({
    viewerId: viewer.user?.id || "",
    viewerDivisions: viewer.divisions.map((item) => item.division),
    q: read(params.q),
    status: read(params.status),
    mailbox: read(params.mailbox),
    division: read(params.division),
  });

  const selectedThreadId =
    snapshot.threads.find((thread) => thread.id === read(params.thread))?.id ||
    snapshot.threads[0]?.id ||
    "";

  return (
    <div className="staff-fade-in">
      <RouteLiveRefresh intervalMs={12000} />
      <StaffPageHeader
        eyebrow="Workspace"
        title="Support Desk"
        description="Cross-division support triage, ownership, reply, escalation, and resolution now run inside one shared staff surface."
      />

      <SharedSupportDesk
        filters={{
          q: snapshot.filters.q,
          status: snapshot.filters.status,
          mailbox: snapshot.filters.mailbox,
          division: snapshot.filters.division,
        }}
        divisions={snapshot.divisions}
        metrics={snapshot.metrics}
        threads={snapshot.threads}
        selectedThreadId={selectedThreadId}
        viewerId={viewer.user?.id || ""}
      />
    </div>
  );
}
