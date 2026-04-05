import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getHqUrl } from "@henryco/config";

export default async function OwnerOnlyLayout({
}: {
  children: ReactNode;
}) {
  redirect(getHqUrl("/owner/divisions/care"));
}
