import { redirect } from "next/navigation";
import { getStaffHqUrl } from "@henryco/config";

export default function MarketplaceModerationLayout() {
  redirect(getStaffHqUrl("/marketplace"));
}
