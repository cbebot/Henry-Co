/**
 * @henryco/data/database.types — workspace-root Supabase types.
 *
 * GENERATED via 'supabase gen types typescript --project-id  --schema public'
 * against the live HenryCo & Co. Fabric Care production project at 2026-05-07.
 *
 * Regenerate command:
 *
 *   pnpm dlx supabase gen types typescript --project-id rzkbgwuznmdxnnhmjazy --schema public > packages/data/src/database.types.ts
 *
 * DO NOT EDIT BY HAND — re-run the regeneration command after schema
 * changes. Manual edits are overwritten.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_tasks: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          claim_email: string | null
          claim_phone: string | null
          claim_token: string | null
          continue_url: string
          created_at: string
          division: string | null
          id: string
          last_progress_at: string
          last_reminder_at: string | null
          legal_hold_reason: string | null
          reminder_count: number
          retention_hold_until: string | null
          state: Json
          status: string
          task_ref: string
          task_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          claim_email?: string | null
          claim_phone?: string | null
          claim_token?: string | null
          continue_url: string
          created_at?: string
          division?: string | null
          id?: string
          last_progress_at?: string
          last_reminder_at?: string | null
          legal_hold_reason?: string | null
          reminder_count?: number
          retention_hold_until?: string | null
          state?: Json
          status?: string
          task_ref: string
          task_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          claim_email?: string | null
          claim_phone?: string | null
          claim_token?: string | null
          continue_url?: string
          created_at?: string
          division?: string | null
          id?: string
          last_progress_at?: string
          last_reminder_at?: string | null
          legal_hold_reason?: string | null
          reminder_count?: number
          retention_hold_until?: string | null
          state?: Json
          status?: string
          task_ref?: string
          task_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          created_at: string
          full_address: string
          id: string
          label: string | null
          landmark: string | null
          lat: number | null
          lng: number | null
          user_id: string
          zone_id: number | null
        }
        Insert: {
          created_at?: string
          full_address: string
          id?: string
          label?: string | null
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          user_id: string
          zone_id?: number | null
        }
        Update: {
          created_at?: string
          full_address?: string
          id?: string
          label?: string | null
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          user_id?: string
          zone_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip: string | null
          legal_hold_reason: string | null
          new_values: Json | null
          old_values: Json | null
          reason: string | null
          retention_hold_until: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip?: string | null
          legal_hold_reason?: string | null
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          retention_hold_until?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip?: string | null
          legal_hold_reason?: string | null
          new_values?: Json | null
          old_values?: Json | null
          reason?: string | null
          retention_hold_until?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          country: string | null
          division_name: string
          express_turnaround_hours: number
          id: number
          standard_turnaround_hours: number
          state: string | null
          tagline: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string | null
          business_name?: string
          city?: string | null
          country?: string | null
          division_name?: string
          express_turnaround_hours?: number
          id?: never
          standard_turnaround_hours?: number
          state?: string | null
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          country?: string | null
          division_name?: string
          express_turnaround_hours?: number
          id?: never
          standard_turnaround_hours?: number
          state?: string | null
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      care_bookings: {
        Row: {
          amount_paid: number
          archive_reason: string | null
          archived_at: string | null
          balance_due: number
          created_at: string
          customer_id: string | null
          customer_name: string
          email: string | null
          id: string
          item_summary: string | null
          last_payment_email_queued_at: string | null
          last_payment_email_sent_at: string | null
          legal_hold_reason: string | null
          payment_due_at: string | null
          payment_requested_at: string | null
          payment_status: string
          phone: string
          phone_normalized: string
          pickup_address: string
          pickup_date: string
          pickup_slot: string
          quoted_subtotal: number
          quoted_total: number
          quoted_urgent_fee: number
          retention_hold_until: string | null
          service_type: string
          special_instructions: string | null
          status: string
          tracking_code: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          archive_reason?: string | null
          archived_at?: string | null
          balance_due?: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          email?: string | null
          id?: string
          item_summary?: string | null
          last_payment_email_queued_at?: string | null
          last_payment_email_sent_at?: string | null
          legal_hold_reason?: string | null
          payment_due_at?: string | null
          payment_requested_at?: string | null
          payment_status?: string
          phone: string
          phone_normalized: string
          pickup_address: string
          pickup_date: string
          pickup_slot: string
          quoted_subtotal?: number
          quoted_total?: number
          quoted_urgent_fee?: number
          retention_hold_until?: string | null
          service_type: string
          special_instructions?: string | null
          status?: string
          tracking_code?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          archive_reason?: string | null
          archived_at?: string | null
          balance_due?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          item_summary?: string | null
          last_payment_email_queued_at?: string | null
          last_payment_email_sent_at?: string | null
          legal_hold_reason?: string | null
          payment_due_at?: string | null
          payment_requested_at?: string | null
          payment_status?: string
          phone?: string
          phone_normalized?: string
          pickup_address?: string
          pickup_date?: string
          pickup_slot?: string
          quoted_subtotal?: number
          quoted_total?: number
          quoted_urgent_fee?: number
          retention_hold_until?: string | null
          service_type?: string
          special_instructions?: string | null
          status?: string
          tracking_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_expenses: {
        Row: {
          amount: number
          approval_status: string
          approved_by: string | null
          booking_id: string | null
          category: string
          created_at: string
          created_by: string | null
          created_by_role: string | null
          description: string
          division: string
          expense_date: string
          expense_no: string
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          source_route: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          approval_status?: string
          approved_by?: string | null
          booking_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          created_by_role?: string | null
          description: string
          division?: string
          expense_date?: string
          expense_no?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          source_route?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          approval_status?: string
          approved_by?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          created_by_role?: string | null
          description?: string
          division?: string
          expense_date?: string
          expense_no?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          source_route?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_expenses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "care_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      care_finance_ledger: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          direction: string
          division: string
          entry_type: string
          id: string
          narration: string | null
          source_id: string
          source_table: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          direction: string
          division?: string
          entry_type: string
          id?: string
          narration?: string | null
          source_id: string
          source_table: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          direction?: string
          division?: string
          entry_type?: string
          id?: string
          narration?: string | null
          source_id?: string
          source_table?: string
        }
        Relationships: []
      }
      care_notification_queue: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string
          error_message: string | null
          failed_at: string | null
          id: string
          payload: Json
          payment_request_id: string | null
          processed_at: string | null
          provider: string | null
          provider_message_id: string | null
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          template_key: string
        }
        Insert: {
          booking_id?: string | null
          channel: string
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          payload?: Json
          payment_request_id?: string | null
          processed_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_key: string
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          failed_at?: string | null
          id?: string
          payload?: Json
          payment_request_id?: string | null
          processed_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_notification_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "care_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_notification_queue_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "care_payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      care_order_items: {
        Row: {
          booking_id: string
          brand: string | null
          color: string | null
          created_at: string
          created_by: string | null
          garment_type: string
          id: string
          intake_status: string
          item_tag: string
          line_total: number
          notes: string | null
          pricing_category: string | null
          pricing_id: string | null
          pricing_item_name: string | null
          pricing_unit: string | null
          quantity: number
          service_type: string | null
          unit_price_snapshot: number
          urgent: boolean
          urgent_fee_snapshot: number
        }
        Insert: {
          booking_id: string
          brand?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          garment_type: string
          id?: string
          intake_status?: string
          item_tag?: string
          line_total?: number
          notes?: string | null
          pricing_category?: string | null
          pricing_id?: string | null
          pricing_item_name?: string | null
          pricing_unit?: string | null
          quantity?: number
          service_type?: string | null
          unit_price_snapshot?: number
          urgent?: boolean
          urgent_fee_snapshot?: number
        }
        Update: {
          booking_id?: string
          brand?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          garment_type?: string
          id?: string
          intake_status?: string
          item_tag?: string
          line_total?: number
          notes?: string | null
          pricing_category?: string | null
          pricing_id?: string | null
          pricing_item_name?: string | null
          pricing_unit?: string | null
          quantity?: number
          service_type?: string | null
          unit_price_snapshot?: number
          urgent?: boolean
          urgent_fee_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "care_order_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "care_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_order_items_pricing_id_fkey"
            columns: ["pricing_id"]
            isOneToOne: false
            referencedRelation: "care_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      care_payment_requests: {
        Row: {
          account_name: string | null
          account_number: string | null
          amount_due: number
          bank_name: string | null
          booking_id: string
          created_at: string
          currency: string
          id: string
          instructions: string | null
          paid_at: string | null
          payload: Json
          recipient_email: string | null
          request_kind: string
          request_no: string | null
          requested_at: string
          sent_at: string | null
          status: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          amount_due?: number
          bank_name?: string | null
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          instructions?: string | null
          paid_at?: string | null
          payload?: Json
          recipient_email?: string | null
          request_kind?: string
          request_no?: string | null
          requested_at?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          amount_due?: number
          bank_name?: string | null
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          instructions?: string | null
          paid_at?: string | null
          payload?: Json
          recipient_email?: string | null
          request_kind?: string
          request_no?: string | null
          requested_at?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_payment_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "care_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      care_payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          division: string
          id: string
          notes: string | null
          payment_method: string
          payment_no: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          division?: string
          id?: string
          notes?: string | null
          payment_method: string
          payment_no?: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          division?: string
          id?: string
          notes?: string | null
          payment_method?: string
          payment_no?: string
          received_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "care_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      care_pricing: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          item_name: string
          price: number
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          item_name: string
          price?: number
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          item_name?: string
          price?: number
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_pricing_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          item_name: string
          price: number
          sort_order: number | null
          unit: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          item_name: string
          price?: number
          sort_order?: number | null
          unit?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          item_name?: string
          price?: number
          sort_order?: number | null
          unit?: string
        }
        Relationships: []
      }
      care_reviews: {
        Row: {
          city: string | null
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          rating: number
          review_text: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          customer_name: string
          id?: string
          is_approved?: boolean
          rating: number
          review_text: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_security_logs: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          details: Json | null
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          role: string | null
          route: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          details?: Json | null
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          role?: string | null
          route?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          details?: Json | null
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          role?: string | null
          route?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      care_settings: {
        Row: {
          about_body: string
          about_title: string
          care_domain: string | null
          company_account_name: string | null
          company_account_number: string | null
          company_bank_name: string | null
          created_at: string
          favicon_url: string | null
          hero_badge: string
          hero_image_url: string | null
          hero_subtitle: string
          hero_title: string
          hub_domain: string | null
          id: string
          logo_url: string | null
          notification_reply_to_email: string | null
          notification_sender_name: string | null
          payment_account_name: string | null
          payment_account_number: string | null
          payment_bank_name: string | null
          payment_currency: string
          payment_instructions: string | null
          payment_support_email: string | null
          payment_support_whatsapp: string | null
          payment_whatsapp: string | null
          picked_up_email_body: string | null
          picked_up_email_subject: string | null
          pickup_hours: string | null
          pricing_note: string | null
          promo_video_body: string | null
          promo_video_title: string | null
          promo_video_url: string | null
          public_site_url: string | null
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          about_body?: string
          about_title?: string
          care_domain?: string | null
          company_account_name?: string | null
          company_account_number?: string | null
          company_bank_name?: string | null
          created_at?: string
          favicon_url?: string | null
          hero_badge?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          hub_domain?: string | null
          id?: string
          logo_url?: string | null
          notification_reply_to_email?: string | null
          notification_sender_name?: string | null
          payment_account_name?: string | null
          payment_account_number?: string | null
          payment_bank_name?: string | null
          payment_currency?: string
          payment_instructions?: string | null
          payment_support_email?: string | null
          payment_support_whatsapp?: string | null
          payment_whatsapp?: string | null
          picked_up_email_body?: string | null
          picked_up_email_subject?: string | null
          pickup_hours?: string | null
          pricing_note?: string | null
          promo_video_body?: string | null
          promo_video_title?: string | null
          promo_video_url?: string | null
          public_site_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          about_body?: string
          about_title?: string
          care_domain?: string | null
          company_account_name?: string | null
          company_account_number?: string | null
          company_bank_name?: string | null
          created_at?: string
          favicon_url?: string | null
          hero_badge?: string
          hero_image_url?: string | null
          hero_subtitle?: string
          hero_title?: string
          hub_domain?: string | null
          id?: string
          logo_url?: string | null
          notification_reply_to_email?: string | null
          notification_sender_name?: string | null
          payment_account_name?: string | null
          payment_account_number?: string | null
          payment_bank_name?: string | null
          payment_currency?: string
          payment_instructions?: string | null
          payment_support_email?: string | null
          payment_support_whatsapp?: string | null
          payment_whatsapp?: string | null
          picked_up_email_body?: string | null
          picked_up_email_subject?: string | null
          pickup_hours?: string | null
          pricing_note?: string | null
          promo_video_body?: string | null
          promo_video_title?: string | null
          promo_video_url?: string | null
          public_site_url?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      care_site_settings: {
        Row: {
          about_body: string | null
          about_title: string | null
          created_at: string
          hero_badge: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          pickup_hours: string | null
          pricing_note: string | null
          site_key: string
          support_email: string | null
          support_phone: string | null
          support_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          about_body?: string | null
          about_title?: string | null
          created_at?: string
          hero_badge?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          pickup_hours?: string | null
          pricing_note?: string | null
          site_key?: string
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          about_body?: string | null
          about_title?: string | null
          created_at?: string
          hero_badge?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          pickup_hours?: string | null
          pricing_note?: string | null
          site_key?: string
          support_email?: string | null
          support_phone?: string | null
          support_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_recovery_state: {
        Row: {
          last_cart_token: string | null
          last_division: string | null
          last_item_count: number
          last_subtotal_kobo: number
          last_surface: string | null
          last_visited_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_cart_token?: string | null
          last_division?: string | null
          last_item_count?: number
          last_subtotal_kobo?: number
          last_surface?: string | null
          last_visited_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_cart_token?: string | null
          last_division?: string | null
          last_item_count?: number
          last_subtotal_kobo?: number
          last_surface?: string | null
          last_visited_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          accent: string | null
          category: string | null
          created_at: string | null
          description: string | null
          href: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number | null
          status: string | null
          subdomain: string
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          accent?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          href: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          status?: string | null
          subdomain: string
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          accent?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          href?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          status?: string | null
          subdomain?: string
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_divisions: {
        Row: {
          accent: string | null
          categories: string[]
          category: string | null
          cover_public_id: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          domain: string | null
          highlights: string[]
          how_it_works: string[]
          id: string
          is_featured: boolean
          is_published: boolean
          lead_avatar_url: string | null
          lead_name: string | null
          lead_person_id: string | null
          lead_title: string | null
          logo_public_id: string | null
          logo_url: string | null
          name: string
          primary_url: string | null
          short_description: string | null
          slug: string
          sort_order: number
          status: string
          subdomain: string | null
          tagline: string | null
          trust: string[]
          updated_at: string
          who_its_for: string[]
        }
        Insert: {
          accent?: string | null
          categories?: string[]
          category?: string | null
          cover_public_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          highlights?: string[]
          how_it_works?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          lead_avatar_url?: string | null
          lead_name?: string | null
          lead_person_id?: string | null
          lead_title?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          name: string
          primary_url?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: string
          subdomain?: string | null
          tagline?: string | null
          trust?: string[]
          updated_at?: string
          who_its_for?: string[]
        }
        Update: {
          accent?: string | null
          categories?: string[]
          category?: string | null
          cover_public_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          highlights?: string[]
          how_it_works?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          lead_avatar_url?: string | null
          lead_name?: string | null
          lead_person_id?: string | null
          lead_title?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          name?: string
          primary_url?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: string
          subdomain?: string | null
          tagline?: string | null
          trust?: string[]
          updated_at?: string
          who_its_for?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "company_divisions_lead_person_id_fkey"
            columns: ["lead_person_id"]
            isOneToOne: false
            referencedRelation: "company_people"
            referencedColumns: ["id"]
          },
        ]
      }
      company_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          page_key: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          page_key?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          page_key?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_homepage_faqs: {
        Row: {
          answer: string
          id: string
          is_published: boolean
          page_slug: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          id?: string
          is_published?: boolean
          page_slug?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          id?: string
          is_published?: boolean
          page_slug?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      company_homepages: {
        Row: {
          created_at: string
          ecosystem_description: string | null
          ecosystem_heading: string | null
          faq_description: string | null
          faq_heading: string | null
          featured_description: string | null
          featured_heading: string | null
          hero_description: string | null
          hero_eyebrow: string | null
          hero_primary_cta_href: string | null
          hero_primary_cta_label: string | null
          hero_secondary_cta_href: string | null
          hero_secondary_cta_label: string | null
          hero_title: string | null
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          ecosystem_description?: string | null
          ecosystem_heading?: string | null
          faq_description?: string | null
          faq_heading?: string | null
          featured_description?: string | null
          featured_heading?: string | null
          hero_description?: string | null
          hero_eyebrow?: string | null
          hero_primary_cta_href?: string | null
          hero_primary_cta_label?: string | null
          hero_secondary_cta_href?: string | null
          hero_secondary_cta_label?: string | null
          hero_title?: string | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          ecosystem_description?: string | null
          ecosystem_heading?: string | null
          faq_description?: string | null
          faq_heading?: string | null
          featured_description?: string | null
          featured_heading?: string | null
          hero_description?: string | null
          hero_eyebrow?: string | null
          hero_primary_cta_href?: string | null
          hero_primary_cta_label?: string | null
          hero_secondary_cta_href?: string | null
          hero_secondary_cta_label?: string | null
          hero_title?: string | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      company_pages: {
        Row: {
          body: Json
          content: Json
          cover_image_public_id: string | null
          cover_image_url: string | null
          created_at: string
          cta_primary_href: string | null
          cta_primary_label: string | null
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          hero_badge: string | null
          hero_body: string | null
          hero_image_url: string | null
          hero_kicker: string | null
          hero_primary_href: string | null
          hero_primary_label: string | null
          hero_secondary_href: string | null
          hero_secondary_label: string | null
          hero_title: string | null
          id: string
          intro: string | null
          intro_body: string | null
          intro_title: string | null
          is_published: boolean
          page_key: string | null
          primary_cta_href: string | null
          primary_cta_label: string | null
          secondary_cta_href: string | null
          secondary_cta_label: string | null
          section_1_body: string | null
          section_1_title: string | null
          section_2_body: string | null
          section_2_title: string | null
          section_3_body: string | null
          section_3_title: string | null
          sections: Json
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          sort_order: number
          stats: Json
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json
          content?: Json
          cover_image_public_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          hero_badge?: string | null
          hero_body?: string | null
          hero_image_url?: string | null
          hero_kicker?: string | null
          hero_primary_href?: string | null
          hero_primary_label?: string | null
          hero_secondary_href?: string | null
          hero_secondary_label?: string | null
          hero_title?: string | null
          id?: string
          intro?: string | null
          intro_body?: string | null
          intro_title?: string | null
          is_published?: boolean
          page_key?: string | null
          primary_cta_href?: string | null
          primary_cta_label?: string | null
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          section_1_body?: string | null
          section_1_title?: string | null
          section_2_body?: string | null
          section_2_title?: string | null
          section_3_body?: string | null
          section_3_title?: string | null
          sections?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number
          stats?: Json
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json
          content?: Json
          cover_image_public_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          hero_badge?: string | null
          hero_body?: string | null
          hero_image_url?: string | null
          hero_kicker?: string | null
          hero_primary_href?: string | null
          hero_primary_label?: string | null
          hero_secondary_href?: string | null
          hero_secondary_label?: string | null
          hero_title?: string | null
          id?: string
          intro?: string | null
          intro_body?: string | null
          intro_title?: string | null
          is_published?: boolean
          page_key?: string | null
          primary_cta_href?: string | null
          primary_cta_label?: string | null
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          section_1_body?: string | null
          section_1_title?: string | null
          section_2_body?: string | null
          section_2_title?: string | null
          section_3_body?: string | null
          section_3_title?: string | null
          sections?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          sort_order?: number
          stats?: Json
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_people: {
        Row: {
          bio: string
          created_at: string
          department: string
          division_slug: string | null
          email: string | null
          full_name: string
          group_key: string
          id: string
          image_url: string
          is_featured: boolean
          is_manager: boolean
          is_owner: boolean
          is_published: boolean
          job_title: string | null
          kind: string
          linkedin_url: string | null
          long_bio: string | null
          page_key: string
          page_slug: string
          phone: string | null
          photo_public_id: string | null
          photo_url: string | null
          role_label: string | null
          role_title: string | null
          short_bio: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string
          created_at?: string
          department?: string
          division_slug?: string | null
          email?: string | null
          full_name: string
          group_key?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          is_manager?: boolean
          is_owner?: boolean
          is_published?: boolean
          job_title?: string | null
          kind?: string
          linkedin_url?: string | null
          long_bio?: string | null
          page_key?: string
          page_slug?: string
          phone?: string | null
          photo_public_id?: string | null
          photo_url?: string | null
          role_label?: string | null
          role_title?: string | null
          short_bio?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          department?: string
          division_slug?: string | null
          email?: string | null
          full_name?: string
          group_key?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          is_manager?: boolean
          is_owner?: boolean
          is_published?: boolean
          job_title?: string | null
          kind?: string
          linkedin_url?: string | null
          long_bio?: string | null
          page_key?: string
          page_slug?: string
          phone?: string | null
          photo_public_id?: string | null
          photo_url?: string | null
          role_label?: string | null
          role_title?: string | null
          short_bio?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_people_division_slug_fkey"
            columns: ["division_slug"]
            isOneToOne: false
            referencedRelation: "company_divisions"
            referencedColumns: ["slug"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          base_domain: string | null
          brand_accent: string | null
          brand_description: string | null
          brand_subtitle: string | null
          brand_title: string | null
          cloudinary_folder: string
          company_name: string
          copyright_label: string | null
          created_at: string
          default_meta_description: string | null
          default_meta_title: string | null
          favicon_public_id: string | null
          favicon_url: string | null
          footer_blurb: string | null
          id: string
          legal_name: string | null
          logo_public_id: string | null
          logo_url: string | null
          office_address: string | null
          socials: Json
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          base_domain?: string | null
          brand_accent?: string | null
          brand_description?: string | null
          brand_subtitle?: string | null
          brand_title?: string | null
          cloudinary_folder?: string
          company_name?: string
          copyright_label?: string | null
          created_at?: string
          default_meta_description?: string | null
          default_meta_title?: string | null
          favicon_public_id?: string | null
          favicon_url?: string | null
          footer_blurb?: string | null
          id?: string
          legal_name?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          office_address?: string | null
          socials?: Json
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          base_domain?: string | null
          brand_accent?: string | null
          brand_description?: string | null
          brand_subtitle?: string | null
          brand_title?: string | null
          cloudinary_folder?: string
          company_name?: string
          copyright_label?: string | null
          created_at?: string
          default_meta_description?: string | null
          default_meta_title?: string | null
          favicon_public_id?: string | null
          favicon_url?: string | null
          footer_blurb?: string | null
          id?: string
          legal_name?: string | null
          logo_public_id?: string | null
          logo_url?: string | null
          office_address?: string | null
          socials?: Json
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_site_settings: {
        Row: {
          address_line: string | null
          brand_subtitle: string
          brand_title: string
          created_at: string
          favicon_url: string | null
          footer_notice: string | null
          id: string
          legal_company_name: string
          light_logo_url: string | null
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          primary_accent: string
          secondary_accent: string
          site_key: string
          support_email: string | null
          support_phone: string | null
          theme_preference: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line?: string | null
          brand_subtitle?: string
          brand_title?: string
          created_at?: string
          favicon_url?: string | null
          footer_notice?: string | null
          id?: string
          legal_company_name?: string
          light_logo_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          primary_accent?: string
          secondary_accent?: string
          site_key?: string
          support_email?: string | null
          support_phone?: string | null
          theme_preference?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line?: string | null
          brand_subtitle?: string
          brand_title?: string
          created_at?: string
          favicon_url?: string | null
          footer_notice?: string | null
          id?: string
          legal_company_name?: string
          light_logo_url?: string | null
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          primary_accent?: string
          secondary_accent?: string
          site_key?: string
          support_email?: string | null
          support_phone?: string | null
          theme_preference?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_activity: {
        Row: {
          action_url: string | null
          activity_type: string
          amount_kobo: number | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          description: string | null
          division: string
          id: string
          legal_hold_reason: string | null
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          retention_hold_until: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          activity_type: string
          amount_kobo?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          description?: string | null
          division: string
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          activity_type?: string
          amount_kobo?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          description?: string | null
          division?: string
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          full_name: string | null
          id: string
          is_default: boolean | null
          label: string
          landmark: string | null
          lat: number | null
          lng: number | null
          phone: string | null
          postal_code: string | null
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          full_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          postal_code?: string | null
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          postal_code?: string | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_documents: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          division: string | null
          file_size: number | null
          file_url: string
          id: string
          legal_hold_reason: string | null
          metadata: Json | null
          mime_type: string | null
          name: string
          reference_id: string | null
          reference_type: string | null
          retention_hold_until: string | null
          type: string
          user_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          division?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          type?: string
          user_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          division?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_invoices: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          division: string
          due_date: string | null
          id: string
          invoice_no: string
          line_items: Json | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          subtotal_kobo: number
          tax_kobo: number | null
          total_kobo: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          division: string
          due_date?: string | null
          id?: string
          invoice_no: string
          line_items?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          subtotal_kobo: number
          tax_kobo?: number | null
          total_kobo: number
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          division?: string
          due_date?: string | null
          id?: string
          invoice_no?: string
          line_items?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          subtotal_kobo?: number
          tax_kobo?: number | null
          total_kobo?: number
          user_id?: string
        }
        Relationships: []
      }
      customer_lifecycle_snapshots: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          blocker_reason: string | null
          created_at: string
          division: string
          id: string
          last_active_at: string | null
          last_event_at: string | null
          legal_hold_reason: string | null
          metadata: Json
          next_action_label: string | null
          next_action_url: string | null
          pillar: string
          priority: string
          reference_id: string | null
          reference_type: string | null
          retention_hold_until: string | null
          stage: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          blocker_reason?: string | null
          created_at?: string
          division?: string
          id?: string
          last_active_at?: string | null
          last_event_at?: string | null
          legal_hold_reason?: string | null
          metadata?: Json
          next_action_label?: string | null
          next_action_url?: string | null
          pillar: string
          priority?: string
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          stage: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          blocker_reason?: string | null
          created_at?: string
          division?: string
          id?: string
          last_active_at?: string | null
          last_event_at?: string | null
          legal_hold_reason?: string | null
          metadata?: Json
          next_action_label?: string | null
          next_action_url?: string | null
          pillar?: string
          priority?: string
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archive_reason: string | null
          archived_at: string | null
          body: string
          category: string
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          detail_payload: Json
          division: string | null
          id: string
          is_read: boolean | null
          legal_hold_reason: string | null
          priority: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retention_hold_until: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          body: string
          category?: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          detail_payload?: Json
          division?: string | null
          id?: string
          is_read?: boolean | null
          legal_hold_reason?: string | null
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          body?: string
          category?: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          detail_payload?: Json
          division?: string | null
          id?: string
          is_read?: boolean | null
          legal_hold_reason?: string | null
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_payment_methods: {
        Row: {
          bank_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_default: boolean | null
          label: string
          last_four: string | null
          metadata: Json | null
          provider: string | null
          provider_token: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          last_four?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_token?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          last_four?: string | null
          metadata?: Json | null
          provider?: string | null
          provider_token?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_preferences: {
        Row: {
          created_at: string
          default_division: string | null
          email_digest: boolean | null
          email_marketing: boolean | null
          email_transactional: boolean | null
          id: string
          notification_care: boolean | null
          notification_jobs: boolean | null
          notification_learn: boolean | null
          notification_logistics: boolean | null
          notification_marketplace: boolean | null
          notification_property: boolean | null
          notification_security: boolean | null
          notification_studio: boolean | null
          notification_wallet: boolean | null
          push_enabled: boolean | null
          sms_enabled: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          default_division?: string | null
          email_digest?: boolean | null
          email_marketing?: boolean | null
          email_transactional?: boolean | null
          id?: string
          notification_care?: boolean | null
          notification_jobs?: boolean | null
          notification_learn?: boolean | null
          notification_logistics?: boolean | null
          notification_marketplace?: boolean | null
          notification_property?: boolean | null
          notification_security?: boolean | null
          notification_studio?: boolean | null
          notification_wallet?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          default_division?: string | null
          email_digest?: boolean | null
          email_marketing?: boolean | null
          email_transactional?: boolean | null
          id?: string
          notification_care?: boolean | null
          notification_jobs?: boolean | null
          notification_learn?: boolean | null
          notification_logistics?: boolean | null
          notification_marketplace?: boolean | null
          notification_property?: boolean | null
          notification_security?: boolean | null
          notification_studio?: boolean | null
          notification_wallet?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          avatar_url: string | null
          contact_preference: string | null
          country: string | null
          created_at: string
          currency: string | null
          date_of_birth: string | null
          deleted_at: string | null
          deleted_reason: string | null
          email: string
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          language: string | null
          last_seen_at: string | null
          legal_hold_reason: string | null
          onboarded_at: string | null
          phone: string | null
          referral_code: string | null
          retention_hold_until: string | null
          timezone: string | null
          updated_at: string
          verification_note: string | null
          verification_reviewed_at: string | null
          verification_reviewer_id: string | null
          verification_status: string
          verification_submitted_at: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          avatar_url?: string | null
          contact_preference?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen_at?: string | null
          legal_hold_reason?: string | null
          onboarded_at?: string | null
          phone?: string | null
          referral_code?: string | null
          retention_hold_until?: string | null
          timezone?: string | null
          updated_at?: string
          verification_note?: string | null
          verification_reviewed_at?: string | null
          verification_reviewer_id?: string | null
          verification_status?: string
          verification_submitted_at?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          avatar_url?: string | null
          contact_preference?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen_at?: string | null
          legal_hold_reason?: string | null
          onboarded_at?: string | null
          phone?: string | null
          referral_code?: string | null
          retention_hold_until?: string | null
          timezone?: string | null
          updated_at?: string
          verification_note?: string | null
          verification_reviewed_at?: string | null
          verification_reviewer_id?: string | null
          verification_status?: string
          verification_submitted_at?: string | null
        }
        Relationships: []
      }
      customer_security_log: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          legal_hold_reason: string | null
          metadata: Json | null
          retention_hold_until: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          retention_hold_until?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          retention_hold_until?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_subscriptions: {
        Row: {
          amount_kobo: number
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          division: string
          id: string
          metadata: Json | null
          plan_name: string
          plan_tier: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          division: string
          id?: string
          metadata?: Json | null
          plan_name: string
          plan_tier?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          division?: string
          id?: string
          metadata?: Json | null
          plan_name?: string
          plan_tier?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_verification_submissions: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          document_id: string | null
          document_type: string
          id: string
          legal_hold_reason: string | null
          retention_hold_until: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_note: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          document_id?: string | null
          document_type: string
          id?: string
          legal_hold_reason?: string | null
          retention_hold_until?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          legal_hold_reason?: string | null
          retention_hold_until?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_verification_submissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "customer_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallet_transactions: {
        Row: {
          amount_kobo: number
          archive_reason: string | null
          archived_at: string | null
          balance_after_kobo: number
          created_at: string
          description: string
          display_currency: string
          division: string | null
          exchange_rate: number
          exchange_rate_at: string | null
          exchange_rate_source: string
          id: string
          is_approximate_display: boolean
          legal_hold_reason: string | null
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          retention_hold_until: string | null
          settlement_currency: string
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_kobo: number
          archive_reason?: string | null
          archived_at?: string | null
          balance_after_kobo: number
          created_at?: string
          description: string
          display_currency?: string
          division?: string | null
          exchange_rate?: number
          exchange_rate_at?: string | null
          exchange_rate_source?: string
          id?: string
          is_approximate_display?: boolean
          legal_hold_reason?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          settlement_currency?: string
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_kobo?: number
          archive_reason?: string | null
          archived_at?: string | null
          balance_after_kobo?: number
          created_at?: string
          description?: string
          display_currency?: string
          division?: string | null
          exchange_rate?: number
          exchange_rate_at?: string | null
          exchange_rate_source?: string
          id?: string
          is_approximate_display?: boolean
          legal_hold_reason?: string | null
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          retention_hold_until?: string | null
          settlement_currency?: string
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "customer_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallets: {
        Row: {
          balance_kobo: number
          created_at: string
          currency: string
          frozen_at: string | null
          frozen_reason: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_kobo?: number
          created_at?: string
          currency?: string
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_kobo?: number
          created_at?: string
          currency?: string
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_governance_domains: {
        Row: {
          backup_dependency: string
          classification: string
          created_at: string
          display_name: string
          domain_key: string
          notes: string
          owner_team: string
          restore_priority: number
          retention_summary: string
          source_of_truth: string
          updated_at: string
        }
        Insert: {
          backup_dependency: string
          classification: string
          created_at?: string
          display_name: string
          domain_key: string
          notes?: string
          owner_team: string
          restore_priority: number
          retention_summary: string
          source_of_truth: string
          updated_at?: string
        }
        Update: {
          backup_dependency?: string
          classification?: string
          created_at?: string
          display_name?: string
          domain_key?: string
          notes?: string
          owner_team?: string
          restore_priority?: number
          retention_summary?: string
          source_of_truth?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_recovery_drill_runs: {
        Row: {
          actor_user_id: string | null
          backup_source_checked: string | null
          completed_at: string | null
          created_at: string
          domain_key: string | null
          drill_key: string
          environment: string
          gaps: Json
          id: string
          restore_target: string | null
          scope_summary: string
          started_at: string
          status: string
          storage_source_checked: string | null
          updated_at: string
          verification_results: Json
        }
        Insert: {
          actor_user_id?: string | null
          backup_source_checked?: string | null
          completed_at?: string | null
          created_at?: string
          domain_key?: string | null
          drill_key: string
          environment?: string
          gaps?: Json
          id?: string
          restore_target?: string | null
          scope_summary: string
          started_at?: string
          status?: string
          storage_source_checked?: string | null
          updated_at?: string
          verification_results?: Json
        }
        Update: {
          actor_user_id?: string | null
          backup_source_checked?: string | null
          completed_at?: string | null
          created_at?: string
          domain_key?: string | null
          drill_key?: string
          environment?: string
          gaps?: Json
          id?: string
          restore_target?: string | null
          scope_summary?: string
          started_at?: string
          status?: string
          storage_source_checked?: string | null
          updated_at?: string
          verification_results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "data_recovery_drill_runs_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "data_governance_domains"
            referencedColumns: ["domain_key"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          archive_required: boolean
          backup_requirement: string
          created_at: string
          data_classification: string
          destructive_prune_allowed: boolean
          domain_key: string
          id: string
          legal_hold_supported: boolean
          notes: string
          owner_team: string
          restore_source: string
          retention_action: string
          retention_rule: string
          schema_name: string
          soft_delete_required: boolean
          table_name: string
          updated_at: string
        }
        Insert: {
          archive_required?: boolean
          backup_requirement: string
          created_at?: string
          data_classification: string
          destructive_prune_allowed?: boolean
          domain_key: string
          id?: string
          legal_hold_supported?: boolean
          notes?: string
          owner_team: string
          restore_source: string
          retention_action: string
          retention_rule: string
          schema_name?: string
          soft_delete_required?: boolean
          table_name: string
          updated_at?: string
        }
        Update: {
          archive_required?: boolean
          backup_requirement?: string
          created_at?: string
          data_classification?: string
          destructive_prune_allowed?: boolean
          domain_key?: string
          id?: string
          legal_hold_supported?: boolean
          notes?: string
          owner_team?: string
          restore_source?: string
          retention_action?: string
          retention_rule?: string
          schema_name?: string
          soft_delete_required?: boolean
          table_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "data_governance_domains"
            referencedColumns: ["domain_key"]
          },
        ]
      }
      data_storage_surfaces: {
        Row: {
          backup_truth: string
          bucket_or_provider: string
          created_at: string
          data_classification: string
          domain_key: string
          modeled_table: string | null
          notes: string
          owner_team: string
          path_column: string | null
          restore_source: string
          retention_rule: string
          storage_system: string
          surface_key: string
          updated_at: string
        }
        Insert: {
          backup_truth: string
          bucket_or_provider: string
          created_at?: string
          data_classification: string
          domain_key: string
          modeled_table?: string | null
          notes?: string
          owner_team: string
          path_column?: string | null
          restore_source: string
          retention_rule: string
          storage_system: string
          surface_key: string
          updated_at?: string
        }
        Update: {
          backup_truth?: string
          bucket_or_provider?: string
          created_at?: string
          data_classification?: string
          domain_key?: string
          modeled_table?: string | null
          notes?: string
          owner_team?: string
          path_column?: string | null
          restore_source?: string
          retention_rule?: string
          storage_system?: string
          surface_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_storage_surfaces_domain_key_fkey"
            columns: ["domain_key"]
            isOneToOne: false
            referencedRelation: "data_governance_domains"
            referencedColumns: ["domain_key"]
          },
        ]
      }
      delivery_proofs: {
        Row: {
          created_at: string
          delivered_at: string
          geo: Json
          id: string
          note: string | null
          order_ref: string
          photo_url: string
          rider_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string
          geo?: Json
          id?: string
          note?: string | null
          order_ref: string
          photo_url: string
          rider_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string
          geo?: Json
          id?: string
          note?: string | null
          order_ref?: string
          photo_url?: string
          rider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          fee_ngn: number
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          fee_ngn?: number
          id?: never
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          fee_ngn?: number
          id?: never
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      email_audience_segments: {
        Row: {
          active: boolean
          created_at: string
          criteria: Json
          description: string
          estimated_size: number | null
          id: string
          key: string
          label: string
          last_resolved_at: string | null
          owner_team: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          criteria?: Json
          description?: string
          estimated_size?: number | null
          id?: string
          key: string
          label: string
          last_resolved_at?: string | null
          owner_team?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          criteria?: Json
          description?: string
          estimated_size?: number | null
          id?: string
          key?: string
          label?: string
          last_resolved_at?: string | null
          owner_team?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_brand_voice_rules: {
        Row: {
          active: boolean
          applies_to_classes: string[]
          created_at: string
          id: string
          kind: string
          pattern: string
          reason: string
          rule_key: string
          severity: string
        }
        Insert: {
          active?: boolean
          applies_to_classes?: string[]
          created_at?: string
          id?: string
          kind: string
          pattern: string
          reason: string
          rule_key: string
          severity?: string
        }
        Update: {
          active?: boolean
          applies_to_classes?: string[]
          created_at?: string
          id?: string
          kind?: string
          pattern?: string
          reason?: string
          rule_key?: string
          severity?: string
        }
        Relationships: []
      }
      email_campaign_sends: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          clicked_at: string | null
          complained_at: string | null
          created_at: string
          email: string
          error_code: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          provider: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          subscriber_id: string | null
          suppression_reason: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          email: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          provider?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
          suppression_reason?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          clicked_at?: string | null
          complained_at?: string | null
          created_at?: string
          email?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          provider?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
          suppression_reason?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_sends_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author_id: string | null
          campaign_class: string
          content: Json
          created_at: string
          division: string
          id: string
          key: string
          metrics: Json
          paused_reason: string | null
          scheduled_for: string | null
          segment_id: string | null
          send_completed_at: string | null
          send_started_at: string | null
          status: string
          topic_keys: string[]
          updated_at: string
          voice_guard_score: number | null
          voice_guard_warnings: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          campaign_class?: string
          content?: Json
          created_at?: string
          division?: string
          id?: string
          key: string
          metrics?: Json
          paused_reason?: string | null
          scheduled_for?: string | null
          segment_id?: string | null
          send_completed_at?: string | null
          send_started_at?: string | null
          status?: string
          topic_keys?: string[]
          updated_at?: string
          voice_guard_score?: number | null
          voice_guard_warnings?: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string | null
          campaign_class?: string
          content?: Json
          created_at?: string
          division?: string
          id?: string
          key?: string
          metrics?: Json
          paused_reason?: string | null
          scheduled_for?: string | null
          segment_id?: string | null
          send_completed_at?: string | null
          send_started_at?: string | null
          status?: string
          topic_keys?: string[]
          updated_at?: string
          voice_guard_score?: number | null
          voice_guard_warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "email_audience_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_draft_assists: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          assist_model: string | null
          campaign_id: string
          created_at: string
          human_edited_draft: Json | null
          id: string
          prompt: string | null
          raw_draft: Json
          variant: string
          voice_score: number | null
          voice_warnings: Json
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          assist_model?: string | null
          campaign_id: string
          created_at?: string
          human_edited_draft?: Json | null
          id?: string
          prompt?: string | null
          raw_draft?: Json
          variant?: string
          voice_score?: number | null
          voice_warnings?: Json
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          assist_model?: string | null
          campaign_id?: string
          created_at?: string
          human_edited_draft?: Json | null
          id?: string
          prompt?: string | null
          raw_draft?: Json
          variant?: string
          voice_score?: number | null
          voice_warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_draft_assists_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_editorial_events: {
        Row: {
          actor_id: string | null
          campaign_id: string
          created_at: string
          id: string
          kind: string
          note: string | null
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_editorial_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscriber_topics: {
        Row: {
          created_at: string
          frequency_override: string | null
          opted_in_at: string | null
          opted_out_at: string | null
          source_surface: string | null
          subscriber_id: string
          topic_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency_override?: string | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          source_surface?: string | null
          subscriber_id: string
          topic_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency_override?: string | null
          opted_in_at?: string | null
          opted_out_at?: string | null
          source_surface?: string | null
          subscriber_id?: string
          topic_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_subscriber_topics_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          confirmed_at: string | null
          consent_given_at: string | null
          country: string | null
          created_at: string
          email: string
          hard_bounce_count: number
          id: string
          last_bounced_at: string | null
          last_engagement_at: string | null
          locale: string
          metadata: Json
          provider_contact_id: string | null
          soft_bounce_count: number
          source_division: string | null
          source_surface: string | null
          status: string
          unsubscribed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          consent_given_at?: string | null
          country?: string | null
          created_at?: string
          email: string
          hard_bounce_count?: number
          id?: string
          last_bounced_at?: string | null
          last_engagement_at?: string | null
          locale?: string
          metadata?: Json
          provider_contact_id?: string | null
          soft_bounce_count?: number
          source_division?: string | null
          source_surface?: string | null
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          consent_given_at?: string | null
          country?: string | null
          created_at?: string
          email?: string
          hard_bounce_count?: number
          id?: string
          last_bounced_at?: string | null
          last_engagement_at?: string | null
          locale?: string
          metadata?: Json
          provider_contact_id?: string | null
          soft_bounce_count?: number
          source_division?: string | null
          source_surface?: string | null
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_suppression_list: {
        Row: {
          division: string | null
          email: string
          expires_at: string | null
          id: string
          note: string | null
          reason: string
          recorded_at: string
          recorded_by: string | null
          scope: string
        }
        Insert: {
          division?: string | null
          email: string
          expires_at?: string | null
          id?: string
          note?: string | null
          reason: string
          recorded_at?: string
          recorded_by?: string | null
          scope?: string
        }
        Update: {
          division?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          note?: string | null
          reason?: string
          recorded_at?: string
          recorded_by?: string | null
          scope?: string
        }
        Relationships: []
      }
      hq_internal_comm_attachments: {
        Row: {
          byte_size: number
          created_at: string
          duration_seconds: number | null
          file_name: string | null
          height: number | null
          id: string
          kind: string
          message_id: string
          mime_type: string
          storage_bucket: string
          storage_path: string
          thread_id: string
          upload_status: string
          uploader_id: string | null
          width: number | null
        }
        Insert: {
          byte_size: number
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          height?: number | null
          id?: string
          kind: string
          message_id: string
          mime_type: string
          storage_bucket?: string
          storage_path: string
          thread_id: string
          upload_status?: string
          uploader_id?: string | null
          width?: number | null
        }
        Update: {
          byte_size?: number
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          height?: number | null
          id?: string
          kind?: string
          message_id?: string
          mime_type?: string
          storage_bucket?: string
          storage_path?: string
          thread_id?: string
          upload_status?: string
          uploader_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hq_internal_comm_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "hq_internal_comm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hq_internal_comm_attachments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "hq_internal_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_internal_comm_messages: {
        Row: {
          author_id: string | null
          author_label: string | null
          body: string
          body_tsv: unknown
          client_nonce: string | null
          created_at: string
          delivery_state: string
          id: string
          parent_id: string | null
          thread_id: string
        }
        Insert: {
          author_id?: string | null
          author_label?: string | null
          body: string
          body_tsv?: unknown
          client_nonce?: string | null
          created_at?: string
          delivery_state?: string
          id?: string
          parent_id?: string | null
          thread_id: string
        }
        Update: {
          author_id?: string | null
          author_label?: string | null
          body?: string
          body_tsv?: unknown
          client_nonce?: string | null
          created_at?: string
          delivery_state?: string
          id?: string
          parent_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hq_internal_comm_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hq_internal_comm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hq_internal_comm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "hq_internal_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_internal_comm_presence: {
        Row: {
          last_seen_at: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          last_seen_at?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hq_internal_comm_presence_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "hq_internal_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_internal_comm_thread_members: {
        Row: {
          joined_at: string
          last_read_at: string | null
          muted: boolean
          pinned: boolean
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          pinned?: boolean
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hq_internal_comm_thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "hq_internal_comm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_internal_comm_threads: {
        Row: {
          created_at: string
          division: string | null
          id: string
          kind: string
          slug: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          division?: string | null
          id?: string
          kind?: string
          slug: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          division?: string | null
          id?: string
          kind?: string
          slug?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      hub_homepage_content: {
        Row: {
          created_at: string
          directory_body: string | null
          directory_title: string | null
          ecosystem_body: string | null
          ecosystem_points: Json | null
          ecosystem_title: string | null
          faq_body: string | null
          faq_title: string | null
          faqs: Json | null
          featured_body: string | null
          featured_title: string | null
          footer_blurb: string | null
          hero_badge: string | null
          hero_description: string | null
          hero_highlight: string | null
          hero_image_url: string | null
          hero_title: string | null
          id: string
          is_published: boolean
          operating_body: string | null
          operating_points: Json | null
          operating_title: string | null
          owner_image_url: string | null
          owner_message: string | null
          owner_name: string | null
          owner_role: string | null
          owner_section_badge: string | null
          owner_section_title: string | null
          owner_signature: string | null
          page_key: string
          primary_cta_href: string | null
          primary_cta_label: string | null
          secondary_cta_href: string | null
          secondary_cta_label: string | null
          updated_at: string
          value_cards: Json | null
        }
        Insert: {
          created_at?: string
          directory_body?: string | null
          directory_title?: string | null
          ecosystem_body?: string | null
          ecosystem_points?: Json | null
          ecosystem_title?: string | null
          faq_body?: string | null
          faq_title?: string | null
          faqs?: Json | null
          featured_body?: string | null
          featured_title?: string | null
          footer_blurb?: string | null
          hero_badge?: string | null
          hero_description?: string | null
          hero_highlight?: string | null
          hero_image_url?: string | null
          hero_title?: string | null
          id?: string
          is_published?: boolean
          operating_body?: string | null
          operating_points?: Json | null
          operating_title?: string | null
          owner_image_url?: string | null
          owner_message?: string | null
          owner_name?: string | null
          owner_role?: string | null
          owner_section_badge?: string | null
          owner_section_title?: string | null
          owner_signature?: string | null
          page_key?: string
          primary_cta_href?: string | null
          primary_cta_label?: string | null
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          updated_at?: string
          value_cards?: Json | null
        }
        Update: {
          created_at?: string
          directory_body?: string | null
          directory_title?: string | null
          ecosystem_body?: string | null
          ecosystem_points?: Json | null
          ecosystem_title?: string | null
          faq_body?: string | null
          faq_title?: string | null
          faqs?: Json | null
          featured_body?: string | null
          featured_title?: string | null
          footer_blurb?: string | null
          hero_badge?: string | null
          hero_description?: string | null
          hero_highlight?: string | null
          hero_image_url?: string | null
          hero_title?: string | null
          id?: string
          is_published?: boolean
          operating_body?: string | null
          operating_points?: Json | null
          operating_title?: string | null
          owner_image_url?: string | null
          owner_message?: string | null
          owner_name?: string | null
          owner_role?: string | null
          owner_section_badge?: string | null
          owner_section_title?: string | null
          owner_signature?: string | null
          page_key?: string
          primary_cta_href?: string | null
          primary_cta_label?: string | null
          secondary_cta_href?: string | null
          secondary_cta_label?: string | null
          updated_at?: string
          value_cards?: Json | null
        }
        Relationships: []
      }
      jobs_applications: {
        Row: {
          applied_at: string
          archive_reason: string | null
          archived_at: string | null
          candidate_email: string | null
          candidate_id: string | null
          candidate_name: string | null
          cover_note: string | null
          current_stage: string
          deleted_at: string | null
          deleted_reason: string | null
          id: string
          legal_hold_reason: string | null
          metadata: Json | null
          pipeline_id: string | null
          resume_url: string | null
          retention_hold_until: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          archive_reason?: string | null
          archived_at?: string | null
          candidate_email?: string | null
          candidate_id?: string | null
          candidate_name?: string | null
          cover_note?: string | null
          current_stage?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json | null
          pipeline_id?: string | null
          resume_url?: string | null
          retention_hold_until?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          archive_reason?: string | null
          archived_at?: string | null
          candidate_email?: string | null
          candidate_id?: string | null
          candidate_name?: string | null
          cover_note?: string | null
          current_stage?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json | null
          pipeline_id?: string | null
          resume_url?: string | null
          retention_hold_until?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_applications_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "jobs_hiring_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_contact_masks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          masked_email: string | null
          masked_phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          masked_email?: string | null
          masked_phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          masked_email?: string | null
          masked_phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      jobs_conversations: {
        Row: {
          application_id: string | null
          candidate_id: string | null
          created_at: string
          employer_id: string | null
          flag_reason: string | null
          id: string
          is_moderated: boolean
          pipeline_id: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string
          employer_id?: string | null
          flag_reason?: string | null
          id?: string
          is_moderated?: boolean
          pipeline_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string
          employer_id?: string | null
          flag_reason?: string | null
          id?: string
          is_moderated?: boolean
          pipeline_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "jobs_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_conversations_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "jobs_hiring_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_employer_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          employer_slug: string
          expires_at: string | null
          id: string
          notes: string | null
          plan_key: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          employer_slug: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_key?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          employer_slug?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_key?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs_hiring_pipelines: {
        Row: {
          company_id: string | null
          created_at: string
          employer_id: string | null
          id: string
          job_reference: string | null
          job_title: string
          metadata: Json | null
          stages: Json
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          employer_id?: string | null
          id?: string
          job_reference?: string | null
          job_title: string
          metadata?: Json | null
          stages?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          employer_id?: string | null
          id?: string
          job_reference?: string | null
          job_title?: string
          metadata?: Json | null
          stages?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_hiring_pipelines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_interviews: {
        Row: {
          application_id: string | null
          candidate_id: string | null
          candidate_notes: string | null
          conversation_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          employer_notes: string | null
          id: string
          interview_type: string
          interviewer_id: string | null
          location: string | null
          meeting_url: string | null
          metadata: Json | null
          outcome: string | null
          outcome_notes: string | null
          pipeline_id: string | null
          scheduled_at: string
          status: string
          timezone: string
          title: string | null
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          candidate_id?: string | null
          candidate_notes?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          employer_notes?: string | null
          id?: string
          interview_type?: string
          interviewer_id?: string | null
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          pipeline_id?: string | null
          scheduled_at: string
          status?: string
          timezone?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string | null
          candidate_notes?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          employer_notes?: string | null
          id?: string
          interview_type?: string
          interviewer_id?: string | null
          location?: string | null
          meeting_url?: string | null
          metadata?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          pipeline_id?: string | null
          scheduled_at?: string
          status?: string
          timezone?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "jobs_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_interviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "jobs_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_interviews_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "jobs_hiring_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_messages: {
        Row: {
          attachments: Json | null
          body: string
          conversation_id: string | null
          created_at: string
          flag_reason: string | null
          id: string
          is_flagged: boolean
          is_read: boolean
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          conversation_id?: string | null
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          is_read?: boolean
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          conversation_id?: string | null
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          is_read?: boolean
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "jobs_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs_moderation_queue: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          flagged_by: string | null
          flagged_by_user_id: string | null
          id: string
          metadata: Json | null
          reason: string
          resolved_at: string | null
          review_notes: string | null
          reviewed_by: string | null
          severity: string
          status: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          flagged_by?: string | null
          flagged_by_user_id?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          flagged_by?: string | null
          flagged_by_user_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
        }
        Relationships: []
      }
      learn_assignments: {
        Row: {
          assigned_at: string
          assigned_by_user_id: string | null
          assignee_role: string | null
          course_id: string | null
          due_at: string | null
          id: string
          normalized_email: string | null
          note: string
          path_id: string | null
          required: boolean
          sponsor_name: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          assignee_role?: string | null
          course_id?: string | null
          due_at?: string | null
          id?: string
          normalized_email?: string | null
          note?: string
          path_id?: string | null
          required?: boolean
          sponsor_name?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_user_id?: string | null
          assignee_role?: string | null
          course_id?: string | null
          due_at?: string | null
          id?: string
          normalized_email?: string | null
          note?: string
          path_id?: string | null
          required?: boolean
          sponsor_name?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_assignments_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learn_learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_certificate_verification: {
        Row: {
          certificate_id: string
          certificate_no: string
          course_id: string
          id: string
          issued_at: string
          normalized_email: string | null
          status: string
          verification_code: string
        }
        Insert: {
          certificate_id: string
          certificate_no: string
          course_id: string
          id?: string
          issued_at?: string
          normalized_email?: string | null
          status?: string
          verification_code: string
        }
        Update: {
          certificate_id?: string
          certificate_no?: string
          course_id?: string
          id?: string
          issued_at?: string
          normalized_email?: string | null
          status?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_certificate_verification_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "learn_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_certificate_verification_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_certificates: {
        Row: {
          certificate_no: string
          course_id: string
          enrollment_id: string
          id: string
          issued_at: string
          normalized_email: string | null
          score: number | null
          status: string
          user_id: string | null
          verification_code: string
        }
        Insert: {
          certificate_no: string
          course_id: string
          enrollment_id: string
          id?: string
          issued_at?: string
          normalized_email?: string | null
          score?: number | null
          status?: string
          user_id?: string | null
          verification_code: string
        }
        Update: {
          certificate_no?: string
          course_id?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
          normalized_email?: string | null
          score?: number | null
          status?: string
          user_id?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "learn_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_course_categories: {
        Row: {
          accent: string | null
          audience_tags: string[]
          course_count: number
          created_at: string
          description: string
          hero_copy: string
          icon: string | null
          id: string
          is_featured: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent?: string | null
          audience_tags?: string[]
          course_count?: number
          created_at?: string
          description: string
          hero_copy: string
          icon?: string | null
          id?: string
          is_featured?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent?: string | null
          audience_tags?: string[]
          course_count?: number
          created_at?: string
          description?: string
          hero_copy?: string
          icon?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      learn_courses: {
        Row: {
          access_model: string
          category_id: string | null
          completion_rule: string | null
          created_at: string
          currency: string
          description: string
          difficulty: string
          duration_text: string
          estimated_minutes: number
          featured: boolean
          hero_image_url: string | null
          id: string
          is_certification: boolean
          outcomes: string[]
          passing_score: number
          plan_id: string | null
          prerequisites: string[]
          preview_video_url: string | null
          price: number | null
          primary_instructor_id: string | null
          slug: string
          status: string
          subtitle: string
          summary: string
          tags: string[]
          title: string
          unlock_policy: string
          updated_at: string
          visibility: string
        }
        Insert: {
          access_model?: string
          category_id?: string | null
          completion_rule?: string | null
          created_at?: string
          currency?: string
          description: string
          difficulty?: string
          duration_text: string
          estimated_minutes?: number
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          is_certification?: boolean
          outcomes?: string[]
          passing_score?: number
          plan_id?: string | null
          prerequisites?: string[]
          preview_video_url?: string | null
          price?: number | null
          primary_instructor_id?: string | null
          slug: string
          status?: string
          subtitle: string
          summary: string
          tags?: string[]
          title: string
          unlock_policy?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          access_model?: string
          category_id?: string | null
          completion_rule?: string | null
          created_at?: string
          currency?: string
          description?: string
          difficulty?: string
          duration_text?: string
          estimated_minutes?: number
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          is_certification?: boolean
          outcomes?: string[]
          passing_score?: number
          plan_id?: string | null
          prerequisites?: string[]
          preview_video_url?: string | null
          price?: number | null
          primary_instructor_id?: string | null
          slug?: string
          status?: string
          subtitle?: string
          summary?: string
          tags?: string[]
          title?: string
          unlock_policy?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "learn_course_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_courses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "learn_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_courses_primary_instructor_id_fkey"
            columns: ["primary_instructor_id"]
            isOneToOne: false
            referencedRelation: "learn_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          last_activity_at: string | null
          last_lesson_id: string | null
          normalized_email: string | null
          payment_status: string
          percent_complete: number
          source: string
          sponsor_name: string | null
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          last_activity_at?: string | null
          last_lesson_id?: string | null
          normalized_email?: string | null
          payment_status?: string
          percent_complete?: number
          source?: string
          sponsor_name?: string | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          last_activity_at?: string | null
          last_lesson_id?: string | null
          normalized_email?: string | null
          payment_status?: string
          percent_complete?: number
          source?: string
          sponsor_name?: string | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_enrollments_last_lesson_id_fkey"
            columns: ["last_lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_instructors: {
        Row: {
          accent: string | null
          avatar_url: string | null
          bio: string
          created_at: string
          expertise: string[]
          full_name: string
          id: string
          rating: number
          slug: string
          spotlight_quote: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent?: string | null
          avatar_url?: string | null
          bio: string
          created_at?: string
          expertise?: string[]
          full_name: string
          id?: string
          rating?: number
          slug: string
          spotlight_quote?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accent?: string | null
          avatar_url?: string | null
          bio?: string
          created_at?: string
          expertise?: string[]
          full_name?: string
          id?: string
          rating?: number
          slug?: string
          spotlight_quote?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      learn_learning_paths: {
        Row: {
          access_model: string
          audience: string
          created_at: string
          description: string
          featured: boolean
          hero_image_url: string | null
          id: string
          plan_id: string | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          access_model?: string
          audience: string
          created_at?: string
          description: string
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          plan_id?: string | null
          slug: string
          status?: string
          summary: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          access_model?: string
          audience?: string
          created_at?: string
          description?: string
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          plan_id?: string | null
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_learning_paths_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "learn_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_lesson_resources: {
        Row: {
          created_at: string
          id: string
          label: string
          lesson_id: string
          resource_type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          lesson_id: string
          resource_type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          lesson_id?: string
          resource_type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_lessons: {
        Row: {
          body_markdown: string
          course_id: string
          created_at: string
          duration_minutes: number
          id: string
          is_preview: boolean
          lesson_type: string
          module_id: string
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body_markdown?: string
          course_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_preview?: boolean
          lesson_type?: string
          module_id: string
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body_markdown?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_preview?: boolean
          lesson_type?: string
          module_id?: string
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learn_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_modules: {
        Row: {
          course_id: string
          created_at: string
          estimated_minutes: number
          id: string
          sort_order: number
          summary: string | null
          title: string
          unlock_rule: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          sort_order?: number
          summary?: string | null
          title: string
          unlock_rule?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          estimated_minutes?: number
          id?: string
          sort_order?: number
          summary?: string | null
          title?: string
          unlock_rule?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          normalized_email: string | null
          read_at: string | null
          reason: string | null
          recipient: string
          status: string
          template_key: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          normalized_email?: string | null
          read_at?: string | null
          reason?: string | null
          recipient: string
          status?: string
          template_key: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          normalized_email?: string | null
          read_at?: string | null
          reason?: string | null
          recipient?: string
          status?: string
          template_key?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      learn_path_items: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          item_type: string
          label: string | null
          path_id: string
          required: boolean
          sort_order: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string
          label?: string | null
          path_id: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_type?: string
          label?: string | null
          path_id?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "learn_path_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_path_items_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learn_learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          course_id: string
          created_at: string
          currency: string
          enrollment_id: string
          id: string
          method: string
          normalized_email: string | null
          reference: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          course_id: string
          created_at?: string
          currency?: string
          enrollment_id: string
          id?: string
          method?: string
          normalized_email?: string | null
          reference: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          enrollment_id?: string
          id?: string
          method?: string
          normalized_email?: string | null
          reference?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "learn_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_plans: {
        Row: {
          access_scope: string
          billing_type: string
          created_at: string
          currency: string
          description: string
          id: string
          is_public: boolean
          name: string
          perks: string[]
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          access_scope: string
          billing_type?: string
          created_at?: string
          currency?: string
          description: string
          id?: string
          is_public?: boolean
          name: string
          perks?: string[]
          price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          access_scope?: string
          billing_type?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          is_public?: boolean
          name?: string
          perks?: string[]
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      learn_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          enrollment_id: string
          id: string
          lesson_id: string
          module_id: string | null
          score: number | null
          seconds_watched: number
          status: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrollment_id: string
          id?: string
          lesson_id: string
          module_id?: string | null
          score?: number | null
          seconds_watched?: number
          status?: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
          module_id?: string | null
          score?: number | null
          seconds_watched?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "learn_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learn_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_quiz_attempts: {
        Row: {
          answers: Json
          enrollment_id: string
          id: string
          normalized_email: string | null
          passed: boolean
          quiz_id: string
          score: number
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          enrollment_id: string
          id?: string
          normalized_email?: string | null
          passed?: boolean
          quiz_id: string
          score?: number
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          enrollment_id?: string
          id?: string
          normalized_email?: string | null
          passed?: boolean
          quiz_id?: string
          score?: number
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "learn_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "learn_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_quiz_questions: {
        Row: {
          correct_answer: string[]
          created_at: string
          explanation: string | null
          id: string
          options: string[]
          prompt: string
          question_type: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_answer?: string[]
          created_at?: string
          explanation?: string | null
          id?: string
          options?: string[]
          prompt: string
          question_type?: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_answer?: string[]
          created_at?: string
          explanation?: string | null
          id?: string
          options?: string[]
          prompt?: string
          question_type?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "learn_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "learn_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          max_attempts: number
          pass_score: number
          question_count: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          max_attempts?: number
          pass_score?: number
          question_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          max_attempts?: number
          pass_score?: number
          question_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learn_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learn_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learn_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_reviews: {
        Row: {
          body: string
          course_id: string
          created_at: string
          id: string
          normalized_email: string | null
          rating: number
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body: string
          course_id: string
          created_at?: string
          id?: string
          normalized_email?: string | null
          rating?: number
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string
          course_id?: string
          created_at?: string
          id?: string
          normalized_email?: string | null
          rating?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_role_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          normalized_email: string | null
          role: string
          scope_id: string | null
          scope_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      learn_saved_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          normalized_email: string | null
          user_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          normalized_email?: string | null
          user_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          normalized_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_saved_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learn_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learn_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      learn_teacher_applications: {
        Row: {
          admin_notes: string | null
          country: string | null
          course_proposal: string
          created_at: string
          credentials: string
          expertise_area: string
          full_name: string
          id: string
          instructor_membership_id: string | null
          normalized_email: string | null
          payout_model: string
          phone: string | null
          portfolio_links: string[]
          revenue_share_percent: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          supporting_files: Json
          teaching_topics: string[]
          terms_accepted_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          country?: string | null
          course_proposal?: string
          created_at?: string
          credentials?: string
          expertise_area: string
          full_name: string
          id?: string
          instructor_membership_id?: string | null
          normalized_email?: string | null
          payout_model?: string
          phone?: string | null
          portfolio_links?: string[]
          revenue_share_percent?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          supporting_files?: Json
          teaching_topics?: string[]
          terms_accepted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          country?: string | null
          course_proposal?: string
          created_at?: string
          credentials?: string
          expertise_area?: string
          full_name?: string
          id?: string
          instructor_membership_id?: string | null
          normalized_email?: string | null
          payout_model?: string
          phone?: string | null
          portfolio_links?: string[]
          revenue_share_percent?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          supporting_files?: Json
          teaching_topics?: string[]
          terms_accepted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learn_teacher_applications_instructor_membership_id_fkey"
            columns: ["instructor_membership_id"]
            isOneToOne: false
            referencedRelation: "learn_role_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_addresses: {
        Row: {
          city: string | null
          contact_name: string | null
          country: string | null
          email: string | null
          id: string
          instructions: string | null
          kind: string
          label: string | null
          landmark: string | null
          latitude: number | null
          line1: string | null
          line2: string | null
          longitude: number | null
          phone: string | null
          region: string | null
          shipment_id: string | null
        }
        Insert: {
          city?: string | null
          contact_name?: string | null
          country?: string | null
          email?: string | null
          id?: string
          instructions?: string | null
          kind: string
          label?: string | null
          landmark?: string | null
          latitude?: number | null
          line1?: string | null
          line2?: string | null
          longitude?: number | null
          phone?: string | null
          region?: string | null
          shipment_id?: string | null
        }
        Update: {
          city?: string | null
          contact_name?: string | null
          country?: string | null
          email?: string | null
          id?: string
          instructions?: string | null
          kind?: string
          label?: string | null
          landmark?: string | null
          latitude?: number | null
          line1?: string | null
          line2?: string | null
          longitude?: number | null
          phone?: string | null
          region?: string | null
          shipment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_addresses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_assignments: {
        Row: {
          assigned_by_name: string | null
          assigned_by_user_id: string | null
          created_at: string
          eta_committed_at: string | null
          id: string
          notes: string | null
          rider_name: string | null
          rider_phone: string | null
          rider_user_id: string | null
          shipment_id: string | null
          status: string
        }
        Insert: {
          assigned_by_name?: string | null
          assigned_by_user_id?: string | null
          created_at?: string
          eta_committed_at?: string | null
          id?: string
          notes?: string | null
          rider_name?: string | null
          rider_phone?: string | null
          rider_user_id?: string | null
          shipment_id?: string | null
          status?: string
        }
        Update: {
          assigned_by_name?: string | null
          assigned_by_user_id?: string | null
          created_at?: string
          eta_committed_at?: string | null
          id?: string
          notes?: string | null
          rider_name?: string | null
          rider_phone?: string | null
          rider_user_id?: string | null
          shipment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_assignments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_events: {
        Row: {
          actor_name: string | null
          actor_role: string | null
          actor_user_id: string | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          customer_visible: boolean | null
          description: string | null
          event_type: string
          id: string
          legal_hold_reason: string | null
          lifecycle_status: string | null
          meta: Json | null
          retention_hold_until: string | null
          shipment_id: string | null
          title: string | null
        }
        Insert: {
          actor_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          customer_visible?: boolean | null
          description?: string | null
          event_type: string
          id?: string
          legal_hold_reason?: string | null
          lifecycle_status?: string | null
          meta?: Json | null
          retention_hold_until?: string | null
          shipment_id?: string | null
          title?: string | null
        }
        Update: {
          actor_name?: string | null
          actor_role?: string | null
          actor_user_id?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          customer_visible?: boolean | null
          description?: string | null
          event_type?: string
          id?: string
          legal_hold_reason?: string | null
          lifecycle_status?: string | null
          meta?: Json | null
          retention_hold_until?: string | null
          shipment_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string | null
          id: string
          note: string | null
          receipt_path: string | null
          rider_user_id: string | null
          shipment_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          note?: string | null
          receipt_path?: string | null
          rider_user_id?: string | null
          shipment_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          note?: string | null
          receipt_path?: string | null
          rider_user_id?: string | null
          shipment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_expenses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_issues: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          details: string | null
          id: string
          issue_type: string | null
          legal_hold_reason: string | null
          opened_by_user_id: string | null
          owner_user_id: string | null
          resolution: string | null
          retention_hold_until: string | null
          severity: string | null
          shipment_id: string | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          issue_type?: string | null
          legal_hold_reason?: string | null
          opened_by_user_id?: string | null
          owner_user_id?: string | null
          resolution?: string | null
          retention_hold_until?: string | null
          severity?: string | null
          shipment_id?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          issue_type?: string | null
          legal_hold_reason?: string | null
          opened_by_user_id?: string | null
          owner_user_id?: string | null
          resolution?: string | null
          retention_hold_until?: string | null
          severity?: string | null
          shipment_id?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_issues_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_notifications: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          meta: Json | null
          reason: string | null
          recipient: string | null
          shipment_id: string | null
          status: string
          subject: string | null
          template_key: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string | null
          recipient?: string | null
          shipment_id?: string | null
          status?: string
          subject?: string | null
          template_key?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          reason?: string | null
          recipient?: string | null
          shipment_id?: string | null
          status?: string
          subject?: string | null
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_notifications_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_proof_of_delivery: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          delivered_at: string | null
          geo_lat: number | null
          geo_lng: number | null
          id: string
          legal_hold_reason: string | null
          note: string | null
          photo_path: string | null
          proof_type: string | null
          recipient_name: string | null
          retention_hold_until: string | null
          shipment_id: string | null
          signature_path: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          delivered_at?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          legal_hold_reason?: string | null
          note?: string | null
          photo_path?: string | null
          proof_type?: string | null
          recipient_name?: string | null
          retention_hold_until?: string | null
          shipment_id?: string | null
          signature_path?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          delivered_at?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          legal_hold_reason?: string | null
          note?: string | null
          photo_path?: string | null
          proof_type?: string | null
          recipient_name?: string | null
          retention_hold_until?: string | null
          shipment_id?: string | null
          signature_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_proof_of_delivery_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "logistics_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_rate_cards: {
        Row: {
          base_amount: number
          created_at: string
          fragile_fee: number | null
          id: string
          is_active: boolean
          manual_only: boolean
          service_type: string
          size_surcharge: number | null
          urgency: string
          weight_fee_per_kg: number | null
          zone_id: string | null
        }
        Insert: {
          base_amount?: number
          created_at?: string
          fragile_fee?: number | null
          id?: string
          is_active?: boolean
          manual_only?: boolean
          service_type: string
          size_surcharge?: number | null
          urgency?: string
          weight_fee_per_kg?: number | null
          zone_id?: string | null
        }
        Update: {
          base_amount?: number
          created_at?: string
          fragile_fee?: number | null
          id?: string
          is_active?: boolean
          manual_only?: boolean
          service_type?: string
          size_surcharge?: number | null
          urgency?: string
          weight_fee_per_kg?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_rate_cards_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "logistics_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_role_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          normalized_email: string | null
          role: string
          scope_id: string | null
          scope_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      logistics_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      logistics_shipments: {
        Row: {
          amount_paid: number | null
          amount_quoted: number | null
          archive_reason: string | null
          archived_at: string | null
          assigned_rider_name: string | null
          assigned_rider_user_id: string | null
          created_at: string
          currency: string
          customer_user_id: string | null
          display_currency: string
          fragile: boolean | null
          id: string
          last_event_at: string | null
          legal_hold_reason: string | null
          lifecycle_status: string
          normalized_email: string | null
          override_meta: Json | null
          parcel_description: string | null
          parcel_type: string | null
          payment_reference: string | null
          payment_status: string
          pricing_breakdown: Json | null
          pricing_status: string
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          request_type: string | null
          requires_pod: boolean | null
          retention_hold_until: string | null
          scheduled_delivery_at: string | null
          scheduled_pickup_at: string | null
          sender_email: string | null
          sender_name: string | null
          sender_phone: string | null
          service_type: string | null
          settlement_currency: string
          size_tier: string | null
          support_summary: string | null
          tracking_code: string | null
          updated_at: string
          urgency: string | null
          weight_kg: number | null
          zone_id: string | null
          zone_label: string | null
        }
        Insert: {
          amount_paid?: number | null
          amount_quoted?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          assigned_rider_name?: string | null
          assigned_rider_user_id?: string | null
          created_at?: string
          currency?: string
          customer_user_id?: string | null
          display_currency?: string
          fragile?: boolean | null
          id?: string
          last_event_at?: string | null
          legal_hold_reason?: string | null
          lifecycle_status?: string
          normalized_email?: string | null
          override_meta?: Json | null
          parcel_description?: string | null
          parcel_type?: string | null
          payment_reference?: string | null
          payment_status?: string
          pricing_breakdown?: Json | null
          pricing_status?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          request_type?: string | null
          requires_pod?: boolean | null
          retention_hold_until?: string | null
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          service_type?: string | null
          settlement_currency?: string
          size_tier?: string | null
          support_summary?: string | null
          tracking_code?: string | null
          updated_at?: string
          urgency?: string | null
          weight_kg?: number | null
          zone_id?: string | null
          zone_label?: string | null
        }
        Update: {
          amount_paid?: number | null
          amount_quoted?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          assigned_rider_name?: string | null
          assigned_rider_user_id?: string | null
          created_at?: string
          currency?: string
          customer_user_id?: string | null
          display_currency?: string
          fragile?: boolean | null
          id?: string
          last_event_at?: string | null
          legal_hold_reason?: string | null
          lifecycle_status?: string
          normalized_email?: string | null
          override_meta?: Json | null
          parcel_description?: string | null
          parcel_type?: string | null
          payment_reference?: string | null
          payment_status?: string
          pricing_breakdown?: Json | null
          pricing_status?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          request_type?: string | null
          requires_pod?: boolean | null
          retention_hold_until?: string | null
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          service_type?: string | null
          settlement_currency?: string
          size_tier?: string | null
          support_summary?: string | null
          tracking_code?: string | null
          updated_at?: string
          urgency?: string | null
          weight_kg?: number | null
          zone_id?: string | null
          zone_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_shipments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "logistics_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_zones: {
        Row: {
          base_fee: number | null
          city: string | null
          created_at: string
          eta_hours_max: number | null
          eta_hours_min: number | null
          id: string
          inter_city_multiplier: number | null
          is_active: boolean
          name: string
          region: string | null
          same_day_multiplier: number | null
          sort_order: number | null
          summary: string | null
          zone_key: string
        }
        Insert: {
          base_fee?: number | null
          city?: string | null
          created_at?: string
          eta_hours_max?: number | null
          eta_hours_min?: number | null
          id?: string
          inter_city_multiplier?: number | null
          is_active?: boolean
          name: string
          region?: string | null
          same_day_multiplier?: number | null
          sort_order?: number | null
          summary?: string | null
          zone_key: string
        }
        Update: {
          base_fee?: number | null
          city?: string | null
          created_at?: string
          eta_hours_max?: number | null
          eta_hours_min?: number | null
          id?: string
          inter_city_multiplier?: number | null
          is_active?: boolean
          name?: string
          region?: string | null
          same_day_multiplier?: number | null
          sort_order?: number | null
          summary?: string | null
          zone_key?: string
        }
        Relationships: []
      }
      marketplace_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          normalized_email: string | null
          phone: string | null
          recipient_name: string | null
          region: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          normalized_email?: string | null
          phone?: string | null
          recipient_name?: string | null
          region: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          normalized_email?: string | null
          phone?: string | null
          recipient_name?: string | null
          region?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_audit_logs: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          legal_hold_reason: string | null
          retention_hold_until: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          legal_hold_reason?: string | null
          retention_hold_until?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          legal_hold_reason?: string | null
          retention_hold_until?: string | null
        }
        Relationships: []
      }
      marketplace_automation_runs: {
        Row: {
          automation_key: string
          completed_at: string | null
          created_at: string
          id: string
          started_at: string
          status: string
          summary: Json
          updated_at: string
        }
        Insert: {
          automation_key: string
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          automation_key?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          started_at?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_behavior_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          normalized_email: string | null
          payload: Json
          subject_id: string | null
          subject_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          normalized_email?: string | null
          payload?: Json
          subject_id?: string | null
          subject_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          normalized_email?: string | null
          payload?: Json
          subject_id?: string | null
          subject_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_brands: {
        Row: {
          accent: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_campaigns: {
        Row: {
          accent: string | null
          countdown_text: string | null
          created_at: string
          cta_href: string | null
          cta_label: string | null
          description: string | null
          id: string
          slug: string
          status: string
          surface: string
          title: string
          updated_at: string
        }
        Insert: {
          accent?: string | null
          countdown_text?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          id?: string
          slug: string
          status?: string
          surface?: string
          title: string
          updated_at?: string
        }
        Update: {
          accent?: string | null
          countdown_text?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          description?: string | null
          id?: string
          slug?: string
          status?: string
          surface?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_cart_items: {
        Row: {
          cart_id: string
          compare_at_price: number | null
          created_at: string
          id: string
          price: number
          product_id: string
          quantity: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          cart_id: string
          compare_at_price?: number | null
          created_at?: string
          id?: string
          price?: number
          product_id: string
          quantity?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          cart_id?: string
          compare_at_price?: number | null
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "marketplace_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_cart_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_carts: {
        Row: {
          created_at: string
          id: string
          normalized_email: string | null
          session_token: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_email?: string | null
          session_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          normalized_email?: string | null
          session_token?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          filter_presets: string[]
          hero_copy: string | null
          id: string
          is_featured: boolean
          name: string
          parent_id: string | null
          product_count: number
          slug: string
          sort_order: number
          trust_notes: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filter_presets?: string[]
          hero_copy?: string | null
          id?: string
          is_featured?: boolean
          name: string
          parent_id?: string | null
          product_count?: number
          slug: string
          sort_order?: number
          trust_notes?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filter_presets?: string[]
          hero_copy?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          parent_id?: string | null
          product_count?: number
          slug?: string
          sort_order?: number
          trust_notes?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_collection_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_collections: {
        Row: {
          created_at: string
          description: string | null
          highlight: string | null
          id: string
          kicker: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          highlight?: string | null
          id?: string
          kicker?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          highlight?: string | null
          id?: string
          kicker?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_deals_curation: {
        Row: {
          active: boolean
          created_at: string
          curator_user_id: string | null
          ends_at: string | null
          id: string
          note: string | null
          product_slug: string
          slot: string
          sort_order: number
          starts_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          curator_user_id?: string | null
          ends_at?: string | null
          id?: string
          note?: string | null
          product_slug: string
          slot?: string
          sort_order?: number
          starts_at?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          curator_user_id?: string | null
          ends_at?: string | null
          id?: string
          note?: string | null
          product_slug?: string
          slot?: string
          sort_order?: number
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_discount_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          min_order_total: number
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_total?: number
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_total?: number
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      marketplace_disputes: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          assigned_to: string | null
          created_at: string
          details: string | null
          dispute_no: string
          id: string
          legal_hold_reason: string | null
          normalized_email: string | null
          opened_by_user_id: string | null
          order_id: string | null
          order_no: string
          reason: string
          refund_amount: number | null
          resolution_type: string | null
          retention_hold_until: string | null
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          dispute_no: string
          id?: string
          legal_hold_reason?: string | null
          normalized_email?: string | null
          opened_by_user_id?: string | null
          order_id?: string | null
          order_no: string
          reason: string
          refund_amount?: number | null
          resolution_type?: string | null
          retention_hold_until?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          details?: string | null
          dispute_no?: string
          id?: string
          legal_hold_reason?: string | null
          normalized_email?: string | null
          opened_by_user_id?: string | null
          order_id?: string | null
          order_no?: string
          reason?: string
          refund_amount?: number | null
          resolution_type?: string | null
          retention_hold_until?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_events: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          normalized_email: string | null
          payload: Json
          user_id: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          normalized_email?: string | null
          payload?: Json
          user_id?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          normalized_email?: string | null
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_moderation_cases: {
        Row: {
          assigned_to: string | null
          created_at: string
          decision: string | null
          id: string
          note: string | null
          queue: string
          status: string
          subject_id: string
          subject_type: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          note?: string | null
          queue?: string
          status?: string
          subject_id: string
          subject_type: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          decision?: string | null
          id?: string
          note?: string | null
          queue?: string
          status?: string
          subject_id?: string
          subject_type?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_moderation_cases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_notification_attempts: {
        Row: {
          channel: string
          created_at: string
          id: string
          message_id: string | null
          payload: Json
          provider: string | null
          queue_id: string
          reason: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          message_id?: string | null
          payload?: Json
          provider?: string | null
          queue_id: string
          reason?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message_id?: string | null
          payload?: Json
          provider?: string | null
          queue_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_notification_attempts_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "marketplace_notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_notification_queue: {
        Row: {
          channel: string
          created_at: string
          dedupe_key: string | null
          delivery_attempts: number
          entity_id: string | null
          entity_type: string | null
          event_id: string | null
          id: string
          last_attempted_at: string | null
          last_error: string | null
          next_retry_at: string | null
          normalized_email: string | null
          payload: Json
          provider: string | null
          provider_message_id: string | null
          recipient: string
          sent_at: string | null
          skipped_reason: string | null
          status: string
          subject: string | null
          template_key: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          dedupe_key?: string | null
          delivery_attempts?: number
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string
          last_attempted_at?: string | null
          last_error?: string | null
          next_retry_at?: string | null
          normalized_email?: string | null
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          sent_at?: string | null
          skipped_reason?: string | null
          status?: string
          subject?: string | null
          template_key: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          dedupe_key?: string | null
          delivery_attempts?: number
          entity_id?: string | null
          entity_type?: string | null
          event_id?: string | null
          id?: string
          last_attempted_at?: string | null
          last_error?: string | null
          next_retry_at?: string | null
          normalized_email?: string | null
          payload?: Json
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          sent_at?: string | null
          skipped_reason?: string | null
          status?: string
          subject?: string | null
          template_key?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_notification_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "marketplace_events"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_groups: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          commission_amount: number
          created_at: string
          delivered_at: string | null
          fulfillment_status: string
          id: string
          legal_hold_reason: string | null
          net_vendor_amount: number
          order_id: string
          order_no: string
          owner_type: string
          payment_status: string
          payout_status: string
          retention_hold_until: string | null
          shipment_carrier: string | null
          shipment_code: string | null
          shipment_tracking_code: string | null
          subtotal: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          commission_amount?: number
          created_at?: string
          delivered_at?: string | null
          fulfillment_status?: string
          id?: string
          legal_hold_reason?: string | null
          net_vendor_amount?: number
          order_id: string
          order_no: string
          owner_type?: string
          payment_status?: string
          payout_status?: string
          retention_hold_until?: string | null
          shipment_carrier?: string | null
          shipment_code?: string | null
          shipment_tracking_code?: string | null
          subtotal?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          commission_amount?: number
          created_at?: string
          delivered_at?: string | null
          fulfillment_status?: string
          id?: string
          legal_hold_reason?: string | null
          net_vendor_amount?: number
          order_id?: string
          order_no?: string
          owner_type?: string
          payment_status?: string
          payout_status?: string
          retention_hold_until?: string | null
          shipment_carrier?: string | null
          shipment_code?: string | null
          shipment_tracking_code?: string | null
          subtotal?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_groups_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_groups_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_group_id: string | null
          order_id: string
          order_no: string
          product_id: string | null
          quantity: number
          title_snapshot: Json
          unit_price: number
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          order_group_id?: string | null
          order_id: string
          order_no: string
          product_id?: string | null
          quantity?: number
          title_snapshot?: Json
          unit_price?: number
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_group_id?: string | null
          order_id?: string
          order_no?: string
          product_id?: string | null
          quantity?: number
          title_snapshot?: Json
          unit_price?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_items_order_group_id_fkey"
            columns: ["order_group_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          currency: string
          currency_snapshot: Json
          discount_total: number
          display_currency: string
          exchange_rate: number
          exchange_rate_at: string | null
          exchange_rate_source: string
          grand_total: number
          id: string
          legal_hold_reason: string | null
          normalized_email: string | null
          order_no: string
          payment_method: string
          payment_status: string
          placed_at: string
          platform_fee_total: number
          pricing_breakdown: Json
          retention_hold_until: string | null
          settlement_currency: string
          shipping_city: string | null
          shipping_region: string | null
          shipping_total: number
          status: string
          subtotal: number
          timeline: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          currency_snapshot?: Json
          discount_total?: number
          display_currency?: string
          exchange_rate?: number
          exchange_rate_at?: string | null
          exchange_rate_source?: string
          grand_total?: number
          id?: string
          legal_hold_reason?: string | null
          normalized_email?: string | null
          order_no: string
          payment_method?: string
          payment_status?: string
          placed_at?: string
          platform_fee_total?: number
          pricing_breakdown?: Json
          retention_hold_until?: string | null
          settlement_currency?: string
          shipping_city?: string | null
          shipping_region?: string | null
          shipping_total?: number
          status?: string
          subtotal?: number
          timeline?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          currency?: string
          currency_snapshot?: Json
          discount_total?: number
          display_currency?: string
          exchange_rate?: number
          exchange_rate_at?: string | null
          exchange_rate_source?: string
          grand_total?: number
          id?: string
          legal_hold_reason?: string | null
          normalized_email?: string | null
          order_no?: string
          payment_method?: string
          payment_status?: string
          placed_at?: string
          platform_fee_total?: number
          pricing_breakdown?: Json
          retention_hold_until?: string | null
          settlement_currency?: string
          shipping_city?: string | null
          shipping_region?: string | null
          shipping_total?: number
          status?: string
          subtotal?: number
          timeline?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_payment_records: {
        Row: {
          amount: number
          archive_reason: string | null
          archived_at: string | null
          bank_reference: string | null
          created_at: string
          evidence_note: string | null
          id: string
          legal_hold_reason: string | null
          metadata: Json
          method: string
          order_id: string | null
          order_no: string
          proof_name: string | null
          proof_public_id: string | null
          proof_uploaded_at: string | null
          proof_url: string | null
          provider: string
          reference: string
          retention_hold_until: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          amount?: number
          archive_reason?: string | null
          archived_at?: string | null
          bank_reference?: string | null
          created_at?: string
          evidence_note?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json
          method?: string
          order_id?: string | null
          order_no: string
          proof_name?: string | null
          proof_public_id?: string | null
          proof_uploaded_at?: string | null
          proof_url?: string | null
          provider?: string
          reference: string
          retention_hold_until?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          archive_reason?: string | null
          archived_at?: string | null
          bank_reference?: string | null
          created_at?: string
          evidence_note?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json
          method?: string
          order_id?: string | null
          order_no?: string
          proof_name?: string | null
          proof_public_id?: string | null
          proof_uploaded_at?: string | null
          proof_url?: string | null
          provider?: string
          reference?: string
          retention_hold_until?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payment_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_payout_requests: {
        Row: {
          amount: number
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          id: string
          legal_hold_reason: string | null
          reference: string
          requested_by: string | null
          retention_hold_until: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          legal_hold_reason?: string | null
          reference: string
          requested_by?: string | null
          retention_hold_until?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          legal_hold_reason?: string | null
          reference?: string
          requested_by?: string | null
          retention_hold_until?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payout_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_media: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          kind: string
          product_id: string
          public_id: string | null
          sort_order: number
          url: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: string
          product_id: string
          public_id?: string | null
          sort_order?: number
          url: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          kind?: string
          product_id?: string
          public_id?: string | null
          sort_order?: number
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          options: Json
          price: number
          product_id: string
          sku: string
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          options?: Json
          price?: number
          product_id: string
          sku: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          options?: Json
          price?: number
          product_id?: string
          sku?: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          approval_status: string
          archive_reason: string | null
          archived_at: string | null
          base_price: number
          brand_id: string | null
          category_id: string | null
          cod_eligible: boolean
          compare_at_price: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          deleted_reason: string | null
          delivery_note: string | null
          description: string | null
          featured: boolean
          filter_data: Json
          id: string
          inventory_owner_type: string
          lead_time: string | null
          legal_hold_reason: string | null
          moderation_note: string | null
          rating: number
          retention_hold_until: string | null
          review_count: number
          reviewed_at: string | null
          reviewed_by: string | null
          sku: string
          slug: string
          specifications: Json
          status: string
          summary: string | null
          title: string
          total_stock: number
          trust_badges: string[]
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          approval_status?: string
          archive_reason?: string | null
          archived_at?: string | null
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          cod_eligible?: boolean
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          delivery_note?: string | null
          description?: string | null
          featured?: boolean
          filter_data?: Json
          id?: string
          inventory_owner_type?: string
          lead_time?: string | null
          legal_hold_reason?: string | null
          moderation_note?: string | null
          rating?: number
          retention_hold_until?: string | null
          review_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku: string
          slug: string
          specifications?: Json
          status?: string
          summary?: string | null
          title: string
          total_stock?: number
          trust_badges?: string[]
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          approval_status?: string
          archive_reason?: string | null
          archived_at?: string | null
          base_price?: number
          brand_id?: string | null
          category_id?: string | null
          cod_eligible?: boolean
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          delivery_note?: string | null
          description?: string | null
          featured?: boolean
          filter_data?: Json
          id?: string
          inventory_owner_type?: string
          lead_time?: string | null
          legal_hold_reason?: string | null
          moderation_note?: string | null
          rating?: number
          retention_hold_until?: string | null
          review_count?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          sku?: string
          slug?: string
          specifications?: Json
          status?: string
          summary?: string | null
          title?: string
          total_stock?: number
          trust_badges?: string[]
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "marketplace_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_recently_viewed: {
        Row: {
          id: string
          last_viewed_at: string
          normalized_email: string | null
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_viewed_at?: string
          normalized_email?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_viewed_at?: string
          normalized_email?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reports: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          assigned_to: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          details: string | null
          id: string
          legal_hold_reason: string | null
          reason: string
          reporter_user_id: string | null
          retention_hold_until: string | null
          status: string
          subject_id: string
          subject_type: string
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          details?: string | null
          id?: string
          legal_hold_reason?: string | null
          reason: string
          reporter_user_id?: string | null
          retention_hold_until?: string | null
          status?: string
          subject_id: string
          subject_type: string
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          details?: string | null
          id?: string
          legal_hold_reason?: string | null
          reason?: string
          reporter_user_id?: string | null
          retention_hold_until?: string | null
          status?: string
          subject_id?: string
          subject_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_returns: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          details: string | null
          id: string
          legal_hold_reason: string | null
          order_item_id: string | null
          reason: string
          requested_at: string
          resolved_at: string | null
          retention_hold_until: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          legal_hold_reason?: string | null
          order_item_id?: string | null
          reason: string
          requested_at?: string
          resolved_at?: string | null
          retention_hold_until?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          legal_hold_reason?: string | null
          order_item_id?: string | null
          reason?: string
          requested_at?: string
          resolved_at?: string | null
          retention_hold_until?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_returns_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          body: string | null
          buyer_name: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          id: string
          is_verified_purchase: boolean
          legal_hold_reason: string | null
          media: Json
          order_item_id: string | null
          product_id: string | null
          rating: number
          retention_hold_until: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          body?: string | null
          buyer_name?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          is_verified_purchase?: boolean
          legal_hold_reason?: string | null
          media?: Json
          order_item_id?: string | null
          product_id?: string | null
          rating?: number
          retention_hold_until?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          body?: string | null
          buyer_name?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          is_verified_purchase?: boolean
          legal_hold_reason?: string | null
          media?: Json
          order_item_id?: string | null
          product_id?: string | null
          rating?: number
          retention_hold_until?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_role_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          normalized_email: string | null
          role: string
          scope_id: string | null
          scope_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role: string
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      marketplace_shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          id: string
          order_group_id: string
          order_no: string
          shipment_no: string
          shipped_at: string | null
          status: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_group_id: string
          order_no: string
          shipment_no: string
          shipped_at?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_group_id?: string
          order_no?: string
          shipment_no?: string
          shipped_at?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_shipments_order_group_id_fkey"
            columns: ["order_group_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_support_messages: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          attachment_url: string | null
          body: string
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          id: string
          legal_hold_reason: string | null
          normalized_email: string | null
          retention_hold_until: string | null
          sender_type: string
          thread_id: string
          user_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          attachment_url?: string | null
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          legal_hold_reason?: string | null
          normalized_email?: string | null
          retention_hold_until?: string | null
          sender_type?: string
          thread_id: string
          user_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          attachment_url?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          legal_hold_reason?: string | null
          normalized_email?: string | null
          retention_hold_until?: string | null
          sender_type?: string
          thread_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "marketplace_support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_support_threads: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          channel: string
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          id: string
          last_message: string | null
          legal_hold_reason: string | null
          normalized_email: string | null
          retention_hold_until: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          channel?: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          last_message?: string | null
          legal_hold_reason?: string | null
          normalized_email?: string | null
          retention_hold_until?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          channel?: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          last_message?: string | null
          legal_hold_reason?: string | null
          normalized_email?: string | null
          retention_hold_until?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_user_comm_preferences: {
        Row: {
          created_at: string
          critical_alerts_enabled: boolean
          email_enabled: boolean
          id: string
          marketing_enabled: boolean
          normalized_email: string | null
          updated_at: string
          user_id: string | null
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          critical_alerts_enabled?: boolean
          email_enabled?: boolean
          id?: string
          marketing_enabled?: boolean
          normalized_email?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          critical_alerts_enabled?: boolean
          email_enabled?: boolean
          id?: string
          marketing_enabled?: boolean
          normalized_email?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      marketplace_user_notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          normalized_email: string | null
          payload: Json
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          normalized_email?: string | null
          payload?: Json
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          normalized_email?: string | null
          payload?: Json
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_vendor_applications: {
        Row: {
          agreement_accepted_at: string | null
          category_focus: string | null
          contact_phone: string | null
          created_at: string
          documents_json: Json
          draft_payload: Json
          id: string
          legal_name: string
          normalized_email: string | null
          onboarding_completed_at: string | null
          progress_step: string
          proposed_store_slug: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          store_name: string
          story: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agreement_accepted_at?: string | null
          category_focus?: string | null
          contact_phone?: string | null
          created_at?: string
          documents_json?: Json
          draft_payload?: Json
          id?: string
          legal_name: string
          normalized_email?: string | null
          onboarding_completed_at?: string | null
          progress_step?: string
          proposed_store_slug: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_name: string
          story?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agreement_accepted_at?: string | null
          category_focus?: string | null
          contact_phone?: string | null
          created_at?: string
          documents_json?: Json
          draft_payload?: Json
          id?: string
          legal_name?: string
          normalized_email?: string | null
          onboarding_completed_at?: string | null
          progress_step?: string
          proposed_store_slug?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_name?: string
          story?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_vendor_follows: {
        Row: {
          created_at: string
          id: string
          normalized_email: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_email?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          normalized_email?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_vendor_follows_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_vendor_trust_snapshots: {
        Row: {
          computed_at: string
          computed_by: string
          dispute_rate: number | null
          fulfillment_rate: number | null
          id: string
          review_score: number | null
          tier: string
          trigger_reason: string
          trust_score: number
          vendor_id: string
        }
        Insert: {
          computed_at?: string
          computed_by?: string
          dispute_rate?: number | null
          fulfillment_rate?: number | null
          id?: string
          review_score?: number | null
          tier: string
          trigger_reason: string
          trust_score: number
          vendor_id: string
        }
        Update: {
          computed_at?: string
          computed_by?: string
          dispute_rate?: number | null
          fulfillment_rate?: number | null
          id?: string
          review_score?: number | null
          tier?: string
          trigger_reason?: string
          trust_score?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_vendor_trust_snapshots_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_vendors: {
        Row: {
          accent: string | null
          badges: string[]
          created_at: string
          description: string | null
          dispute_rate: number
          followers_count: number
          fulfillment_rate: number
          hero_image_url: string | null
          id: string
          name: string
          owner_type: string
          owner_user_id: string | null
          response_sla_hours: number
          review_score: number
          seller_tier: string
          slug: string
          status: string
          support_email: string | null
          support_phone: string | null
          tier_changed_at: string | null
          trust_last_computed_at: string | null
          trust_score: number
          updated_at: string
          verification_level: string
        }
        Insert: {
          accent?: string | null
          badges?: string[]
          created_at?: string
          description?: string | null
          dispute_rate?: number
          followers_count?: number
          fulfillment_rate?: number
          hero_image_url?: string | null
          id?: string
          name: string
          owner_type?: string
          owner_user_id?: string | null
          response_sla_hours?: number
          review_score?: number
          seller_tier?: string
          slug: string
          status?: string
          support_email?: string | null
          support_phone?: string | null
          tier_changed_at?: string | null
          trust_last_computed_at?: string | null
          trust_score?: number
          updated_at?: string
          verification_level?: string
        }
        Update: {
          accent?: string | null
          badges?: string[]
          created_at?: string
          description?: string | null
          dispute_rate?: number
          followers_count?: number
          fulfillment_rate?: number
          hero_image_url?: string | null
          id?: string
          name?: string
          owner_type?: string
          owner_user_id?: string | null
          response_sla_hours?: number
          review_score?: number
          seller_tier?: string
          slug?: string
          status?: string
          support_email?: string | null
          support_phone?: string | null
          tier_changed_at?: string | null
          trust_last_computed_at?: string | null
          trust_score?: number
          updated_at?: string
          verification_level?: string
        }
        Relationships: []
      }
      marketplace_wishlists: {
        Row: {
          created_at: string
          id: string
          normalized_email: string | null
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_email?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          normalized_email?: string | null
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          category: string | null
          channel: string
          created_at: string
          division: string | null
          error_code: string | null
          error_message: string | null
          event_name: string | null
          id: string
          legal_hold_reason: string | null
          metadata: Json
          notification_id: string | null
          provider: string
          provider_message_id: string | null
          retention_hold_until: string | null
          status: string
          user_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          category?: string | null
          channel: string
          created_at?: string
          division?: string | null
          error_code?: string | null
          error_message?: string | null
          event_name?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json
          notification_id?: string | null
          provider: string
          provider_message_id?: string | null
          retention_hold_until?: string | null
          status: string
          user_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          category?: string | null
          channel?: string
          created_at?: string
          division?: string | null
          error_code?: string | null
          error_message?: string | null
          event_name?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json
          notification_id?: string | null
          provider?: string
          provider_message_id?: string | null
          retention_hold_until?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "customer_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          express: boolean
          id: string
          item_name: string
          line_total_ngn: number
          order_id: string
          quantity: number
          stain_level: string | null
          unit_price_ngn: number
        }
        Insert: {
          express?: boolean
          id?: string
          item_name: string
          line_total_ngn?: number
          order_id: string
          quantity?: number
          stain_level?: string | null
          unit_price_ngn?: number
        }
        Update: {
          express?: boolean
          id?: string
          item_name?: string
          line_total_ngn?: number
          order_id?: string
          quantity?: number
          stain_level?: string | null
          unit_price_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_rider_id: string | null
          created_at: string
          customer_id: string | null
          delivery_address_id: string | null
          delivery_fee_ngn: number
          delivery_time: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_pickup_address: string | null
          id: string
          notes: string | null
          pickup_address: string | null
          pickup_address_id: string | null
          pickup_time: string | null
          status: string
          status_updated_at: string
          subtotal_ngn: number
          total_ngn: number
        }
        Insert: {
          assigned_rider_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_address_id?: string | null
          delivery_fee_ngn?: number
          delivery_time?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_pickup_address?: string | null
          id?: string
          notes?: string | null
          pickup_address?: string | null
          pickup_address_id?: string | null
          pickup_time?: string | null
          status?: string
          status_updated_at?: string
          subtotal_ngn?: number
          total_ngn?: number
        }
        Update: {
          assigned_rider_id?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_address_id?: string | null
          delivery_fee_ngn?: number
          delivery_time?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_pickup_address?: string | null
          id?: string
          notes?: string | null
          pickup_address?: string | null
          pickup_address_id?: string | null
          pickup_time?: string | null
          status?: string
          status_updated_at?: string
          subtotal_ngn?: number
          total_ngn?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_address_id_fkey"
            columns: ["pickup_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_countries: {
        Row: {
          code: string
          created_at: string
          currency_code: string
          currency_symbol: string
          id: string
          is_active: boolean
          is_primary: boolean
          locale: string
          metadata: Json | null
          name: string
          phone_prefix: string | null
          timezone: string
        }
        Insert: {
          code: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          locale?: string
          metadata?: Json | null
          name: string
          phone_prefix?: string | null
          timezone?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          locale?: string
          metadata?: Json | null
          name?: string
          phone_prefix?: string | null
          timezone?: string
        }
        Relationships: []
      }
      platform_moderation_queue: {
        Row: {
          assigned_to: string | null
          content_snapshot: string | null
          created_at: string
          division: string
          entity_id: string
          entity_type: string
          flagged_by: string | null
          flagged_by_user_id: string | null
          id: string
          metadata: Json | null
          reason: string
          resolved_at: string | null
          review_action: string | null
          review_notes: string | null
          reviewed_by: string | null
          severity: string
          status: string
        }
        Insert: {
          assigned_to?: string | null
          content_snapshot?: string | null
          created_at?: string
          division: string
          entity_id: string
          entity_type: string
          flagged_by?: string | null
          flagged_by_user_id?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          resolved_at?: string | null
          review_action?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
        }
        Update: {
          assigned_to?: string | null
          content_snapshot?: string | null
          created_at?: string
          division?: string
          entity_id?: string
          entity_type?: string
          flagged_by?: string | null
          flagged_by_user_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          resolved_at?: string | null
          review_action?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
        }
        Relationships: []
      }
      pricing_override_events: {
        Row: {
          actor_email: string | null
          actor_user_id: string | null
          after: Json
          archive_reason: string | null
          archived_at: string | null
          before: Json
          created_at: string
          division: string
          event_type: string
          id: string
          legal_hold_reason: string | null
          quote_id: string | null
          reason: string | null
          retention_hold_until: string | null
          subject_id: string | null
          subject_type: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_user_id?: string | null
          after?: Json
          archive_reason?: string | null
          archived_at?: string | null
          before?: Json
          created_at?: string
          division?: string
          event_type: string
          id?: string
          legal_hold_reason?: string | null
          quote_id?: string | null
          reason?: string | null
          retention_hold_until?: string | null
          subject_id?: string | null
          subject_type?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_user_id?: string | null
          after?: Json
          archive_reason?: string | null
          archived_at?: string | null
          before?: Json
          created_at?: string
          division?: string
          event_type?: string
          id?: string
          legal_hold_reason?: string | null
          quote_id?: string | null
          reason?: string | null
          retention_hold_until?: string | null
          subject_id?: string | null
          subject_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_override_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "pricing_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_quotes: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          breakdown: Json
          created_at: string
          created_by: string | null
          currency: string
          display_currency: string
          division: string
          exchange_rate: number
          exchange_rate_at: string | null
          exchange_rate_source: string
          id: string
          input: Json
          is_approximate_display: boolean
          legal_hold_reason: string | null
          quote_key: string
          retention_hold_until: string | null
          rule_book_key: string | null
          rule_version: string | null
          settlement_currency: string
          status: string
          subject_id: string | null
          subject_type: string
          total: number
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          breakdown?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          display_currency?: string
          division: string
          exchange_rate?: number
          exchange_rate_at?: string | null
          exchange_rate_source?: string
          id?: string
          input?: Json
          is_approximate_display?: boolean
          legal_hold_reason?: string | null
          quote_key: string
          retention_hold_until?: string | null
          rule_book_key?: string | null
          rule_version?: string | null
          settlement_currency?: string
          status?: string
          subject_id?: string | null
          subject_type: string
          total?: number
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          breakdown?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          display_currency?: string
          division?: string
          exchange_rate?: number
          exchange_rate_at?: string | null
          exchange_rate_source?: string
          id?: string
          input?: Json
          is_approximate_display?: boolean
          legal_hold_reason?: string | null
          quote_key?: string
          retention_hold_until?: string | null
          rule_book_key?: string | null
          rule_version?: string | null
          settlement_currency?: string
          status?: string
          subject_id?: string | null
          subject_type?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rule_books: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          division: string
          effective_from: string
          effective_to: string | null
          id: string
          label: string
          rule_book_key: string
          rules: Json
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          division?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          label: string
          rule_book_key: string
          rules?: Json
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          division?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          label?: string
          rule_book_key?: string
          rules?: Json
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_price_ngn: number
          created_at: string
          express_extra_ngn: number
          heavy_stain_extra_ngn: number
          id: number
          is_active: boolean
          item_name: string
        }
        Insert: {
          base_price_ngn?: number
          created_at?: string
          express_extra_ngn?: number
          heavy_stain_extra_ngn?: number
          id?: never
          is_active?: boolean
          item_name: string
        }
        Update: {
          base_price_ngn?: number
          created_at?: string
          express_extra_ngn?: number
          heavy_stain_extra_ngn?: number
          id?: never
          is_active?: boolean
          item_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          disabled_reason: string | null
          force_reauth_after: string | null
          force_signout_at: string | null
          forced_signout_at: string | null
          frozen_at: string | null
          frozen_reason: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_frozen: boolean
          legal_hold_reason: string | null
          phone: string | null
          retention_hold_until: string | null
          role: string
          updated_at: string
          wallet_balance_ngn: number
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          disabled_reason?: string | null
          force_reauth_after?: string | null
          force_signout_at?: string | null
          forced_signout_at?: string | null
          frozen_at?: string | null
          frozen_reason?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_frozen?: boolean
          legal_hold_reason?: string | null
          phone?: string | null
          retention_hold_until?: string | null
          role: string
          updated_at?: string
          wallet_balance_ngn?: number
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          disabled_reason?: string | null
          force_reauth_after?: string | null
          force_signout_at?: string | null
          forced_signout_at?: string | null
          frozen_at?: string | null
          frozen_reason?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          legal_hold_reason?: string | null
          phone?: string | null
          retention_hold_until?: string | null
          role?: string
          updated_at?: string
          wallet_balance_ngn?: number
        }
        Relationships: []
      }
      property_agents: {
        Row: {
          badges: string[]
          bio: string
          created_at: string
          email: string
          id: string
          label: string
          name: string
          phone: string | null
          photo_url: string | null
          slug: string
          territories: string[]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          badges?: string[]
          bio?: string
          created_at?: string
          email: string
          id?: string
          label: string
          name: string
          phone?: string | null
          photo_url?: string | null
          slug: string
          territories?: string[]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          badges?: string[]
          bio?: string
          created_at?: string
          email?: string
          id?: string
          label?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          slug?: string
          territories?: string[]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      property_amenities: {
        Row: {
          created_at: string
          id: string
          label: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          listing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_featured_campaigns: {
        Row: {
          accent: string | null
          created_at: string
          cta_href: string
          cta_label: string
          description: string
          id: string
          listing_ids: string[]
          slug: string
          surface: string
          title: string
          updated_at: string
        }
        Insert: {
          accent?: string | null
          created_at?: string
          cta_href: string
          cta_label: string
          description?: string
          id?: string
          listing_ids?: string[]
          slug: string
          surface: string
          title: string
          updated_at?: string
        }
        Update: {
          accent?: string | null
          created_at?: string
          cta_href?: string
          cta_label?: string
          description?: string
          id?: string
          listing_ids?: string[]
          slug?: string
          surface?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_inquiries: {
        Row: {
          assigned_agent_id: string | null
          created_at: string
          email: string
          id: string
          listing_id: string
          message: string
          name: string
          normalized_email: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string
          email: string
          id?: string
          listing_id: string
          message?: string
          name: string
          normalized_email?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          message?: string
          name?: string
          normalized_email?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "property_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listing_applications: {
        Row: {
          applicant_name: string
          company_name: string | null
          created_at: string
          email: string
          id: string
          listing_id: string
          normalized_email: string | null
          phone: string | null
          review_note: string | null
          status: string
          updated_at: string
          user_id: string | null
          verification_docs: Json
        }
        Insert: {
          applicant_name: string
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          listing_id: string
          normalized_email?: string | null
          phone?: string | null
          review_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          verification_docs?: Json
        }
        Update: {
          applicant_name?: string
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          listing_id?: string
          normalized_email?: string | null
          phone?: string | null
          review_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          verification_docs?: Json
        }
        Relationships: [
          {
            foreignKeyName: "property_listing_applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listing_media: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          media_kind: string
          media_url: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          media_kind?: string
          media_url: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          media_kind?: string
          media_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listings: {
        Row: {
          address_line: string
          agent_id: string | null
          amenities: string[]
          available_from: string | null
          available_now: boolean
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency: string
          description: string
          district: string
          featured: boolean
          floor_plan_url: string | null
          furnished: boolean
          gallery: string[]
          headline_metrics: string[]
          hero_image: string | null
          id: string
          kind: string
          listed_at: string
          location_label: string
          location_slug: string
          managed_by_henryco: boolean
          normalized_email: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          owner_user_id: string | null
          parking_spaces: number | null
          pet_friendly: boolean
          price: number
          price_interval: string
          promoted: boolean
          shortlet_ready: boolean
          size_sqm: number | null
          slug: string
          status: string
          summary: string
          title: string
          trust_badges: string[]
          updated_at: string
          verification_notes: string[]
          visibility: string
        }
        Insert: {
          address_line?: string
          agent_id?: string | null
          amenities?: string[]
          available_from?: string | null
          available_now?: boolean
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string
          description?: string
          district?: string
          featured?: boolean
          floor_plan_url?: string | null
          furnished?: boolean
          gallery?: string[]
          headline_metrics?: string[]
          hero_image?: string | null
          id?: string
          kind: string
          listed_at?: string
          location_label: string
          location_slug: string
          managed_by_henryco?: boolean
          normalized_email?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_user_id?: string | null
          parking_spaces?: number | null
          pet_friendly?: boolean
          price?: number
          price_interval?: string
          promoted?: boolean
          shortlet_ready?: boolean
          size_sqm?: number | null
          slug: string
          status?: string
          summary?: string
          title: string
          trust_badges?: string[]
          updated_at?: string
          verification_notes?: string[]
          visibility?: string
        }
        Update: {
          address_line?: string
          agent_id?: string | null
          amenities?: string[]
          available_from?: string | null
          available_now?: boolean
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string
          description?: string
          district?: string
          featured?: boolean
          floor_plan_url?: string | null
          furnished?: boolean
          gallery?: string[]
          headline_metrics?: string[]
          hero_image?: string | null
          id?: string
          kind?: string
          listed_at?: string
          location_label?: string
          location_slug?: string
          managed_by_henryco?: boolean
          normalized_email?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_user_id?: string | null
          parking_spaces?: number | null
          pet_friendly?: boolean
          price?: number
          price_interval?: string
          promoted?: boolean
          shortlet_ready?: boolean
          size_sqm?: number | null
          slug?: string
          status?: string
          summary?: string
          title?: string
          trust_badges?: string[]
          updated_at?: string
          verification_notes?: string[]
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_listings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "property_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      property_managed_records: {
        Row: {
          assigned_manager_id: string | null
          created_at: string
          id: string
          location_label: string
          narrative: string
          owner_email: string | null
          owner_name: string
          portfolio_value: number
          service_lines: string[]
          service_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_manager_id?: string | null
          created_at?: string
          id?: string
          location_label: string
          narrative?: string
          owner_email?: string | null
          owner_name: string
          portfolio_value?: number
          service_lines?: string[]
          service_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_manager_id?: string | null
          created_at?: string
          id?: string
          location_label?: string
          narrative?: string
          owner_email?: string | null
          owner_name?: string
          portfolio_value?: number
          service_lines?: string[]
          service_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_managed_records_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "property_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      property_notifications: {
        Row: {
          channel: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
          recipient: string
          status: string
          subject: string
          template_key: string
        }
        Insert: {
          channel: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
          recipient: string
          status: string
          subject: string
          template_key: string
        }
        Update: {
          channel?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
          recipient?: string
          status?: string
          subject?: string
          template_key?: string
        }
        Relationships: []
      }
      property_role_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          normalized_email: string | null
          role: string
          scope_id: string | null
          scope_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      property_saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          normalized_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          normalized_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          normalized_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      property_viewing_requests: {
        Row: {
          assigned_agent_id: string | null
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          backup_date: string | null
          created_at: string
          id: string
          inquiry_id: string | null
          listing_id: string
          normalized_email: string | null
          notes: string
          preferred_date: string
          reminder_at: string | null
          scheduled_for: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          backup_date?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          listing_id: string
          normalized_email?: string | null
          notes?: string
          preferred_date: string
          reminder_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          backup_date?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          listing_id?: string
          normalized_email?: string | null
          notes?: string
          preferred_date?: string
          reminder_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_viewing_requests_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "property_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_viewing_requests_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "property_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_viewing_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "property_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      recently_viewed_items: {
        Row: {
          division: string
          href: string | null
          id: string
          image_url: string | null
          item_id: string
          item_type: string
          last_viewed_at: string
          title: string | null
          user_id: string
          view_count: number
        }
        Insert: {
          division: string
          href?: string | null
          id?: string
          image_url?: string | null
          item_id: string
          item_type: string
          last_viewed_at?: string
          title?: string | null
          user_id: string
          view_count?: number
        }
        Update: {
          division?: string
          href?: string | null
          id?: string
          image_url?: string | null
          item_id?: string
          item_type?: string
          last_viewed_at?: string
          title?: string | null
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      referral_programs: {
        Row: {
          conversion_event: string
          created_at: string
          description: string | null
          division: string
          fraud_cooldown_hours: number | null
          id: string
          is_active: boolean
          max_referrals_per_user: number | null
          metadata: Json | null
          min_days_before_payout: number | null
          name: string
          referee_reward_amount_kobo: number
          referee_reward_type: string
          referrer_reward_amount_kobo: number
          referrer_reward_type: string
          requires_verification: boolean
          updated_at: string
        }
        Insert: {
          conversion_event?: string
          created_at?: string
          description?: string | null
          division: string
          fraud_cooldown_hours?: number | null
          id?: string
          is_active?: boolean
          max_referrals_per_user?: number | null
          metadata?: Json | null
          min_days_before_payout?: number | null
          name: string
          referee_reward_amount_kobo?: number
          referee_reward_type?: string
          referrer_reward_amount_kobo?: number
          referrer_reward_type?: string
          requires_verification?: boolean
          updated_at?: string
        }
        Update: {
          conversion_event?: string
          created_at?: string
          description?: string | null
          division?: string
          fraud_cooldown_hours?: number | null
          id?: string
          is_active?: boolean
          max_referrals_per_user?: number | null
          metadata?: Json | null
          min_days_before_payout?: number | null
          name?: string
          referee_reward_amount_kobo?: number
          referee_reward_type?: string
          referrer_reward_amount_kobo?: number
          referrer_reward_type?: string
          requires_verification?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount_kobo: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          reason: string | null
          referral_id: string | null
          reward_type: string
          status: string
          support_note: string | null
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          amount_kobo?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          reason?: string | null
          referral_id?: string | null
          reward_type: string
          status?: string
          support_note?: string | null
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          amount_kobo?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          reason?: string | null
          referral_id?: string | null
          reward_type?: string
          status?: string
          support_note?: string | null
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          conversion_event: string | null
          converted_at: string | null
          created_at: string
          division: string
          flag_reason: string | null
          fraud_flags: Json | null
          fraud_score: number | null
          id: string
          ip_address: string | null
          metadata: Json | null
          program_id: string | null
          qualified_at: string | null
          referee_email: string | null
          referee_id: string | null
          referee_reward_paid_at: string | null
          referee_reward_status: string | null
          referral_code: string
          referred_fingerprint: string | null
          referrer_id: string
          referrer_reward_paid_at: string | null
          referrer_reward_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          conversion_event?: string | null
          converted_at?: string | null
          created_at?: string
          division: string
          flag_reason?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          program_id?: string | null
          qualified_at?: string | null
          referee_email?: string | null
          referee_id?: string | null
          referee_reward_paid_at?: string | null
          referee_reward_status?: string | null
          referral_code: string
          referred_fingerprint?: string | null
          referrer_id: string
          referrer_reward_paid_at?: string | null
          referrer_reward_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          conversion_event?: string | null
          converted_at?: string | null
          created_at?: string
          division?: string
          flag_reason?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          program_id?: string | null
          qualified_at?: string | null
          referee_email?: string | null
          referee_id?: string | null
          referee_reward_paid_at?: string | null
          referee_reward_status?: string | null
          referral_code?: string
          referred_fingerprint?: string | null
          referrer_id?: string
          referrer_reward_paid_at?: string | null
          referrer_reward_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "referral_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          added_at: string
          created_at: string
          division: string
          expires_at: string
          id: string
          item_id: string
          item_snapshot: Json
          item_type: string
          notes: string | null
          restored_to_cart_at: string | null
          soft_deleted_at: string | null
          source_cart_item_id: string | null
          status: Database["public"]["Enums"]["saved_item_status"]
          updated_at: string
          user_id: string
          warned_at: string | null
        }
        Insert: {
          added_at?: string
          created_at?: string
          division: string
          expires_at?: string
          id?: string
          item_id: string
          item_snapshot?: Json
          item_type: string
          notes?: string | null
          restored_to_cart_at?: string | null
          soft_deleted_at?: string | null
          source_cart_item_id?: string | null
          status?: Database["public"]["Enums"]["saved_item_status"]
          updated_at?: string
          user_id: string
          warned_at?: string | null
        }
        Update: {
          added_at?: string
          created_at?: string
          division?: string
          expires_at?: string
          id?: string
          item_id?: string
          item_snapshot?: Json
          item_type?: string
          notes?: string | null
          restored_to_cart_at?: string | null
          soft_deleted_at?: string | null
          source_cart_item_id?: string | null
          status?: Database["public"]["Enums"]["saved_item_status"]
          updated_at?: string
          user_id?: string
          warned_at?: string | null
        }
        Relationships: []
      }
      search_index_outbox: {
        Row: {
          attempted_at: string | null
          attempts: number
          collection: string
          completed_at: string | null
          document_id: string
          enqueued_at: string
          id: number
          last_error: string | null
          operation: string
          payload: Json
        }
        Insert: {
          attempted_at?: string | null
          attempts?: number
          collection: string
          completed_at?: string | null
          document_id: string
          enqueued_at?: string
          id?: number
          last_error?: string | null
          operation: string
          payload?: Json
        }
        Update: {
          attempted_at?: string | null
          attempts?: number
          collection?: string
          completed_at?: string | null
          document_id?: string
          enqueued_at?: string
          id?: number
          last_error?: string | null
          operation?: string
          payload?: Json
        }
        Relationships: []
      }
      search_workflow_targets: {
        Row: {
          created_at: string
          cta_label: string
          deep_link: string
          division: string
          due_at: string | null
          id: string
          metadata: Json
          resolved_at: string | null
          summary: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
          workflow_key: string
        }
        Insert: {
          created_at?: string
          cta_label: string
          deep_link: string
          division: string
          due_at?: string | null
          id?: string
          metadata?: Json
          resolved_at?: string | null
          summary?: string
          title: string
          updated_at?: string
          urgency?: string
          user_id: string
          workflow_key: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          deep_link?: string
          division?: string
          due_at?: string | null
          id?: string
          metadata?: Json
          resolved_at?: string | null
          summary?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
          workflow_key?: string
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          assignment_type: string
          created_at: string
          id: string
          order_id: string
          staff_id: string
        }
        Insert: {
          assignment_type: string
          created_at?: string
          id?: string
          order_id: string
          staff_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          id?: string
          order_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: number
          legal_hold_reason: string | null
          meta: Json
          retention_hold_until: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: number
          legal_hold_reason?: string | null
          meta?: Json
          retention_hold_until?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: number
          legal_hold_reason?: string | null
          meta?: Json
          retention_hold_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          id: string
          note: string | null
          order_ref: string | null
          receipt_url: string | null
          role_snapshot: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
          order_ref?: string | null
          receipt_url?: string | null
          role_snapshot: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
          order_ref?: string | null
          receipt_url?: string | null
          role_snapshot?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_expenses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_navigation_audit: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          division: string | null
          id: string
          legal_hold_reason: string | null
          metadata: Json
          path: string
          referrer: string | null
          retention_hold_until: string | null
          session_fingerprint: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          division?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json
          path: string
          referrer?: string | null
          retention_hold_until?: string | null
          session_fingerprint?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          division?: string | null
          id?: string
          legal_hold_reason?: string | null
          metadata?: Json
          path?: string
          referrer?: string | null
          retention_hold_until?: string | null
          session_fingerprint?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      studio_brief_drafts: {
        Row: {
          cache_creation_input_tokens: number
          cache_read_input_tokens: number
          created_at: string
          duration_ms: number
          error_reason: string | null
          id: string
          input_hash: string | null
          intent: string
          ip_hash: string | null
          model_used: string
          normalized_email: string | null
          raw_input: string
          session_id: string | null
          status: string
          structured_output: Json
          tokens_in: number
          tokens_out: number
          user_id: string | null
        }
        Insert: {
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          created_at?: string
          duration_ms?: number
          error_reason?: string | null
          id?: string
          input_hash?: string | null
          intent?: string
          ip_hash?: string | null
          model_used?: string
          normalized_email?: string | null
          raw_input: string
          session_id?: string | null
          status?: string
          structured_output?: Json
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Update: {
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          created_at?: string
          duration_ms?: number
          error_reason?: string | null
          id?: string
          input_hash?: string | null
          intent?: string
          ip_hash?: string | null
          model_used?: string
          normalized_email?: string | null
          raw_input?: string
          session_id?: string | null
          status?: string
          structured_output?: Json
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Relationships: []
      }
      studio_brief_files: {
        Row: {
          brief_id: string | null
          bucket: string
          created_at: string
          id: string
          label: string
          lead_id: string | null
          mime_type: string | null
          path: string
          size: number | null
        }
        Insert: {
          brief_id?: string | null
          bucket?: string
          created_at?: string
          id?: string
          label?: string
          lead_id?: string | null
          mime_type?: string | null
          path?: string
          size?: number | null
        }
        Update: {
          brief_id?: string | null
          bucket?: string
          created_at?: string
          id?: string
          label?: string
          lead_id?: string | null
          mime_type?: string | null
          path?: string
          size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_brief_files_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "studio_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_brief_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "studio_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_briefs: {
        Row: {
          budget: string | null
          budget_band: string | null
          business_type: string | null
          created_at: string
          deliverables: Json | null
          description: string | null
          domain_intent: Json
          goals: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          notes: string | null
          objectives: string | null
          package_intent: string | null
          reference_links: string[] | null
          required_features: string[] | null
          scope_notes: string | null
          status: string
          target_audience: string | null
          tech_preferences: string[] | null
          timeline: string | null
          title: string | null
          updated_at: string
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          budget?: string | null
          budget_band?: string | null
          business_type?: string | null
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          domain_intent?: Json
          goals?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          objectives?: string | null
          package_intent?: string | null
          reference_links?: string[] | null
          required_features?: string[] | null
          scope_notes?: string | null
          status?: string
          target_audience?: string | null
          tech_preferences?: string[] | null
          timeline?: string | null
          title?: string | null
          updated_at?: string
          urgency?: string | null
          user_id?: string | null
        }
        Update: {
          budget?: string | null
          budget_band?: string | null
          business_type?: string | null
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          domain_intent?: Json
          goals?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          objectives?: string | null
          package_intent?: string | null
          reference_links?: string[] | null
          required_features?: string[] | null
          scope_notes?: string | null
          status?: string
          target_audience?: string | null
          tech_preferences?: string[] | null
          timeline?: string | null
          title?: string | null
          updated_at?: string
          urgency?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_briefs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "studio_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_custom_requests: {
        Row: {
          addon_services: string[] | null
          brief_id: string | null
          created_at: string
          description: string | null
          design_direction: string | null
          id: string
          inspiration_summary: string | null
          lead_id: string | null
          metadata: Json | null
          page_requirements: string[] | null
          platform_preference: string | null
          priority: string | null
          project_type: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          addon_services?: string[] | null
          brief_id?: string | null
          created_at?: string
          description?: string | null
          design_direction?: string | null
          id?: string
          inspiration_summary?: string | null
          lead_id?: string | null
          metadata?: Json | null
          page_requirements?: string[] | null
          platform_preference?: string | null
          priority?: string | null
          project_type?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          addon_services?: string[] | null
          brief_id?: string | null
          created_at?: string
          description?: string | null
          design_direction?: string | null
          id?: string
          inspiration_summary?: string | null
          lead_id?: string | null
          metadata?: Json | null
          page_requirements?: string[] | null
          platform_preference?: string | null
          priority?: string | null
          project_type?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_custom_requests_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "studio_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_custom_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "studio_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_deliverables: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          description: string | null
          due_date: string | null
          file_ids: string[] | null
          file_public_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
          label: string | null
          legal_hold_reason: string | null
          metadata: Json | null
          milestone_id: string | null
          project_id: string | null
          retention_hold_until: string | null
          shared_at: string | null
          status: string
          summary: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          description?: string | null
          due_date?: string | null
          file_ids?: string[] | null
          file_public_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          label?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          milestone_id?: string | null
          project_id?: string | null
          retention_hold_until?: string | null
          shared_at?: string | null
          status?: string
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          description?: string | null
          due_date?: string | null
          file_ids?: string[] | null
          file_public_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          label?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          milestone_id?: string | null
          project_id?: string | null
          retention_hold_until?: string | null
          shared_at?: string | null
          status?: string
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_deliverables_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "studio_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_invoices: {
        Row: {
          amount_kobo: number
          client_user_id: string | null
          created_at: string
          currency: string
          description: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_token: string | null
          issued_at: string
          milestone_id: string | null
          normalized_email: string | null
          paid_at: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          client_user_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_token?: string | null
          issued_at?: string
          milestone_id?: string | null
          normalized_email?: string | null
          paid_at?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          client_user_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_token?: string | null
          issued_at?: string
          milestone_id?: string | null
          normalized_email?: string | null
          paid_at?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "studio_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_leads: {
        Row: {
          attachments: Json | null
          budget_band: string | null
          budget_max: number | null
          budget_min: number | null
          business_type: string | null
          company_name: string | null
          created_at: string
          customer_name: string | null
          deposit_requested: boolean | null
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          matched_team_id: string | null
          metadata: Json | null
          normalized_email: string | null
          phone: string | null
          preferred_team_id: string | null
          readiness_score: number | null
          requested_package_id: string | null
          service_kind: string | null
          service_type: string | null
          status: string
          timeline: string | null
          updated_at: string
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          budget_band?: string | null
          budget_max?: number | null
          budget_min?: number | null
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          customer_name?: string | null
          deposit_requested?: boolean | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          matched_team_id?: string | null
          metadata?: Json | null
          normalized_email?: string | null
          phone?: string | null
          preferred_team_id?: string | null
          readiness_score?: number | null
          requested_package_id?: string | null
          service_kind?: string | null
          service_type?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          urgency?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          budget_band?: string | null
          budget_max?: number | null
          budget_min?: number | null
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          customer_name?: string | null
          deposit_requested?: boolean | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          matched_team_id?: string | null
          metadata?: Json | null
          normalized_email?: string | null
          phone?: string | null
          preferred_team_id?: string | null
          readiness_score?: number | null
          requested_package_id?: string | null
          service_kind?: string | null
          service_type?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          urgency?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_leads_matched_team_id_fkey"
            columns: ["matched_team_id"]
            isOneToOne: false
            referencedRelation: "studio_team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_leads_preferred_team_id_fkey"
            columns: ["preferred_team_id"]
            isOneToOne: false
            referencedRelation: "studio_team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_leads_requested_package_id_fkey"
            columns: ["requested_package_id"]
            isOneToOne: false
            referencedRelation: "studio_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "studio_project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "studio_project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string | null
          category: string | null
          channel: string | null
          created_at: string
          division: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          normalized_email: string | null
          payload: Json | null
          priority: string | null
          reason: string | null
          recipient: string | null
          status: string | null
          subject: string | null
          template_key: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body?: string | null
          category?: string | null
          channel?: string | null
          created_at?: string
          division?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          normalized_email?: string | null
          payload?: Json | null
          priority?: string | null
          reason?: string | null
          recipient?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string | null
          category?: string | null
          channel?: string | null
          created_at?: string
          division?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          normalized_email?: string | null
          payload?: Json | null
          priority?: string | null
          reason?: string | null
          recipient?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      studio_packages: {
        Row: {
          best_for: string
          created_at: string
          deposit_rate: number
          id: string
          includes: string[]
          is_published: boolean
          name: string
          price: number
          service_id: string
          slug: string
          summary: string
          timeline_weeks: number
          updated_at: string
        }
        Insert: {
          best_for: string
          created_at?: string
          deposit_rate?: number
          id: string
          includes?: string[]
          is_published?: boolean
          name: string
          price?: number
          service_id: string
          slug: string
          summary: string
          timeline_weeks?: number
          updated_at?: string
        }
        Update: {
          best_for?: string
          created_at?: string
          deposit_rate?: number
          id?: string
          includes?: string[]
          is_published?: boolean
          name?: string
          price?: number
          service_id?: string
          slug?: string
          summary?: string
          timeline_weeks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "studio_services"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_payments: {
        Row: {
          amount: number | null
          amount_kobo: number | null
          archive_reason: string | null
          archived_at: string | null
          client_user_id: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          invoice_id: string | null
          label: string | null
          legal_hold_reason: string | null
          metadata: Json | null
          method: string | null
          milestone_id: string | null
          normalized_email: string | null
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          project_id: string | null
          proof_name: string | null
          proof_public_id: string | null
          proof_url: string | null
          reference: string | null
          rejection_reason: string | null
          retention_hold_until: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          amount_kobo?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          client_user_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          label?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          method?: string | null
          milestone_id?: string | null
          normalized_email?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          project_id?: string | null
          proof_name?: string | null
          proof_public_id?: string | null
          proof_url?: string | null
          reference?: string | null
          rejection_reason?: string | null
          retention_hold_until?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          amount_kobo?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          client_user_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          label?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          method?: string | null
          milestone_id?: string | null
          normalized_email?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          project_id?: string | null
          proof_name?: string | null
          proof_public_id?: string | null
          proof_url?: string | null
          reference?: string | null
          rejection_reason?: string | null
          retention_hold_until?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "studio_client_invoices_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "studio_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "studio_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_assignments: {
        Row: {
          created_at: string | null
          id: string
          label: string | null
          project_id: string | null
          role: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          label?: string | null
          project_id?: string | null
          role?: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string | null
          project_id?: string | null
          role?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_project_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "studio_team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_files: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          brief_id: string | null
          bucket: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_reason: string | null
          file_size: number | null
          file_url: string | null
          id: string
          kind: string | null
          label: string | null
          lead_id: string | null
          legal_hold_reason: string | null
          metadata: Json | null
          mime_type: string | null
          name: string | null
          path: string | null
          project_id: string | null
          retention_hold_until: string | null
          size: number | null
          type: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          brief_id?: string | null
          bucket?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          kind?: string | null
          label?: string | null
          lead_id?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string | null
          path?: string | null
          project_id?: string | null
          retention_hold_until?: string | null
          size?: number | null
          type?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          brief_id?: string | null
          bucket?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          kind?: string | null
          label?: string | null
          lead_id?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string | null
          path?: string | null
          project_id?: string | null
          retention_hold_until?: string | null
          size?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_files_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "studio_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_project_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "studio_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_messages: {
        Row: {
          attachments: Json | null
          body: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_internal: boolean | null
          message_type: string
          metadata: Json
          project_id: string | null
          read_by: Json | null
          reply_to_id: string | null
          sender: string | null
          sender_id: string | null
          sender_role: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_internal?: boolean | null
          message_type?: string
          metadata?: Json
          project_id?: string | null
          read_by?: Json | null
          reply_to_id?: string | null
          sender?: string | null
          sender_id?: string | null
          sender_role?: string | null
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_internal?: boolean | null
          message_type?: string
          metadata?: Json
          project_id?: string | null
          read_by?: Json | null
          reply_to_id?: string | null
          sender?: string | null
          sender_id?: string | null
          sender_role?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_project_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "studio_project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_milestones: {
        Row: {
          amount: number | null
          amount_kobo: number | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          due_label: string | null
          id: string
          legal_hold_reason: string | null
          name: string | null
          order_index: number | null
          project_id: string | null
          retention_hold_until: string | null
          sort_order: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          amount_kobo?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          due_label?: string | null
          id?: string
          legal_hold_reason?: string | null
          name?: string | null
          order_index?: number | null
          project_id?: string | null
          retention_hold_until?: string | null
          sort_order?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          amount_kobo?: number | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          due_label?: string | null
          id?: string
          legal_hold_reason?: string | null
          name?: string | null
          order_index?: number | null
          project_id?: string | null
          retention_hold_until?: string | null
          sort_order?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_updates: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          description: string | null
          id: string
          kind: string | null
          metadata: Json | null
          project_id: string | null
          summary: string | null
          title: string | null
          update_type: string | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string | null
          metadata?: Json | null
          project_id?: string | null
          summary?: string | null
          title?: string | null
          update_type?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string | null
          metadata?: Json | null
          project_id?: string | null
          summary?: string | null
          title?: string | null
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          access_token_hash: string | null
          access_token_hint: string | null
          actual_completion: string | null
          archive_reason: string | null
          archived_at: string | null
          brief: string | null
          budget_kobo: number | null
          client_user_id: string | null
          confidence: number | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          description: string | null
          end_date: string | null
          estimated_completion: string | null
          id: string
          lead_id: string | null
          legal_hold_reason: string | null
          metadata: Json | null
          next_action: string | null
          normalized_email: string | null
          package_id: string | null
          project_type: string | null
          proposal_id: string | null
          retention_hold_until: string | null
          service_id: string | null
          start_date: string | null
          status: string
          summary: string | null
          team_id: string | null
          team_lead_id: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token_hash?: string | null
          access_token_hint?: string | null
          actual_completion?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          brief?: string | null
          budget_kobo?: number | null
          client_user_id?: string | null
          confidence?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          description?: string | null
          end_date?: string | null
          estimated_completion?: string | null
          id?: string
          lead_id?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          next_action?: string | null
          normalized_email?: string | null
          package_id?: string | null
          project_type?: string | null
          proposal_id?: string | null
          retention_hold_until?: string | null
          service_id?: string | null
          start_date?: string | null
          status?: string
          summary?: string | null
          team_id?: string | null
          team_lead_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token_hash?: string | null
          access_token_hint?: string | null
          actual_completion?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          brief?: string | null
          budget_kobo?: number | null
          client_user_id?: string | null
          confidence?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          description?: string | null
          end_date?: string | null
          estimated_completion?: string | null
          id?: string
          lead_id?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          next_action?: string | null
          normalized_email?: string | null
          package_id?: string | null
          project_type?: string | null
          proposal_id?: string | null
          retention_hold_until?: string | null
          service_id?: string | null
          start_date?: string | null
          status?: string
          summary?: string | null
          team_id?: string | null
          team_lead_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "studio_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "studio_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "studio_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "studio_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "studio_team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_proposal_milestones: {
        Row: {
          amount: number | null
          amount_kobo: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          due_label: string | null
          id: string
          name: string | null
          proposal_id: string | null
          sort_order: number | null
          title: string | null
        }
        Insert: {
          amount?: number | null
          amount_kobo?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_label?: string | null
          id?: string
          name?: string | null
          proposal_id?: string | null
          sort_order?: number | null
          title?: string | null
        }
        Update: {
          amount?: number | null
          amount_kobo?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          due_label?: string | null
          id?: string
          name?: string | null
          proposal_id?: string | null
          sort_order?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_proposal_milestones_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "studio_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_proposals: {
        Row: {
          access_token_hash: string | null
          access_token_hint: string | null
          archive_reason: string | null
          archived_at: string | null
          brief_id: string | null
          comparison_notes: string[] | null
          created_at: string
          currency: string | null
          deposit_amount: number | null
          description: string | null
          id: string
          investment: number | null
          lead_id: string | null
          legal_hold_reason: string | null
          metadata: Json | null
          notes: string | null
          package_id: string | null
          payment_terms: string | null
          price_kobo: number | null
          proposal_options: Json | null
          retention_hold_until: string | null
          scope_bullets: string[] | null
          service_id: string | null
          status: string
          summary: string | null
          team_id: string | null
          timeline: string | null
          title: string | null
          updated_at: string
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          access_token_hash?: string | null
          access_token_hint?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          brief_id?: string | null
          comparison_notes?: string[] | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          description?: string | null
          id?: string
          investment?: number | null
          lead_id?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          package_id?: string | null
          payment_terms?: string | null
          price_kobo?: number | null
          proposal_options?: Json | null
          retention_hold_until?: string | null
          scope_bullets?: string[] | null
          service_id?: string | null
          status?: string
          summary?: string | null
          team_id?: string | null
          timeline?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          access_token_hash?: string | null
          access_token_hint?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          brief_id?: string | null
          comparison_notes?: string[] | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          description?: string | null
          id?: string
          investment?: number | null
          lead_id?: string | null
          legal_hold_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          package_id?: string | null
          payment_terms?: string | null
          price_kobo?: number | null
          proposal_options?: Json | null
          retention_hold_until?: string | null
          scope_bullets?: string[] | null
          service_id?: string | null
          status?: string
          summary?: string | null
          team_id?: string | null
          timeline?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_proposals_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "studio_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "studio_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_proposals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "studio_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_proposals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "studio_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_proposals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "studio_team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_reviews: {
        Row: {
          company: string | null
          created_at: string
          customer_name: string | null
          feedback: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          published: boolean | null
          quote: string | null
          rating: number | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          customer_name?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          published?: boolean | null
          quote?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          customer_name?: string | null
          feedback?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          published?: boolean | null
          quote?: string | null
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_revisions: {
        Row: {
          created_at: string
          deliverable_id: string | null
          id: string
          notes: string | null
          project_id: string | null
          requested_by: string | null
          revision_number: number
          status: string
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deliverable_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          requested_by?: string | null
          revision_number?: number
          status?: string
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deliverable_id?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          requested_by?: string | null
          revision_number?: number
          status?: string
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_revisions_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "studio_deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_role_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          normalized_email: string | null
          role: string
          scope_id: string | null
          scope_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          normalized_email?: string | null
          role?: string
          scope_id?: string | null
          scope_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      studio_services: {
        Row: {
          created_at: string
          delivery_window: string
          headline: string
          id: string
          is_published: boolean
          kind: string
          name: string
          outcomes: string[]
          score_boosts: string[]
          slug: string
          stack: string[]
          starting_price: number
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_window: string
          headline: string
          id: string
          is_published?: boolean
          kind: string
          name: string
          outcomes?: string[]
          score_boosts?: string[]
          slug: string
          stack?: string[]
          starting_price?: number
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_window?: string
          headline?: string
          id?: string
          is_published?: boolean
          kind?: string
          name?: string
          outcomes?: string[]
          score_boosts?: string[]
          slug?: string
          stack?: string[]
          starting_price?: number
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      studio_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      studio_team_profiles: {
        Row: {
          availability: string
          created_at: string
          focus: string[]
          highlights: string[]
          id: string
          industries: string[]
          is_published: boolean
          label: string
          name: string
          score_biases: string[]
          slug: string
          stack: string[]
          summary: string
          updated_at: string
        }
        Insert: {
          availability?: string
          created_at?: string
          focus?: string[]
          highlights?: string[]
          id: string
          industries?: string[]
          is_published?: boolean
          label: string
          name: string
          score_biases?: string[]
          slug: string
          stack?: string[]
          summary: string
          updated_at?: string
        }
        Update: {
          availability?: string
          created_at?: string
          focus?: string[]
          highlights?: string[]
          id?: string
          industries?: string[]
          is_published?: boolean
          label?: string
          name?: string
          score_biases?: string[]
          slug?: string
          stack?: string[]
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      studio_typing_indicators: {
        Row: {
          project_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          project_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          project_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_typing_indicators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          attachments: Json | null
          body: string
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          id: string
          is_read: boolean
          legal_hold_reason: string | null
          read_at: string | null
          retention_hold_until: string | null
          sender_id: string
          sender_type: string
          thread_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          attachments?: Json | null
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          is_read?: boolean
          legal_hold_reason?: string | null
          read_at?: string | null
          retention_hold_until?: string | null
          sender_id: string
          sender_type?: string
          thread_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          attachments?: Json | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_reason?: string | null
          id?: string
          is_read?: boolean
          legal_hold_reason?: string | null
          read_at?: string | null
          retention_hold_until?: string | null
          sender_id?: string
          sender_type?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_thread_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          new_value: string | null
          old_value: string | null
          thread_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          thread_id: string
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_thread_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_thread_internal_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          metadata: Json
          thread_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          thread_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          thread_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_thread_internal_notes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          customer_last_read_at: string | null
          deleted_at: string | null
          deleted_reason: string | null
          division: string | null
          id: string
          legal_hold_reason: string | null
          priority: string | null
          reference_id: string | null
          reference_type: string | null
          resolved_at: string | null
          retention_hold_until: string | null
          staff_last_read_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          customer_last_read_at?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          division?: string | null
          id?: string
          legal_hold_reason?: string | null
          priority?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved_at?: string | null
          retention_hold_until?: string | null
          staff_last_read_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          customer_last_read_at?: string | null
          deleted_at?: string | null
          deleted_reason?: string | null
          division?: string | null
          id?: string
          legal_hold_reason?: string | null
          priority?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved_at?: string | null
          retention_hold_until?: string | null
          staff_last_read_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trust_flags: {
        Row: {
          created_at: string
          division: string | null
          entity_id: string | null
          entity_type: string
          evidence: Json | null
          flag_type: string
          flagged_by: string | null
          flagged_by_user_id: string | null
          id: string
          metadata: Json | null
          reason: string
          resolved_at: string | null
          review_notes: string | null
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          division?: string | null
          entity_id?: string | null
          entity_type: string
          evidence?: Json | null
          flag_type: string
          flagged_by?: string | null
          flagged_by_user_id?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          division?: string | null
          entity_id?: string | null
          entity_type?: string
          evidence?: Json | null
          flag_type?: string
          flagged_by?: string | null
          flagged_by_user_id?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          resolved_at?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          city: string
          coordinates_lat: number | null
          coordinates_lng: number | null
          country: string
          created_at: string
          formatted_address: string | null
          full_name: string | null
          google_place_id: string | null
          id: string
          is_default: boolean
          is_one_shot: boolean
          kyc_match_method: string | null
          kyc_match_score: number | null
          kyc_submission_id: string | null
          kyc_verified: boolean
          kyc_verified_at: string | null
          label: Database["public"]["Enums"]["user_address_label"]
          phone: string | null
          postal_code: string | null
          state: string | null
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country: string
          created_at?: string
          formatted_address?: string | null
          full_name?: string | null
          google_place_id?: string | null
          id?: string
          is_default?: boolean
          is_one_shot?: boolean
          kyc_match_method?: string | null
          kyc_match_score?: number | null
          kyc_submission_id?: string | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          label: Database["public"]["Enums"]["user_address_label"]
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string
          created_at?: string
          formatted_address?: string | null
          full_name?: string | null
          google_place_id?: string | null
          id?: string
          is_default?: boolean
          is_one_shot?: boolean
          kyc_match_method?: string | null
          kyc_match_score?: number | null
          kyc_submission_id?: string | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          label?: Database["public"]["Enums"]["user_address_label"]
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_kyc_submission_fk"
            columns: ["kyc_submission_id"]
            isOneToOne: false
            referencedRelation: "customer_verification_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement_events: {
        Row: {
          consumed_at: string | null
          consumer: string | null
          created_at: string
          dedupe_key: string
          division: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["user_engagement_event_type"]
          id: string
          payload: Json
          subject_id: string | null
          subject_type: string | null
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          consumer?: string | null
          created_at?: string
          dedupe_key: string
          division?: string | null
          event_date?: string
          event_type: Database["public"]["Enums"]["user_engagement_event_type"]
          id?: string
          payload?: Json
          subject_id?: string | null
          subject_type?: string | null
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          consumer?: string | null
          created_at?: string
          dedupe_key?: string
          division?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["user_engagement_event_type"]
          id?: string
          payload?: Json
          subject_id?: string | null
          subject_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_ngn: number
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          display_currency: string
          id: string
          note: string | null
          order_id: string | null
          profile_id: string | null
          reference: string | null
          settlement_currency: string
          type: string
          wallet_id: string | null
        }
        Insert: {
          amount_ngn: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          display_currency?: string
          id?: string
          note?: string | null
          order_id?: string | null
          profile_id?: string | null
          reference?: string | null
          settlement_currency?: string
          type: string
          wallet_id?: string | null
        }
        Update: {
          amount_ngn?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          display_currency?: string
          id?: string
          note?: string | null
          order_id?: string | null
          profile_id?: string | null
          reference?: string | null
          settlement_currency?: string
          type?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_kobo: number
          created_at: string
          currency: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          balance_kobo?: number
          created_at?: string
          currency?: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          balance_kobo?: number
          created_at?: string
          currency?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      care_category_expense_monthly_summary: {
        Row: {
          category: string | null
          expense_count: number | null
          month_start: string | null
          total_expense: number | null
        }
        Relationships: []
      }
      care_finance_monthly_summary: {
        Row: {
          inflow: number | null
          month_start: string | null
          net_profit: number | null
          outflow: number | null
        }
        Relationships: []
      }
      care_finance_summary: {
        Row: {
          balance: number | null
          total_inflow: number | null
          total_outflow: number | null
        }
        Relationships: []
      }
      care_staff_expense_monthly_summary: {
        Row: {
          created_by: string | null
          created_by_role: string | null
          expense_count: number | null
          month_start: string | null
          total_expense: number | null
        }
        Relationships: []
      }
      studio_client_invoices_v: {
        Row: {
          amount_kobo: number | null
          client_user_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          invoice_token: string | null
          issued_at: string | null
          last_payment_id: string | null
          last_payment_status: string | null
          last_submitted_at: string | null
          milestone_id: string | null
          normalized_email: string | null
          paid_at: string | null
          payment_count: number | null
          project_id: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "studio_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_address_summary: {
        Row: {
          city: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          country: string | null
          created_at: string | null
          formatted_address: string | null
          full_name: string | null
          id: string | null
          is_default: boolean | null
          kyc_verified: boolean | null
          label: Database["public"]["Enums"]["user_address_label"] | null
          phone: string | null
          postal_code: string | null
          state: string | null
          street: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string | null
          created_at?: string | null
          formatted_address?: string | null
          full_name?: string | null
          id?: string | null
          is_default?: boolean | null
          kyc_verified?: boolean | null
          label?: Database["public"]["Enums"]["user_address_label"] | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          country?: string | null
          created_at?: string | null
          formatted_address?: string | null
          full_name?: string | null
          id?: string | null
          is_default?: boolean | null
          kyc_verified?: boolean | null
          label?: Database["public"]["Enums"]["user_address_label"] | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_audit_log: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
          p_target_user_id?: string
        }
        Returns: undefined
      }
      admin_force_reauth: {
        Args: { p_user_id: string }
        Returns: {
          archive_reason: string | null
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          disabled_reason: string | null
          force_reauth_after: string | null
          force_signout_at: string | null
          forced_signout_at: string | null
          frozen_at: string | null
          frozen_reason: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_frozen: boolean
          legal_hold_reason: string | null
          phone: string | null
          retention_hold_until: string | null
          role: string
          updated_at: string
          wallet_balance_ngn: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_profile_frozen: {
        Args: { p_is_frozen: boolean; p_user_id: string }
        Returns: {
          archive_reason: string | null
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          disabled_reason: string | null
          force_reauth_after: string | null
          force_signout_at: string | null
          forced_signout_at: string | null
          frozen_at: string | null
          frozen_reason: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_frozen: boolean
          legal_hold_reason: string | null
          phone: string | null
          retention_hold_until: string | null
          role: string
          updated_at: string
          wallet_balance_ngn: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_profile_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: {
          archive_reason: string | null
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          deleted_reason: string | null
          disabled_reason: string | null
          force_reauth_after: string | null
          force_signout_at: string | null
          forced_signout_at: string | null
          frozen_at: string | null
          frozen_reason: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_frozen: boolean
          legal_hold_reason: string | null
          phone: string | null
          retention_hold_until: string | null
          role: string
          updated_at: string
          wallet_balance_ngn: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      care_recalculate_booking_totals: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      create_care_booking: {
        Args: {
          p_customer_name: string
          p_email?: string
          p_item_summary?: string
          p_phone: string
          p_pickup_address: string
          p_pickup_date: string
          p_pickup_slot: string
          p_service_type: string
          p_special_instructions?: string
        }
        Returns: {
          created_at: string
          id: string
          status: string
          tracking_code: string
        }[]
      }
      current_app_role: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      enqueue_search_index_op: {
        Args: {
          p_collection: string
          p_document_id: string
          p_operation: string
          p_payload?: Json
        }
        Returns: undefined
      }
      get_default_user_address: {
        Args: { p_user_id: string }
        Returns: {
          city: string
          coordinates_lat: number | null
          coordinates_lng: number | null
          country: string
          created_at: string
          formatted_address: string | null
          full_name: string | null
          google_place_id: string | null
          id: string
          is_default: boolean
          is_one_shot: boolean
          kyc_match_method: string | null
          kyc_match_score: number | null
          kyc_submission_id: string | null
          kyc_verified: boolean
          kyc_verified_at: string | null
          label: Database["public"]["Enums"]["user_address_label"]
          phone: string | null
          postal_code: string | null
          state: string | null
          street: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_addresses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_signal_feed: {
        Args: {
          after_created_at?: string
          after_score?: number
          limit_count?: number
          viewer_id: string
        }
        Returns: {
          action_url: string
          body: string
          created_at: string
          division: string
          id: string
          kind: string
          priority: string
          score: number
          source: string
          title: string
        }[]
      }
      hq_ic_can_read_thread: { Args: { p_thread_id: string }; Returns: boolean }
      hq_ic_can_write_thread: {
        Args: { p_thread_id: string }
        Returns: boolean
      }
      hq_ic_storage_thread_id_from_path: {
        Args: { obj_name: string }
        Returns: string
      }
      is_owner: { Args: never; Returns: boolean }
      is_platform_staff: { Args: never; Returns: boolean }
      is_property_staff: { Args: never; Returns: boolean }
      learn_auth_email: { Args: never; Returns: string }
      learn_is_staff: { Args: never; Returns: boolean }
      learn_matches_identity: {
        Args: { target_email: string; target_user_id: string }
        Returns: boolean
      }
      make_care_tracking_code: { Args: never; Returns: string }
      marketplace_tier_listing_cap: {
        Args: { p_tier: string }
        Returns: number
      }
      normalize_phone: { Args: { p_phone: string }; Returns: string }
      purge_completed_search_outbox: {
        Args: { p_older_than?: string }
        Returns: number
      }
      saved_items_sweep_expiry: {
        Args: never
        Returns: {
          expired_count: number
          warned_count: number
        }[]
      }
      studio_auth_email: { Args: never; Returns: string }
      studio_invoice_by_token: {
        Args: { token: string }
        Returns: {
          amount_kobo: number
          client_user_id: string | null
          created_at: string
          currency: string
          description: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_token: string | null
          issued_at: string
          milestone_id: string | null
          normalized_email: string | null
          paid_at: string | null
          project_id: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "studio_invoices"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      studio_is_staff: { Args: never; Returns: boolean }
      studio_prune_stale_typing: { Args: never; Returns: undefined }
      support_add_internal_note: {
        Args: {
          p_author_id: string
          p_body: string
          p_metadata?: Json
          p_thread_id: string
          p_visibility?: string
        }
        Returns: string
      }
      support_assign_thread: {
        Args: {
          p_actor_id?: string
          p_assignee_id: string
          p_metadata?: Json
          p_thread_id: string
        }
        Returns: Json
      }
      support_log_event: {
        Args: {
          p_actor_id?: string
          p_actor_type?: string
          p_event_type: string
          p_metadata?: Json
          p_new_value?: string
          p_old_value?: string
          p_thread_id: string
        }
        Returns: string
      }
      support_staff_reply: {
        Args: {
          p_attachments?: Json
          p_body: string
          p_metadata?: Json
          p_staff_id: string
          p_thread_id: string
        }
        Returns: Json
      }
      support_update_thread_status: {
        Args: {
          p_actor_id?: string
          p_actor_type?: string
          p_metadata?: Json
          p_new_status: string
          p_thread_id: string
        }
        Returns: Json
      }
      track_care_booking: {
        Args: { p_phone?: string; p_tracking_code: string }
        Returns: {
          created_at: string
          customer_name: string
          phone: string
          pickup_address: string
          pickup_date: string
          pickup_slot: string
          service_type: string
          special_instructions: string
          status: string
          tracking_code: string
        }[]
      }
      wallet_apply_tx: {
        Args: {
          p_amount_kobo: number
          p_created_by?: string
          p_description?: string
          p_order_id?: string
          p_profile_id: string
          p_reference?: string
          p_tx_type: string
        }
        Returns: {
          amount_ngn: number
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          display_currency: string
          id: string
          note: string | null
          order_id: string | null
          profile_id: string | null
          reference: string | null
          settlement_currency: string
          type: string
          wallet_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "manager"
        | "rider"
        | "customer"
        | "support"
        | "cashier"
        | "promoter"
      saved_item_status: "active" | "expired" | "soft_deleted" | "restored"
      user_address_label:
        | "home"
        | "office"
        | "shop"
        | "warehouse"
        | "alternative_1"
        | "alternative_2"
        | "legacy_imported_1"
        | "legacy_imported_2"
        | "legacy_imported_3"
        | "legacy_imported_4"
      user_engagement_event_type:
        | "cart_abandoned"
        | "cart_resumed"
        | "saved_item_added"
        | "saved_item_about_to_expire"
        | "saved_item_restored"
        | "saved_item_expired"
        | "checkout_started"
        | "checkout_resumed"
        | "checkout_abandoned_at_step"
        | "kyc_incomplete_after_signup"
        | "comeback_visit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "owner",
        "manager",
        "rider",
        "customer",
        "support",
        "cashier",
        "promoter",
      ],
      saved_item_status: ["active", "expired", "soft_deleted", "restored"],
      user_address_label: [
        "home",
        "office",
        "shop",
        "warehouse",
        "alternative_1",
        "alternative_2",
        "legacy_imported_1",
        "legacy_imported_2",
        "legacy_imported_3",
        "legacy_imported_4",
      ],
      user_engagement_event_type: [
        "cart_abandoned",
        "cart_resumed",
        "saved_item_added",
        "saved_item_about_to_expire",
        "saved_item_restored",
        "saved_item_expired",
        "checkout_started",
        "checkout_resumed",
        "checkout_abandoned_at_step",
        "kyc_incomplete_after_signup",
        "comeback_visit",
      ],
    },
  },
} as const
