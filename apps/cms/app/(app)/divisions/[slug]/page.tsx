import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDivision } from "@/lib/cms/divisions";
import { DivisionEditor } from "./DivisionEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const division = await getDivision(slug);
  return { title: `${division?.name || slug} — Owner CMS` };
}

export default async function EditDivisionRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const division = await getDivision(slug);
  if (!division) notFound();

  return <DivisionEditor division={division} />;
}
