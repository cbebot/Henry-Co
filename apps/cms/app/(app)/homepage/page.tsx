import type { Metadata } from "next";
import { getHomepage } from "@/lib/cms/homepage";
import { HomepageEditor } from "./HomepageEditor";

export const metadata: Metadata = { title: "Homepage — Owner CMS" };
export const dynamic = "force-dynamic";

export default async function HomepageRoute() {
  const state = await getHomepage();

  return (
    <HomepageEditor
      id={state.id}
      content={state.content}
      updatedAt={state.updated_at}
    />
  );
}
