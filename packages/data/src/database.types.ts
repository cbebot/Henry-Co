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
 * Requires `SUPABASE_PROJECT_ID` env + a Supabase admin token via
 * `supabase login`. The owner runs this once after merge, commits the
 * regenerated file, and consumers gain the full row-typed query
 * surface across the workspace.
 *
 * Until regeneration: the shape below is a STRUCTURAL STUB that
 * mirrors the columns packages/data queries. It is sufficient for
 * DASH-1's typecheck gates BUT does not replace the live-generated
 * types for downstream consumers (DASH-2+ modules).
 *
 * The structure follows supabase-js v2's `Database` interface:
 *   { public: { Tables, Views, Functions, Enums, CompositeTypes } }
 * — empty objects are required for the keys we don't define so the
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
  is_read: boolean;
  deleted_at: string | null;
  created_at: string;
  source_division: string | null;
  action_url: string | null;
};
type CustomerNotificationInsert = CustomerNotificationRow;
type CustomerNotificationUpdate = Partial<CustomerNotificationRow>;

type CustomerActivityRow = {
  id: string;
  user_id: string;
  division: string;
  activity_type: string;
  title: string;
  created_at: string;
};
type CustomerActivityInsert = CustomerActivityRow;
type CustomerActivityUpdate = Partial<CustomerActivityRow>;

type StaffNotificationRow = {
  id: string;
  recipient_user_id: string | null;
  recipient_role: string | null;
  recipient_division: string | null;
  division: string;
  category: string;
  priority: string;
  title: string;
  body: string | null;
  action_url: string | null;
  created_at: string;
};
type StaffNotificationInsert = StaffNotificationRow;
type StaffNotificationUpdate = Partial<StaffNotificationRow>;

type TaskRow = {
  id: string;
  assigned_user_id: string | null;
  division: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};
type TaskInsert = TaskRow;
type TaskUpdate = Partial<TaskRow>;

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

type CustomerSupportThreadRow = {
  id: string;
  user_id: string;
  status: string;
  subject: string | null;
  created_at: string;
};
type CustomerSupportThreadInsert = CustomerSupportThreadRow;
type CustomerSupportThreadUpdate = Partial<CustomerSupportThreadRow>;

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
      customer_activity_log: {
        Row: CustomerActivityRow;
        Insert: CustomerActivityInsert;
        Update: CustomerActivityUpdate;
        Relationships: [];
      };
      staff_notifications: {
        Row: StaffNotificationRow;
        Insert: StaffNotificationInsert;
        Update: StaffNotificationUpdate;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: TaskInsert;
        Update: TaskUpdate;
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
      customer_support_threads: {
        Row: CustomerSupportThreadRow;
        Insert: CustomerSupportThreadInsert;
        Update: CustomerSupportThreadUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_staff_in: {
        Args: { division_key: string; role_key?: string | null };
        Returns: boolean;
      };
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
  kind: "notification" | "activity" | "task" | "staff_notification";
  source: string;
  division: string;
  priority: string;
  title: string;
  body: string | null;
  action_url: string | null;
  created_at: string;
  score: number;
};
