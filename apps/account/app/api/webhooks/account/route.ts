import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { sendAccountEmail } from "@/lib/email/send";
import { welcomeEmail, securityAlertEmail, walletFundedEmail } from "@/lib/email/templates";

// Webhook endpoint for cross-division account events
// Other HenryCo apps can POST here to trigger account-level actions
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, user_id, data } = body;

    if (!event || !user_id) {
      return NextResponse.json({ error: "event and user_id required" }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Get user profile for email
    const { data: profile } = await admin
      .from("customer_profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .maybeSingle();

    const email = profile?.email;
    const name = profile?.full_name || "";

    switch (event) {
      case "account.welcome": {
        if (email) await sendAccountEmail(email, welcomeEmail(name));
        break;
      }
      case "security.alert": {
        if (email) await sendAccountEmail(email, securityAlertEmail(data?.event_name || "Security event", data?.details || ""));
        await admin.from("customer_security_log").insert({
          user_id,
          event_type: data?.event_name || event,
          ip_address: data?.ip || null,
          user_agent: data?.user_agent || null,
        });
        break;
      }
      case "wallet.funded": {
        if (email) {
          await sendAccountEmail(email, walletFundedEmail(name, data?.amount_naira || 0, data?.new_balance_naira || 0));
        }
        break;
      }
      case "activity.log": {
        await admin.from("customer_activity").insert({
          user_id,
          division: data?.division || "account",
          activity_type: data?.activity_type || "event",
          title: data?.title || "Activity",
          description: data?.description || null,
          status: data?.status || null,
          reference_type: data?.reference_type || null,
          reference_id: data?.reference_id || null,
          amount_kobo: data?.amount_kobo || null,
          action_url: data?.action_url || null,
        });
        break;
      }
      case "notification.send": {
        await admin.from("customer_notifications").insert({
          user_id,
          title: data?.title || "Notification",
          body: data?.body || "",
          category: data?.category || "general",
          priority: data?.priority || "normal",
          action_url: data?.action_url || null,
          division: data?.division || null,
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[webhook] Account webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
