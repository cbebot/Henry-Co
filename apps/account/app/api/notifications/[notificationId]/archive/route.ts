import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updateNotificationLifecycle } from "@/lib/notification-center";
import { getAccountAppLocale } from "@/lib/locale-server";
import { autoTranslate } from "@/lib/i18n/auto-translate";

type Props = {
  params: Promise<{ notificationId: string }>;
};

export async function POST(_: Request, { params }: Props) {
  const locale = await getAccountAppLocale();
  const tx = (s: string) => autoTranslate(s, locale);
  try {
    const { notificationId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: await tx("Unauthorized") }, { status: 401 });
    }

    const result = await updateNotificationLifecycle({
      notificationId,
      userId: user.id,
      action: "archive",
    });

    if (!result.ok) {
      return NextResponse.json({ error: await tx(result.error) }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: await tx("Unable to archive notification.") }, { status: 500 });
  }
}
