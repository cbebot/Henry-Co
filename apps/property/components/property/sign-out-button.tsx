"use client";

import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function PropertySignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = getBrowserSupabase();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="property-button-secondary inline-flex rounded-full px-4 py-3 text-sm font-semibold"
    >
      Sign out
    </button>
  );
}
