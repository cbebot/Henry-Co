import { redirect } from "next/navigation";
import { getStaffHqUrl } from "@henryco/config";

export default function MarketplaceOperationsLayout() {
  redirect(getStaffHqUrl("/marketplace"));
}
