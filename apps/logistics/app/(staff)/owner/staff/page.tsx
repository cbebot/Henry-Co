import { Panel, EmptyState } from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";
import { getLogisticsPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type StaffRow = {
  id: string;
  user_id: string | null;
  normalized_email: string | null;
  role: string | null;
  scope_type: string | null;
  scope_id: string | null;
  is_active: boolean;
  created_at: string;
};

async function getStaff() {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("logistics_role_memberships")
      .select(
        "id, user_id, normalized_email, role, scope_type, scope_id, is_active, created_at",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("[owner-staff] fetch failed", error);
      return [] as StaffRow[];
    }
    return (data ?? []) as StaffRow[];
  } catch (err) {
    console.error("[owner-staff] fetch threw", err);
    return [] as StaffRow[];
  }
}

export default async function OwnerStaffPage() {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const staff = await getStaff();

  return (
    <div className="space-y-8 py-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
          {t("Staff")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("Operator directory")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
          {t("Every active operator on the logistics platform with their role and scope. Role changes route through the cross-division staff hub.")}
        </p>
      </header>

      <Panel tone="flat">
        {staff.length === 0 ? (
          <EmptyState
            kicker={t("No memberships")}
            headline={t("No operators yet")}
            body={t("Invite riders, dispatchers, and managers — their memberships will appear here once accepted.")}
          />
        ) : (
          <ul className="divide-y divide-[var(--logistics-line)]">
            {staff.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-mono text-xs text-white/80">
                    {row.normalized_email || row.user_id?.slice(0, 8) || "—"}
                  </p>
                  <p className="text-xs text-[var(--logistics-muted)]">
                    {t("Joined")}{" "}
                    {new Date(row.created_at).toLocaleDateString(locale)} · {t("scope")}{" "}
                    {row.scope_type ? t(row.scope_type) : t("platform")}
                  </p>
                </div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                  {row.role ? t(row.role) : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
