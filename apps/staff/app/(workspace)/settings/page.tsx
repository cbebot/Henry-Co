import { getHqUrl } from "@henryco/config";
import { BellRing, LockKeyhole, Radio, Settings } from "lucide-react";
import { requireStaff } from "@/lib/staff-auth";
import { viewerHasPermission } from "@/lib/roles";
import { StaffPageHeader, StaffEmptyState } from "@/components/StaffPrimitives";
import { StaffWorkspaceLaunchpad } from "@/components/StaffWorkspaceLaunchpad";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await requireStaff();
  const hasSettings = viewerHasPermission(viewer, "settings.view");

  if (!hasSettings) {
    return (
      <div className="staff-fade-in">
        <StaffPageHeader eyebrow="System" title="Settings" />
        <StaffEmptyState
          icon={Settings}
          title="Access restricted"
          description="You do not have permission to view platform settings. Contact a system administrator if you need access."
        />
      </div>
    );
  }

  return (
    <div className="staff-fade-in">
      <StaffPageHeader
        eyebrow="System"
        title="Settings"
        description="Platform configuration, notification preferences, and system administration."
      />
      <StaffWorkspaceLaunchpad
        readiness="partial"
        overview="System settings already live inside the owner hub. This page now routes administrators to the real config surfaces instead of showing a passive placeholder."
        links={[
          {
            href: `${getHqUrl("/owner/settings")}`,
            label: "System overview",
            description: "Open the live owner settings surface for platform-level configuration.",
            icon: Settings,
            readiness: "live",
          },
          {
            href: `${getHqUrl("/owner/settings/comms")}`,
            label: "Comms settings",
            description: "Inspect internal messaging and communication posture.",
            icon: Radio,
            readiness: "live",
          },
          {
            href: `${getHqUrl("/owner/settings/security")}`,
            label: "Security settings",
            description: "Review security controls, trust posture, and hardened owner settings.",
            icon: LockKeyhole,
            readiness: "live",
          },
          {
            href: `${getHqUrl("/owner/messaging/alerts")}`,
            label: "Alert failures",
            description: "Check owner-side delivery failures and notification health.",
            icon: BellRing,
            readiness: "live",
          },
        ]}
        notes={[
          "This page is still marked partial because some personal preferences are distributed across other apps, but the system-grade settings routes above are live now.",
        ]}
      />
    </div>
  );
}
