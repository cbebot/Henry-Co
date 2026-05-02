import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { restoreNotification } from "@/lib/notification-center";

type Props = {
  params: Promise<{ notificationId: string }>;
};

export async function POST(_: Request, { params }: Props) {
  try {
    const { notificationId } = await params;
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await restoreNotification({
      notificationId,
      userId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to restore notification." }, { status: 500 });
  }
}
