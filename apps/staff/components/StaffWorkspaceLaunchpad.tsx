import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { StaffPanel, StaffStatusBadge } from "@/components/StaffPrimitives";

export type LaunchpadLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  readiness?: "live" | "partial";
};

export function StaffWorkspaceLaunchpad({
  overview,
  links,
  notes = [],
  readiness = "live",
}: {
  overview: string;
  links: LaunchpadLink[];
  notes?: string[];
  readiness?: "live" | "partial";
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--staff-muted)]">Operational truth</p>
          <StaffStatusBadge
            label={readiness === "live" ? "Live routes" : "Partial readiness"}
            tone={readiness === "live" ? "success" : "warning"}
          />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--staff-muted)]">{overview}</p>
      </div>

      <StaffPanel title="Live control surfaces">
        {links.length === 0 ? (
          <p className="text-sm leading-relaxed text-[var(--staff-muted)]">
            No live control surfaces are available for your current role in this workspace.
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {links.map((link) => {
              const Icon = link.icon;
              const external = /^https?:\/\//i.test(link.href);

              return (
                <a
                  key={`${link.label}:${link.href}`}
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="group rounded-2xl border border-[var(--staff-line)] bg-[var(--staff-surface)] p-4 transition-all hover:border-[var(--staff-gold)]/35 hover:bg-[var(--staff-gold-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--staff-accent-soft)]">
                      <Icon className="h-5 w-5 text-[var(--staff-accent)]" />
                    </div>
                    <div className="flex items-center gap-2">
                      {link.readiness ? (
                        <StaffStatusBadge
                          label={link.readiness === "live" ? "live" : "partial"}
                          tone={link.readiness === "live" ? "success" : "warning"}
                        />
                      ) : null}
                      <ArrowUpRight className="h-4 w-4 text-[var(--staff-muted)] transition-colors group-hover:text-[var(--staff-gold)]" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--staff-ink)]">{link.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--staff-muted)]">{link.description}</p>
                </a>
              );
            })}
          </div>
        )}
      </StaffPanel>

      {notes.length > 0 ? (
        <StaffPanel title="Read this before you act">
          <div className="space-y-2">
            {notes.map((note) => (
              <p key={note} className="text-sm leading-relaxed text-[var(--staff-muted)]">
                {note}
              </p>
            ))}
          </div>
        </StaffPanel>
      ) : null}
    </div>
  );
}
