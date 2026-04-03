import type { Metadata } from "next";
import { getDivisionConfig } from "@henryco/config";
import StaffAccessPage from "@/components/auth/StaffAccessPage";

export const dynamic = "force-dynamic";

const care = getDivisionConfig("care");

export const metadata: Metadata = {
  title: `Staff Access | ${care.name}`,
  description:
    "Secure internal access for HenryCo Care owner, manager, rider, support, and staff dashboards.",
  robots: {
    index: false,
    follow: false,
  },
};

export default StaffAccessPage;
