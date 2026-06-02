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
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          article_slug: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          article_slug?: string
          content?: string
          created_at?: string
          id?: string
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
          created_at: string
          id: string
          package_id: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
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
          email: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          participants: number
          phone: string
          session_id: string
          skill_level: Database["public"]["Enums"]["skill_level"]
          status: Database["public"]["Enums"]["reservation_status"]
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          participants?: number
          phone: string
          session_id: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          status?: Database["public"]["Enums"]["reservation_status"]
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          participants?: number
          phone?: string
          session_id?: string
          skill_level?: Database["public"]["Enums"]["skill_level"]
          status?: Database["public"]["Enums"]["reservation_status"]
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at: string
          date: string
          id: string
          is_last_minute: boolean
          last_minute_label: string | null
          max_participants: number
          notes: string | null
          published_at: string | null
          status: string
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at: string
          weather_condition: string | null
          weather_note: string | null
        }
        Insert: {
          activity: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          date: string
          id?: string
          is_last_minute?: boolean
          last_minute_label?: string | null
          max_participants?: number
          notes?: string | null
          published_at?: string | null
          status?: string
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
          weather_condition?: string | null
          weather_note?: string | null
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          date?: string
          id?: string
          is_last_minute?: boolean
          last_minute_label?: string | null
          max_participants?: number
          notes?: string | null
          published_at?: string | null
          status?: string
          time_slot?: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
          weather_condition?: string | null
          weather_note?: string | null
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
      book_session_with_code: {
        Args: { p_code: string; p_session_id: string }
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      delete_weather_subscription: {
        Args: { p_token: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      unsubscribe_last_minute: { Args: { p_token: string }; Returns: boolean }
      unsubscribe_weather_alert: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      activity_type: "kitesurf" | "wingfoil" | "pumpfoil" | "foil_tracte"
      app_role: "admin" | "moderator" | "user"
      reservation_status: "pending" | "confirmed" | "cancelled"
      skill_level: "debutant" | "intermediaire" | "confirme"
      time_slot: "morning" | "early_afternoon" | "late_afternoon"
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
      activity_type: ["kitesurf", "wingfoil", "pumpfoil", "foil_tracte"],
      app_role: ["admin", "moderator", "user"],
      reservation_status: ["pending", "confirmed", "cancelled"],
      skill_level: ["debutant", "intermediaire", "confirme"],
      time_slot: ["morning", "early_afternoon", "late_afternoon"],
    },
  },
} as const
