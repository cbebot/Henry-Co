import { redirect } from "next/navigation";
import { getStaffHqUrl } from "@henryco/config";

export default function OwnerDashboardPage() {
  redirect(getStaffHqUrl("/studio"));
}
