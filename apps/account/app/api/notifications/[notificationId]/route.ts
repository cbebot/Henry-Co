import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updateNotificationLifecycle } from "@/lib/notification-center";

type Props = {
  params: Promise<{ notificationId: string }>;
};

export async function DELETE(_: Request, { params }: Props) {
  try {
    const { notificationId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await updateNotificationLifecycle({
      notificationId,
      userId: user.id,
      action: "delete",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete notification." }, { status: 500 });
  }
}
