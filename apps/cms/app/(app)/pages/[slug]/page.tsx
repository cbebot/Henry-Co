import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageForEdit, pageLabel } from "@/lib/cms/pages";
import { PageEditor } from "./PageEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${pageLabel(slug)} — Owner CMS` };
}

export default async function EditPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = await getPageForEdit(slug);
  if (!state) notFound();

  return (
    <PageEditor
      slug={state.page.slug}
      label={pageLabel(state.page.slug)}
      live={state.page}
      draft={state.draft}
      version={state.page.version}
      hasDraft={state.page.has_draft}
    />
  );
}
