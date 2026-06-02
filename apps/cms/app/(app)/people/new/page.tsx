import type { Metadata } from "next";
import { EMPTY_PERSON_INPUT } from "@/lib/cms/people-shared";
import { PersonEditor } from "../[id]/PersonEditor";

export const metadata: Metadata = { title: "New person — Owner CMS" };
export const dynamic = "force-dynamic";

export default function NewPersonRoute() {
  return <PersonEditor person={EMPTY_PERSON_INPUT} />;
}
