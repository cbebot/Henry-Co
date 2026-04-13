import { getDivisionUrl, getHqUrl } from "@henryco/config";
import { ExternalLink, IdCard, ShieldCheck, Users } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { WORKFORCE_ROLE_MODEL } from "@/lib/role-model";
import {
  StaffEmptyState,
  StaffPageHeader,
  StaffPanel,
  StaffStatusBadge,
} from "@/components/StaffPrimitives";

export const dynamic = "force-dynamic";

export default async function WorkforcePage() {
  const viewer = await requireStaff();
  const hasDirectory = viewerHasPermission(viewer, "staff.directory.view");

  if (!hasDirectory) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="Operations" title="Workforce" />
        <StaffEmptyState
          icon={Users}
          title="Access restricted"
          description="You do not have permission to view the workforce governance surface. This area is available to supervisors and above."
        />
      </div>
    );
  }

  const liveAccessRows = viewer.divisions.map((division) => ({
    division: division.division,
    roles: division.roles.map((role) =>
      role
        .split(/[_-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ")
    ),
    source: division.source,
    readiness: division.readiness,
  }));

  const quickLinks = [
    {
      href: `${getHqUrl("/owner/staff")}`,
      label: "Owner staff control",
      description: "Open the live shared HQ staff surface for assignments and escalation control.",
    },
    {
      href: `${getHqUrl("/owner/staff/directory")}`,
      label: "Directory",
      description: "Inspect real staff identities and search the current workforce.",
    },
    {
      href: `${getHqUrl("/owner/staff/roles")}`,
      label: "Role governance",
      description: "Review privileged access posture, governance, and role distribution.",
    },
    {
      href: `${getDivisionUrl("care")}/owner/staff`,
      label: "Division roster example",
      description: "Open a live division-specific staff route while shared workforce unification continues.",
    },
  ];

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="Operations"
        title="Workforce"
        description="This surface now makes role boundaries explicit: live access map, queue ownership, escalation rules, and owner-summary obligations are visible instead of being hidden in code or assumed by habit."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <StaffPanel title="Live access map">
          <div className="space-y-3">
            {liveAccessRows.map((row) => (
              <div key={row.division} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold capitalize text-[var(--staff-ink)]">{row.division}</p>
                  <div className="flex flex-wrap gap-2">
                    <StaffStatusBadge label={row.source} tone={row.source === "explicit" ? "success" : "warning"} />
                    <StaffStatusBadge label={row.readiness} tone={row.readiness === "live" ? "success" : "warning"} />
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--staff-muted)]">
                  {row.roles.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </StaffPanel>

        <StaffPanel title="Boundary rules">
          <div className="space-y-3">
            {[
              "Role visibility must match actual queue ownership. If a role cannot action the workflow, it should not inherit a fake surface that suggests it can.",
              "Sensitive moderation, payout, refund, and trust overrides must remain owner- or compliance-visible and leave a logged reason.",
              "HQ launchpads are not enough. Every serious workforce role needs a queue, a next action, an escalation path, and owner-summary visibility.",
            ].map((rule) => (
              <div key={rule} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--staff-muted)]">
                {rule}
              </div>
            ))}
          </div>
        </StaffPanel>
      </div>

      <StaffPanel title="Live workforce surfaces" className="mt-6">
        <div className="grid gap-3 xl:grid-cols-2">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-3 transition-colors hover:border-[var(--staff-gold)]/35"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--staff-ink)]">{link.label}</p>
                <ExternalLink className="h-4 w-4 text-[var(--staff-muted)]" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{link.description}</p>
            </a>
          ))}
        </div>
      </StaffPanel>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <IdCard className="h-5 w-5 text-[var(--staff-accent)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Identity discipline</p>
              <p className="text-xs text-[var(--staff-muted)]">Directory access now stays limited to supervisors and above.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--staff-warning)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Governance clarity</p>
              <p className="text-xs text-[var(--staff-muted)]">What each role can see, do, and escalate is now explicit and reviewable.</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--staff-gold)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--staff-ink)]">Owner summaries</p>
              <p className="text-xs text-[var(--staff-muted)]">Every serious role now declares what should surface upward when performance or queue quality slips.</p>
            </div>
          </div>
        </div>
      </div>

      <StaffPanel title="Role model" className="mt-6">
        <div className="grid gap-4 xl:grid-cols-2">
          {WORKFORCE_ROLE_MODEL.map((role) => (
            <article key={role.id} className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--staff-ink)]">{role.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">{role.division}</p>
                </div>
                <StaffStatusBadge label={role.tone} tone={role.tone} />
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--staff-muted)]">
                <p><span className="font-semibold text-[var(--staff-ink)]">Can see:</span> {role.canSee.join(" ")}</p>
                <p><span className="font-semibold text-[var(--staff-ink)]">Can do:</span> {role.canDo.join(" ")}</p>
                <p><span className="font-semibold text-[var(--staff-ink)]">Cannot do:</span> {role.cannotDo.join(" ")}</p>
                <p><span className="font-semibold text-[var(--staff-ink)]">Owns queue:</span> {role.queue}</p>
                <p><span className="font-semibold text-[var(--staff-ink)]">Escalates:</span> {role.escalates.join(" ")}</p>
                <p><span className="font-semibold text-[var(--staff-ink)]">Logged:</span> {role.logs.join(" ")}</p>
                <p><span className="font-semibold text-[var(--staff-ink)]">Owner summaries:</span> {role.ownerSummary.join(" ")}</p>
              </div>
            </article>
          ))}
        </div>
      </StaffPanel>
    </div>
  );
}
