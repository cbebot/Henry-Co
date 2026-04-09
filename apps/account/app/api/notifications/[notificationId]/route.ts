import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updateNotificationLifecycle } from "@/lib/notification-center";

type Props = {
  params: Promise<{ notificationId: string }>;
};

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;
    const body = await request.json().catch(() => null);
    const isRead = body?.isRead !== false;
    const { error } = await createAdminSupabase()
      .from("customer_notifications")
      .update({
        is_read: isRead,
        read_at: isRead ? new Date().toISOString() : null,
      })
      .eq("user_id", user.id)
      .eq("id", notificationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to update notification." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;
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
