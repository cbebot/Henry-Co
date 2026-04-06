import { redirect } from "next/navigation";
import { getStaffHqUrl } from "@henryco/config";

export default async function ModerationPage() {
  redirect(getStaffHqUrl("/property"));
}
