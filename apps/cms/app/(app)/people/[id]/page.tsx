import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPerson } from "@/lib/cms/people";
import { personToInput } from "@/lib/cms/people-shared";
import { PersonEditor } from "./PersonEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const person = await getPerson(id);
  return { title: `${person?.full_name || "Person"} — Owner CMS` };
}

export default async function EditPersonRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  return <PersonEditor person={personToInput(person)} />;
}
