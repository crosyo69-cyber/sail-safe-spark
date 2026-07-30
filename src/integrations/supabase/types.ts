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
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          email_sent_at: string | null
          id: string
          kind: string
          metadata: Json
          read_at: string | null
          ref_key: string | null
          severity: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          kind: string
          metadata?: Json
          read_at?: string | null
          ref_key?: string | null
          severity?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          kind?: string
          metadata?: Json
          read_at?: string | null
          ref_key?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          location: string | null
          metadata: Json | null
          page_path: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          metadata?: Json | null
          page_path?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          page_path?: string | null
          session_id?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          article_slug: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          article_slug: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          article_slug?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at: string
          deposit_amount: number | null
          deposit_paid_at: string | null
          email: string
          expires_at: string
          first_name: string
          id: string
          last_name: string
          notes_admin: string | null
          package_code: string
          package_type: string
          phone: string | null
          status: string
          stripe_session_id: string | null
          total_sessions: number
          updated_at: string
          used_sessions: number
        }
        Insert: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          email: string
          expires_at?: string
          first_name: string
          id?: string
          last_name: string
          notes_admin?: string | null
          package_code: string
          package_type: string
          phone?: string | null
          status?: string
          stripe_session_id?: string | null
          total_sessions: number
          updated_at?: string
          used_sessions?: number
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          last_name?: string
          notes_admin?: string | null
          package_code?: string
          package_type?: string
          phone?: string | null
          status?: string
          stripe_session_id?: string | null
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
        }
        Relationships: []
      }
      credit_audit_log: {
        Row: {
          action: string
          created_at: string
          credit_id: string | null
          details: Json
          id: string
          package_id: string | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          credit_id?: string | null
          details?: Json
          id?: string
          package_id?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          credit_id?: string | null
          details?: Json
          id?: string
          package_id?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      credit_reminder_preferences: {
        Row: {
          created_at: string
          id: string
          package_id: string
          remind_0: boolean
          remind_30: boolean
          remind_7: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          remind_0?: boolean
          remind_30?: boolean
          remind_7?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          remind_0?: boolean
          remind_30?: boolean
          remind_7?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_reminder_preferences_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "client_credit_wallet"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "credit_reminder_preferences_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_client_documents: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          email: string
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          email: string
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          email?: string
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      crm_client_levels: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at: string
          email: string
          id: string
          level: Database["public"]["Enums"]["skill_level"]
          notes: string | null
          updated_at: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          email: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          notes?: string | null
          updated_at?: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          email?: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"]
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_client_profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          observations: string | null
          phone: string | null
          recommended_gear: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          observations?: string | null
          phone?: string | null
          recommended_gear?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          observations?: string | null
          phone?: string | null
          recommended_gear?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      daily_groups: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at: string
          date: string
          group_index: number
          id: string
          max_participants: number
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          date: string
          group_index: number
          id?: string
          max_participants: number
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          date?: string
          group_index?: number
          id?: string
          max_participants?: number
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_waitlist: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at: string
          date: string
          email: string
          first_name: string
          id: string
          last_name: string
          offer_expires_at: string | null
          offer_token: string
          offered_at: string | null
          participants: number
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          date: string
          email: string
          first_name: string
          id?: string
          last_name: string
          offer_expires_at?: string | null
          offer_token?: string
          offered_at?: string | null
          participants?: number
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          date?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          offer_expires_at?: string | null
          offer_token?: string
          offered_at?: string | null
          participants?: number
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      last_minute_subscribers: {
        Row: {
          activities: string[]
          confirm_token: string
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          phone: string | null
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          activities?: string[]
          confirm_token?: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          activities?: string[]
          confirm_token?: string
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      package_bookings: {
        Row: {
          booking_kind: string
          created_at: string
          daily_group_id: string | null
          id: string
          package_id: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_kind?: string
          created_at?: string
          daily_group_id?: string | null
          id?: string
          package_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_kind?: string
          created_at?: string
          daily_group_id?: string | null
          id?: string
          package_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_bookings_daily_group_id_fkey"
            columns: ["daily_group_id"]
            isOneToOne: false
            referencedRelation: "daily_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_wallet"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "package_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_credit_history: {
        Row: {
          action: string | null
          activity: Database["public"]["Enums"]["activity_type"] | null
          balance_after: number
          booking_id: string | null
          created_at: string
          daily_group_id: string | null
          delta: number
          id: string
          kind: string
          package_id: string
          performed_by: string | null
          reason: string
        }
        Insert: {
          action?: string | null
          activity?: Database["public"]["Enums"]["activity_type"] | null
          balance_after: number
          booking_id?: string | null
          created_at?: string
          daily_group_id?: string | null
          delta: number
          id?: string
          kind: string
          package_id: string
          performed_by?: string | null
          reason: string
        }
        Update: {
          action?: string | null
          activity?: Database["public"]["Enums"]["activity_type"] | null
          balance_after?: number
          booking_id?: string | null
          created_at?: string
          daily_group_id?: string | null
          delta?: number
          id?: string
          kind?: string
          package_id?: string
          performed_by?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_credit_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_credit_history_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_wallet"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "package_credit_history_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_404_logs: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          daily_group_id: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          participants: number
          phone: string
          skill_level: Database["public"]["Enums"]["skill_level"]
          status: Database["public"]["Enums"]["reservation_status"]
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          daily_group_id?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          participants?: number
          phone: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          status?: Database["public"]["Enums"]["reservation_status"]
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          daily_group_id?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          participants?: number
          phone?: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          status?: Database["public"]["Enums"]["reservation_status"]
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_daily_group_id_fkey"
            columns: ["daily_group_id"]
            isOneToOne: false
            referencedRelation: "daily_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      session_credits: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"]
          booking_id: string | null
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          origin: string
          package_id: string
          performed_by: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity: Database["public"]["Enums"]["activity_type"]
          booking_id?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          origin?: string
          package_id: string
          performed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"]
          booking_id?: string | null
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          origin?: string
          package_id?: string
          performed_by?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_credits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_credits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_wallet"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "session_credits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      session_generation_runs: {
        Row: {
          created_count: number
          error_message: string | null
          expected_min: number
          id: string
          metadata: Json
          ok: boolean
          ran_at: string
        }
        Insert: {
          created_count?: number
          error_message?: string | null
          expected_min?: number
          id?: string
          metadata?: Json
          ok: boolean
          ran_at?: string
        }
        Update: {
          created_count?: number
          error_message?: string | null
          expected_min?: number
          id?: string
          metadata?: Json
          ok?: boolean
          ran_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_alert_subscriptions: {
        Row: {
          created_at: string
          email: string
          enabled: boolean
          id: string
          max_wind: number
          min_wind: number
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          enabled?: boolean
          id?: string
          max_wind?: number
          min_wind?: number
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          enabled?: boolean
          id?: string
          max_wind?: number
          min_wind?: number
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_credit_wallet: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"] | null
          consumed: number | null
          created_at: string | null
          email: string | null
          expires_at: string | null
          first_name: string | null
          last_name: string | null
          package_code: string | null
          package_id: string | null
          package_type: string | null
          purchased: number | null
          recredited: number | null
          remaining: number | null
          status: string | null
          total_sessions: number | null
        }
        Insert: {
          activity?: Database["public"]["Enums"]["activity_type"] | null
          consumed?: number | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          last_name?: string | null
          package_code?: string | null
          package_id?: string | null
          package_type?: string | null
          purchased?: never
          recredited?: never
          remaining?: never
          status?: string | null
          total_sessions?: number | null
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"] | null
          consumed?: number | null
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          last_name?: string | null
          package_code?: string | null
          package_id?: string | null
          package_type?: string | null
          purchased?: never
          recredited?: never
          remaining?: never
          status?: string | null
          total_sessions?: number | null
        }
        Relationships: []
      }
      cron_job_status: {
        Row: {
          active: boolean | null
          jobid: number | null
          jobname: string | null
          schedule: string | null
        }
        Insert: {
          active?: boolean | null
          jobid?: number | null
          jobname?: string | null
          schedule?: string | null
        }
        Update: {
          active?: boolean | null
          jobid?: number | null
          jobname?: string | null
          schedule?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_package_credits: {
        Args: { p_delta: number; p_package_id: string; p_reason: string }
        Returns: Json
      }
      admin_cancel_and_recredit: {
        Args: { p_id: string; p_kind: string; p_reason: string }
        Returns: Json
      }
      admin_cancel_daily_group: {
        Args: { p_group_id: string; p_reason?: string }
        Returns: Json
      }
      admin_cancel_day: {
        Args: { p_date: string; p_reason: string }
        Returns: Json
      }
      admin_cancel_group_and_recredit: {
        Args: { p_group_id: string; p_reason: string }
        Returns: Json
      }
      admin_credit_audit: { Args: { p_package_id: string }; Returns: Json }
      admin_credit_stats: {
        Args: { p_end: string; p_start: string }
        Returns: Json
      }
      admin_extend_credit: {
        Args: {
          p_credit_id: string
          p_new_expires_at: string
          p_reason: string
        }
        Returns: Json
      }
      admin_list_credits: { Args: { p_package_id: string }; Returns: Json }
      admin_list_daily_groups: { Args: { p_date: string }; Returns: Json }
      admin_list_daily_groups_range: {
        Args: { p_end: string; p_start: string }
        Returns: Json
      }
      admin_move_group_member: {
        Args: { p_id: string; p_kind: string; p_new_date: string }
        Returns: Json
      }
      admin_reactivate_credit: {
        Args: {
          p_credit_id: string
          p_new_expires_at: string
          p_reason: string
        }
        Returns: Json
      }
      admin_recredit_package: {
        Args: {
          p_notify?: boolean
          p_package_id: string
          p_reason: string
          p_sessions: number
        }
        Returns: Json
      }
      admin_remove_group_member: {
        Args: { p_id: string; p_kind: string }
        Returns: Json
      }
      admin_reschedule_booking: {
        Args: {
          p_id: string
          p_kind: string
          p_new_date: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_search_wallets: {
        Args: { p_activity?: string; p_query?: string; p_season?: string }
        Returns: Json
      }
      admin_update_daily_group: {
        Args: {
          p_group_id: string
          p_max_participants?: number
          p_notes?: string
          p_status?: string
        }
        Returns: Json
      }
      book_daily_visitor: {
        Args: {
          p_activity: Database["public"]["Enums"]["activity_type"]
          p_date: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_notes?: string
          p_participants: number
          p_phone: string
          p_stripe_session_id: string
        }
        Returns: Json
      }
      book_daily_with_code: {
        Args: { p_code: string; p_date: string }
        Returns: Json
      }
      book_stage_100_glisse: {
        Args: { p_code: string; p_start_date: string }
        Returns: Json
      }
      cancel_booking_with_code: {
        Args: { p_booking_id: string; p_code: string }
        Returns: Json
      }
      confirm_last_minute_subscription: {
        Args: { p_token: string }
        Returns: boolean
      }
      confirm_waitlist_offer: { Args: { p_token: string }; Returns: Json }
      consume_credit_fifo: {
        Args: { p_booking_id: string; p_package_id: string }
        Returns: string
      }
      credit_origin_from_reason: {
        Args: { p_kind: string; p_reason: string }
        Returns: string
      }
      crm_add_document: {
        Args: {
          p_doc_type?: string
          p_email: string
          p_title: string
          p_url: string
        }
        Returns: Json
      }
      crm_client_base: {
        Args: never
        Returns: {
          activities: string[]
          credits_consumed: number
          credits_expired: number
          credits_remaining: number
          email: string
          first_date: string
          first_name: string
          first_seen: string
          last_date: string
          last_name: string
          marketing_consent: boolean
          next_expiry: string
          packages_count: number
          participants_count: number
          phone: string
          reservations_count: number
          revenue: number
          sessions_purchased: number
          sessions_used: number
        }[]
      }
      crm_client_detail: { Args: { p_email: string }; Returns: Json }
      crm_dashboard: { Args: never; Returns: Json }
      crm_delete_document: { Args: { p_id: string }; Returns: Json }
      crm_list_clients: {
        Args: {
          p_activity?: string
          p_consent?: string
          p_limit?: number
          p_query?: string
          p_status?: string
        }
        Returns: Json
      }
      crm_set_level: {
        Args: {
          p_activity: Database["public"]["Enums"]["activity_type"]
          p_email: string
          p_level: Database["public"]["Enums"]["skill_level"]
          p_notes?: string
        }
        Returns: Json
      }
      crm_upsert_profile: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_marketing_consent?: boolean
          p_observations?: string
          p_phone?: string
          p_recommended_gear?: string
          p_tags?: string[]
        }
        Returns: Json
      }
      default_max_participants: {
        Args: { _activity: Database["public"]["Enums"]["activity_type"] }
        Returns: number
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_weather_subscription: {
        Args: { p_token: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_admin_notification: {
        Args: {
          p_body: string
          p_kind: string
          p_metadata?: Json
          p_ref_key?: string
          p_severity: string
          p_title: string
        }
        Returns: string
      }
      enqueue_booking_confirmation: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      enqueue_credit_expiry_notices: { Args: never; Returns: Json }
      enqueue_day_cancelled_notification: {
        Args: {
          p_activity: string
          p_code?: string
          p_date: string
          p_email: string
          p_first_name: string
          p_reason: string
          p_recredited: boolean
        }
        Returns: undefined
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_low_credit_warning: {
        Args: { p_package_id: string }
        Returns: undefined
      }
      enqueue_recredit_notification: {
        Args: { p_package_id: string; p_reason: string; p_sessions: number }
        Returns: undefined
      }
      enqueue_reschedule_notification: {
        Args: {
          p_activity: string
          p_email: string
          p_first_name: string
          p_kind: string
          p_new_date: string
          p_old_date: string
          p_reason: string
        }
        Returns: undefined
      }
      expire_session_credits: { Args: never; Returns: Json }
      find_or_create_daily_group: {
        Args: {
          p_activity: Database["public"]["Enums"]["activity_type"]
          p_date: string
          p_seats?: number
        }
        Returns: string
      }
      get_credit_reminders: { Args: { p_code: string }; Returns: Json }
      get_credits_by_code: { Args: { p_code: string }; Returns: Json }
      get_daily_availability: { Args: { p_date: string }; Returns: Json }
      get_email_queue_status: {
        Args: never
        Returns: {
          oldest_msg_age_sec: number
          queue_length: number
          queue_name: string
          total_messages: number
        }[]
      }
      get_latest_auth_email_status: {
        Args: { p_email: string }
        Returns: {
          error_message: string
          last_event_at: string
          status: string
          template_name: string
        }[]
      }
      get_package_by_code: { Args: { p_code: string }; Returns: Json }
      get_package_credits_history: { Args: { p_code: string }; Returns: Json }
      get_waitlist_offer: { Args: { p_token: string }; Returns: Json }
      get_wallet_by_code: { Args: { p_code: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_waitlist: {
        Args: {
          p_activity: Database["public"]["Enums"]["activity_type"]
          p_date: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_participants?: number
          p_phone: string
        }
        Returns: Json
      }
      log_credit_action: {
        Args: {
          p_action: string
          p_credit_id: string
          p_details?: Json
          p_package_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      mint_session_credits: {
        Args: {
          p_count: number
          p_expires_at?: string
          p_origin: string
          p_package_id: string
          p_reason?: string
        }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      offer_waitlist_spot: {
        Args: {
          p_activity: Database["public"]["Enums"]["activity_type"]
          p_date: string
        }
        Returns: Json
      }
      purge_stale_dlq_messages: {
        Args: { p_dlq: string; p_limit?: number; p_max_age_days?: number }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      restore_credit_fifo: {
        Args: { p_booking_id: string; p_package_id: string }
        Returns: string
      }
      retry_dlq_messages: {
        Args: {
          p_dlq: string
          p_limit?: number
          p_max_age_hours?: number
          p_max_retries?: number
          p_target: string
        }
        Returns: Json
      }
      run_credit_maintenance: { Args: never; Returns: Json }
      run_dlq_purge_cycle: { Args: never; Returns: Json }
      run_dlq_retry_cycle: { Args: never; Returns: Json }
      run_waitlist_cycle: { Args: never; Returns: Json }
      set_credit_reminders: {
        Args: {
          p_code: string
          p_remind_0: boolean
          p_remind_30: boolean
          p_remind_7: boolean
        }
        Returns: Json
      }
      unsubscribe_last_minute: { Args: { p_token: string }; Returns: boolean }
      unsubscribe_weather_alert: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "kitesurf"
        | "wingfoil"
        | "pumpfoil"
        | "foil_tracte"
        | "stage_100_glisse"
      app_role: "admin" | "moderator" | "user"
      reservation_status: "pending" | "confirmed" | "cancelled"
      skill_level: "debutant" | "intermediaire" | "confirme"
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
      activity_type: [
        "kitesurf",
        "wingfoil",
        "pumpfoil",
        "foil_tracte",
        "stage_100_glisse",
      ],
      app_role: ["admin", "moderator", "user"],
      reservation_status: ["pending", "confirmed", "cancelled"],
      skill_level: ["debutant", "intermediaire", "confirme"],
    },
  },
} as const
