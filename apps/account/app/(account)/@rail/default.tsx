import Link from "next/link";
import { getEligibleModules, WorkspaceRail } from "@henryco/dashboard-shell";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";
import { buildUnifiedViewer } from "@henryco/auth/server";
import { requireAccountUser } from "@/lib/auth";
import { resolveModuleHomeHref } from "@/lib/module-home-href";

// Side-effect registration: import the module index so each module
// calls registerModule() before getEligibleModules(viewer) walks the
// registry. Module definitions live in packages/dashboard-modules-*.
import "@/app/(account)/_modules";

/**
 * @rail/default — parallel-route slot for the WorkspaceRail.
 *
 * DASH-2: registry-driven rail. Walks `getEligibleModules(viewer)`
 * and renders one `<RailEntry>` per registered module that returns
 * an `allow` decision for the viewer.
 *
 * The DASH-1 chrome at `apps/account/app/(account)/layout.tsx` hosts
 * the inner shell (Sidebar). The WorkspaceRail renders alongside that
 * chrome at desktop breakpoints; on mobile (< 768px) the rail is
 * hidden via `MOBILE_SHELL_CSS` and DASH-7's `<BottomActionBar>`
 * surfaces the same module entries via the Modules anchor's drawer.
 *
 * The shell's `<WorkspaceRail>` primitive ships in DASH-1 with hairline
 * borders + cream surface; the children we pass here are anchor tags
 * styled to match the existing acct-* navigation language.
 */
export default async function RailDefault() {
  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  const modules = getEligibleModules(viewer);
  if (modules.length === 0) return null;

  const primary = modules.filter((m) => m.railSlot === "primary");
  const secondary = modules.filter((m) => m.railSlot === "secondary");
  const utility = modules.filter((m) => m.railSlot === "utility");

  return (
    <WorkspaceRail label="Modules">
      {primary.map((m) => (
        <RailEntry key={m.slug} href={resolveModuleHomeHref(m)} title={m.title} icon={renderIcon(m.icon)} />
      ))}
      {secondary.length > 0 ? (
        <div
          aria-hidden
          style={{
            margin: "0.5rem 0",
            borderTop: `1px solid var(${CSS_VARS.hairline})`,
          }}
        />
      ) : null}
      {secondary.map((m) => (
        <RailEntry key={m.slug} href={resolveModuleHomeHref(m)} title={m.title} icon={renderIcon(m.icon)} />
      ))}
      {utility.length > 0 ? (
        <div
          aria-hidden
          style={{
            margin: "0.5rem 0",
            borderTop: `1px solid var(${CSS_VARS.hairline})`,
          }}
        />
      ) : null}
      {utility.map((m) => (
        <RailEntry key={m.slug} href={resolveModuleHomeHref(m)} title={m.title} icon={renderIcon(m.icon)} />
      ))}
    </WorkspaceRail>
  );
}

function renderIcon(icon: React.ReactNode | (() => React.ReactNode)): React.ReactNode {
  if (typeof icon === "function") return (icon as () => React.ReactNode)();
  return icon;
}

function RailEntry({
  href,
  title,
  icon,
}: {
  /**
   * Pre-resolved destination (via `resolveModuleHomeHref`): `/` for
   * customer-overview, a module's declared `homeHref` when present
   * (e.g. wallet → `/wallet`), else the `/modules/<slug>` catch-all.
   */
  href: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.5rem",
        color: `var(${CSS_VARS.ink})`,
        textDecoration: "none",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      <span aria-hidden style={{ display: "inline-flex", color: `var(${CSS_VARS.accentText})` }}>
        {icon}
      </span>
      <span>{title}</span>
    </Link>
  );
}
