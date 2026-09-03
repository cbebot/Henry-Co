import { LocaleProvider } from "@henryco/i18n/react";
import { NotificationsToastViewport } from "@henryco/dashboard-shell";
import { buildUnifiedViewer } from "@henryco/auth/server";
import { isRecoverableSupabaseAuthError } from "@henryco/config";
import CarePublicShell from "@/components/public/CarePublicShell";
import { RealtimeBrowserBridge } from "@/components/RealtimeBrowserBridge";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCarePublicLocale } from "@/lib/locale-server";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getCarePublicLocale();

  // Resolve the unified viewer once, server-side. Unauthenticated
  // visitors get `null` — the realtime provider then drops to its
  // "disabled" state machine and no channels are opened, but the
  // React context is still mounted so consumer hooks (used by
  // NotificationsToastViewport below) resolve cleanly instead of
  // throwing the "useRealtime() must be used within a
  // SupabaseRealtimeProvider" error that V3-10's error.tsx was
  // catching for every visitor.
  const viewer = await (async () => {
    try {
      const supabase = await createSupabaseServer();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      return await buildUnifiedViewer({
        id: user.id,
        email: user.email ?? null,
        app_metadata: user.app_metadata as Record<string, unknown> | undefined,
        user_metadata: user.user_metadata as Record<string, unknown> | undefined,
      });
    } catch (error) {
      if (isRecoverableSupabaseAuthError(error)) return null;
      throw error;
    }
  })();

  return (
    <LocaleProvider locale={locale}>
      <RealtimeBrowserBridge viewer={viewer}>
        <CarePublicShell>{children}</CarePublicShell>
        {/* V3 PASS 21 — surface customer realtime signals (status
            changes, payment requests, etc.) shell-wide on the care
            public surfaces. Audience='customer' so staff signals do
            not leak. */}
        <NotificationsToastViewport audience="customer" />
      </RealtimeBrowserBridge>
    </LocaleProvider>
  );
}
