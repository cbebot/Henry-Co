/**
 * Generated shape for Supabase public schema (minimal starter).
 * Regenerate with `supabase gen types` when schema evolves.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      divisions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          status: string;
          featured: boolean;
          summary: string | null;
          accent_hex: string | null;
          destination_url: string | null;
          sectors: string[] | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          status?: string;
          featured?: boolean;
          summary?: string | null;
          accent_hex?: string | null;
          destination_url?: string | null;
          sectors?: string[] | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["divisions"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          country: string | null;
          preferred_contact: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          country?: string | null;
          preferred_contact?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          topic: string;
          message: string;
          division_slug: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          topic: string;
          message: string;
          division_slug?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_submissions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
