"use server";

import { redirect } from "next/navigation";
import { STAFF_LOGIN_ROUTE } from "@/lib/auth/routes";
import { getServerSupabase } from "@/lib/auth/server";

export async function signOutAction() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect(STAFF_LOGIN_ROUTE);
}
