import { COMPANY } from "@henryco/config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function staffHqUrl(
  path: string,
  searchParams: Record<string, string | string[] | undefined>
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.append(key, value);
    }
  }
  const query = qs.toString();
  const base = `https://staffhq.${COMPANY.group.baseDomain}${normalizedPath}`;
  return query ? `${base}?${query}` : base;
}

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<never> {
  const { slug } = await params;
  const sp = await searchParams;
  const path = slug?.length ? `/${slug.join("/")}` : "/";
  redirect(staffHqUrl(path, sp));
}
