import { COMPANY } from "@henryco/config";
import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function accountStaffShellUrl(
  searchParams: Record<string, string | string[] | undefined>
) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (key === "role") continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.append(key, value);
    }
  }
  qs.set("role", "staff");
  return `https://account.${COMPANY.group.baseDomain}/?${qs.toString()}`;
}

export default async function WorkspacePage({
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<never> {
  const sp = await searchParams;
  permanentRedirect(accountStaffShellUrl(sp));
}
