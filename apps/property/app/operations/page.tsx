import { redirect } from "next/navigation";
import { getStaffHqUrl } from "@henryco/config";

export default async function OperationsPage() {
  redirect(getStaffHqUrl("/property"));
}
