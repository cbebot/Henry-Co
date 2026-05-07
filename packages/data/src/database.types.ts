/**
 * @henryco/data/database.types — workspace-root Supabase types.
 *
 * UNVERIFIED — REQUIRES OWNER REGENERATION POST-MERGE.
 *
 * The canonical regeneration command:
 *
 *   pnpm dlx supabase gen types typescript \
 *     --project-id $SUPABASE_PROJECT_ID \
 *     --schema public \
 *     > packages/data/src/database.types.ts
 *
 * Until regeneration: the shape below is a STRUCTURAL STUB that
 * mirrors the columns packages/data queries against the **live
 * production schema** (verified via `mcp Supabase list_tables` +
 * `information_schema.columns` query at 2026-05-07).
 *
 * Schema notes (real prod table names + columns the package uses):
 *   * customer_activity (NOT customer_activity_log) — has columns
 *     id, user_id, division, activity_type, title, description,
 *     status, action_url, created_at, archived_at.
 *   * support_threads (NOT customer_support_threads) — has columns
 *     id, user_id, subject, division, category, status, priority,
 *     created_at, updated_at, customer_last_read_at.
 *   * tasks does NOT exist in this database; the original DASH-1
 *     migration referenced it incorrectly. Removed from the type
 *     surface. DASH-6 will reintroduce a tasks-equivalent source if
 *     and when one ships.
 *   * staff_notifications + staff_notification_states do NOT exist in
 *     production (the V2-NOT-02-A audience migration on disk at
 *     20260502120000_staff_notifications_audience.sql has not been
 *     applied). Removed from the type surface; DASH-6 will reintroduce
 *     when the audience migration ships.
 *
 * Structure follows supabase-js v2's `Database` interface:
 *   { public: { Tables, Views, Functions, Enums, CompositeTypes } }
 * — empty objects required for the keys we don't define so the
 * client's generic constraints satisfy.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type WalletRow = {
  user_id: string;
  balance_kobo: number;
  currency: string;
};
type WalletInsert = WalletRow;
type WalletUpdate = Partial<WalletRow>;

type ProfilesRow = { id: string; role: string | null };
type ProfilesInsert = { id: string; role?: string | null };
type ProfilesUpdate = { id?: string; role?: string | null };

type OwnerProfilesRow = {
  user_id: string;
  email: string | null;
  role: string | null;
  is_active: boolean;
};
type OwnerProfilesInsert = OwnerProfilesRow;
type OwnerProfilesUpdate = Partial<OwnerProfilesRow>;

type CustomerNotificationRow = {
  id: string;
  user_id: string;
  category: string;
  priority: string;
  title: string;
  body: string | null;
  is_read: boolean | null;
  deleted_at: string | null;
  created_at: string;
  division: string | null;
  action_url: string | null;
  action_label: string | null;
};
type CustomerNotificationInsert = CustomerNotificationRow;
type CustomerNotificationUpdate = Partial<CustomerNotificationRow>;

type CustomerActivityRow = {
  id: string;
  user_id: string;
  division: string;
  activity_type: string;
  title: string;
  description: string | null;
  status: string | null;
  action_url: string | null;
  amount_kobo: number | null;
  created_at: string;
  archived_at: string | null;
};
type CustomerActivityInsert = CustomerActivityRow;
type CustomerActivityUpdate = Partial<CustomerActivityRow>;

type CustomerSubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
};
type CustomerSubscriptionInsert = CustomerSubscriptionRow;
type CustomerSubscriptionUpdate = Partial<CustomerSubscriptionRow>;

type CustomerInvoiceRow = {
  id: string;
  user_id: string;
  status: string;
  total_kobo: number;
  created_at: string;
};
type CustomerInvoiceInsert = CustomerInvoiceRow;
type CustomerInvoiceUpdate = Partial<CustomerInvoiceRow>;

type SupportThreadRow = {
  id: string;
  user_id: string;
  subject: string;
  division: string | null;
  category: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  updated_at: string;
  customer_last_read_at: string | null;
  staff_last_read_at: string | null;
};
type SupportThreadInsert = SupportThreadRow;
type SupportThreadUpdate = Partial<SupportThreadRow>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [];
      };
      owner_profiles: {
        Row: OwnerProfilesRow;
        Insert: OwnerProfilesInsert;
        Update: OwnerProfilesUpdate;
        Relationships: [];
      };
      customer_wallets: {
        Row: WalletRow;
        Insert: WalletInsert;
        Update: WalletUpdate;
        Relationships: [];
      };
      customer_notifications: {
        Row: CustomerNotificationRow;
        Insert: CustomerNotificationInsert;
        Update: CustomerNotificationUpdate;
        Relationships: [];
      };
      customer_activity: {
        Row: CustomerActivityRow;
        Insert: CustomerActivityInsert;
        Update: CustomerActivityUpdate;
        Relationships: [];
      };
      customer_subscriptions: {
        Row: CustomerSubscriptionRow;
        Insert: CustomerSubscriptionInsert;
        Update: CustomerSubscriptionUpdate;
        Relationships: [];
      };
      customer_invoices: {
        Row: CustomerInvoiceRow;
        Insert: CustomerInvoiceInsert;
        Update: CustomerInvoiceUpdate;
        Relationships: [];
      };
      support_threads: {
        Row: SupportThreadRow;
        Insert: SupportThreadInsert;
        Update: SupportThreadUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_signal_feed: {
        Args: {
          viewer_id: string;
          limit_count: number;
          after_score?: number;
          after_created_at?: string;
        };
        Returns: SignalFeedRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SignalFeedRow = {
  id: string;
  kind: "notification" | "activity";
  source: string;
  division: string;
  priority: string;
  title: string;
  body: string | null;
  action_url: string | null;
  created_at: string;
  score: number;
};
