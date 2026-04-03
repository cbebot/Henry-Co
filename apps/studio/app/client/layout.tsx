import { redirect } from "next/navigation";
import { getStudioAccountUrl } from "@/lib/studio/links";

export default function StudioClientRedirectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  redirect(getStudioAccountUrl());
}
