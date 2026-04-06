import type { ReactNode } from "react";
import { StaffHubNav } from "@/components/owner/StaffHubNav";

export default function StaffIntelligenceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <StaffHubNav />
      {children}
    </div>
  );
}
