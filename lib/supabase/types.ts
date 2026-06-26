/**
 * Database types for the Supabase schema.
 *
 * This file is hand-maintained for the tables that exist today and will be
 * fully regenerated from the live schema once the Milestone 2 migrations are
 * applied, via:
 *
 *   supabase gen types typescript --project-id <id> --schema public > lib/supabase/types.ts
 *
 * Until then it gives us end-to-end type safety on the existing tables.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'player' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          owner_id: string;
          status: string;
          current_round: number;
          total_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          status?: string;
          current_round?: number;
          total_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          status?: string;
          current_round?: number;
          total_score?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
