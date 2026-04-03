import { PropertyEmptyState, PropertyStatusBadge, PropertyWorkspaceShell } from "@/components/property/ui";
import { requirePropertyRoles } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { createAdminSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SupportThreadRow = {
  id: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string | null;
  updated_at?: string | null;
};

export default async function SupportPage() {
  await requirePropertyRoles(["support", "relationship_manager", "property_admin"], "/support");
  const snapshot = await getPropertySnapshot();

  let threads: SupportThreadRow[] = [];

  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("support_threads")
      .select("id, subject, category, status, priority, updated_at")
      .eq("division", "property")
      .order("updated_at", { ascending: false })
      .limit(12);

    threads = (data as SupportThreadRow[] | null) ?? [];
  } catch {
    threads = [];
  }

  return (
    <PropertyWorkspaceShell
      kicker="Support"
      title="Support and escalation context"
      description="Support can see the inquiry queue, viewing queue, and the shared support threads generated from property activity."
      nav={getWorkspaceNavigation("/support")}
    >
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Support threads</div>
          {threads.length ? (
            <div className="mt-5 space-y-4">
              {threads.map((thread) => (
                <div key={thread.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[var(--property-ink)]">{thread.subject}</div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {thread.category || "general"} · {thread.priority || "normal"}
                      </div>
                    </div>
                    <PropertyStatusBadge status={thread.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <PropertyEmptyState
                title="No support threads yet."
                body="Inquiry and viewing flows will create support context here when they need attention."
              />
            </div>
          )}
        </div>

        <div className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="property-kicker">Notification log</div>
          {snapshot.notifications.length ? (
            <div className="mt-5 space-y-4">
              {snapshot.notifications.slice(0, 12).map((notification) => (
                <div key={notification.id} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-[var(--property-ink)]">{notification.subject}</div>
                      <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                        {notification.channel} · {notification.recipient}
                      </div>
                    </div>
                    <PropertyStatusBadge status={notification.status} />
                  </div>
                  {notification.reason ? (
                    <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{notification.reason}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <PropertyEmptyState
                title="No notification records yet."
                body="Once email or WhatsApp events fire, support can review delivery outcomes here."
              />
            </div>
          )}
        </div>
      </section>
    </PropertyWorkspaceShell>
  );
}
