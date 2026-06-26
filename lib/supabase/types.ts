// AUTO-GENERATED from supabase/migrations — do not edit by hand.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string | null;
          points: number;
          criteria: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon?: string | null;
          points?: number;
          criteria?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          icon?: string | null;
          points?: number;
          criteria?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          position: number;
          text: string;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          position: number;
          text: string;
          points: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          position?: number;
          text?: string;
          points?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          game_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          author_id: string;
          parent_id?: string | null;
          body: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          author_id?: string;
          parent_id?: string | null;
          body?: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      followers: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      game_categories: {
        Row: {
          game_id: string;
          category_id: string;
        };
        Insert: {
          game_id: string;
          category_id: string;
        };
        Update: {
          game_id?: string;
          category_id?: string;
        };
        Relationships: [];
      };
      game_collaborators: {
        Row: {
          game_id: string;
          user_id: string;
          role: Database['public']['Enums']['collaborator_role'];
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          game_id: string;
          user_id: string;
          role?: Database['public']['Enums']['collaborator_role'];
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          game_id?: string;
          user_id?: string;
          role?: Database['public']['Enums']['collaborator_role'];
          invited_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      game_favorites: {
        Row: {
          user_id: string;
          game_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          game_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      game_ratings: {
        Row: {
          user_id: string;
          game_id: string;
          rating: number;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          game_id: string;
          rating: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          game_id?: string;
          rating?: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          host_id: string;
          game_id: string | null;
          code: string;
          status: Database['public']['Enums']['session_status'];
          current_round_id: string | null;
          current_question_id: string | null;
          settings: Json;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          game_id?: string | null;
          code: string;
          status?: Database['public']['Enums']['session_status'];
          current_round_id?: string | null;
          current_question_id?: string | null;
          settings?: Json;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          game_id?: string | null;
          code?: string;
          status?: Database['public']['Enums']['session_status'];
          current_round_id?: string | null;
          current_question_id?: string | null;
          settings?: Json;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_tags: {
        Row: {
          game_id: string;
          tag_id: string;
        };
        Insert: {
          game_id: string;
          tag_id: string;
        };
        Update: {
          game_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      game_versions: {
        Row: {
          id: string;
          game_id: string;
          version_number: number;
          snapshot: Json;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          version_number: number;
          snapshot: Json;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          version_number?: number;
          snapshot?: Json;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          creator_id: string;
          slug: string;
          title: string;
          tagline: string | null;
          description: string | null;
          status: Database['public']['Enums']['game_status'];
          visibility: Database['public']['Enums']['game_visibility'];
          difficulty: Database['public']['Enums']['difficulty'];
          language: string;
          cover_image_url: string | null;
          estimated_minutes: number | null;
          rounds_count: number;
          questions_count: number;
          play_count: number;
          favorites_count: number;
          comments_count: number;
          rating_avg: number;
          rating_count: number;
          is_featured: boolean;
          featured_at: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          current_version_id: string | null;
          game_type: Database['public']['Enums']['game_type'];
          config: Json;
        };
        Insert: {
          id?: string;
          creator_id: string;
          slug: string;
          title: string;
          tagline?: string | null;
          description?: string | null;
          status?: Database['public']['Enums']['game_status'];
          visibility?: Database['public']['Enums']['game_visibility'];
          difficulty?: Database['public']['Enums']['difficulty'];
          language?: string;
          cover_image_url?: string | null;
          estimated_minutes?: number | null;
          rounds_count?: number;
          questions_count?: number;
          play_count?: number;
          favorites_count?: number;
          comments_count?: number;
          rating_avg?: number;
          rating_count?: number;
          is_featured?: boolean;
          featured_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          current_version_id?: string | null;
          game_type?: Database['public']['Enums']['game_type'];
          config?: Json;
        };
        Update: {
          id?: string;
          creator_id?: string;
          slug?: string;
          title?: string;
          tagline?: string | null;
          description?: string | null;
          status?: Database['public']['Enums']['game_status'];
          visibility?: Database['public']['Enums']['game_visibility'];
          difficulty?: Database['public']['Enums']['difficulty'];
          language?: string;
          cover_image_url?: string | null;
          estimated_minutes?: number | null;
          rounds_count?: number;
          questions_count?: number;
          play_count?: number;
          favorites_count?: number;
          comments_count?: number;
          rating_avg?: number;
          rating_count?: number;
          is_featured?: boolean;
          featured_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          current_version_id?: string | null;
          game_type?: Database['public']['Enums']['game_type'];
          config?: Json;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          owner_id: string;
          game_id: string | null;
          question_id: string | null;
          kind: Database['public']['Enums']['media_kind'];
          storage_path: string;
          public_url: string | null;
          mime_type: string | null;
          bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          game_id?: string | null;
          question_id?: string | null;
          kind: Database['public']['Enums']['media_kind'];
          storage_path: string;
          public_url?: string | null;
          mime_type?: string | null;
          bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          game_id?: string | null;
          question_id?: string | null;
          kind?: Database['public']['Enums']['media_kind'];
          storage_path?: string;
          public_url?: string | null;
          mime_type?: string | null;
          bytes?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          actor_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database['public']['Enums']['notification_type'];
          actor_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database['public']['Enums']['notification_type'];
          actor_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          role: Database['public']['Enums']['user_role'];
          location: string | null;
          website: string | null;
          is_verified: boolean;
          followers_count: number;
          following_count: number;
          games_count: number;
          created_at: string;
          updated_at: string;
          gender: Database['public']['Enums']['gender'] | null;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          location?: string | null;
          website?: string | null;
          is_verified?: boolean;
          followers_count?: number;
          following_count?: number;
          games_count?: number;
          created_at?: string;
          updated_at?: string;
          gender?: Database['public']['Enums']['gender'] | null;
        };
        Update: {
          id?: string;
          handle?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          location?: string | null;
          website?: string | null;
          is_verified?: boolean;
          followers_count?: number;
          following_count?: number;
          games_count?: number;
          created_at?: string;
          updated_at?: string;
          gender?: Database['public']['Enums']['gender'] | null;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          round_id: string;
          position: number;
          prompt: string;
          time_limit_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          position: number;
          prompt: string;
          time_limit_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          position?: number;
          prompt?: string;
          time_limit_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: Database['public']['Enums']['report_target'];
          target_id: string;
          reason: string;
          details: string | null;
          status: Database['public']['Enums']['report_status'];
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: Database['public']['Enums']['report_target'];
          target_id: string;
          reason: string;
          details?: string | null;
          status?: Database['public']['Enums']['report_status'];
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: Database['public']['Enums']['report_target'];
          target_id?: string;
          reason?: string;
          details?: string | null;
          status?: Database['public']['Enums']['report_status'];
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          game_id: string;
          position: number;
          title: string;
          intro_text: string | null;
          time_limit_seconds: number | null;
          points_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          position: number;
          title: string;
          intro_text?: string | null;
          time_limit_seconds?: number | null;
          points_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          position?: number;
          title?: string;
          intro_text?: string | null;
          time_limit_seconds?: number | null;
          points_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_events: {
        Row: {
          id: string;
          session_id: string;
          type: string;
          payload: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          type: string;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          type?: string;
          payload?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      session_players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          team: number;
          display_name: string;
          score: number;
          is_active: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          team?: number;
          display_name: string;
          score?: number;
          is_active?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          team?: number;
          display_name?: string;
          score?: number;
          is_active?: boolean;
          joined_at?: string;
        };
        Relationships: [];
      };
      session_scores: {
        Row: {
          id: string;
          session_id: string;
          team: number;
          round_id: string | null;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          team: number;
          round_id?: string | null;
          points?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          team?: number;
          round_id?: string | null;
          points?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          slug: string;
          name: string;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          usage_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          earned_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      collaborator_role: 'viewer' | 'editor' | 'owner';
      difficulty: 'easy' | 'medium' | 'hard';
      game_status: 'draft' | 'in_review' | 'published' | 'unlisted' | 'rejected' | 'archived';
      game_type: 'family_feud' | 'word_builder';
      game_visibility: 'public' | 'unlisted' | 'private';
      gender: 'male' | 'female';
      media_kind: 'image' | 'audio' | 'video';
      notification_type: 'follow' | 'comment' | 'rating' | 'favorite' | 'game_published' | 'game_featured' | 'achievement' | 'report_update' | 'system';
      report_status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
      report_target: 'game' | 'comment' | 'profile';
      session_status: 'lobby' | 'active' | 'paused' | 'finished' | 'abandoned';
      user_role: 'player' | 'creator' | 'moderator' | 'admin';
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
