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
    PostgrestVersion: "14.5"
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
      assistant_conversations: {
        Row: {
          answer: string | null
          created_at: string
          error: string | null
          id: string
          intents: Json
          question: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          error?: string | null
          id?: string
          intents?: Json
          question: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          error?: string | null
          id?: string
          intents?: Json
          question?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_prepared_actions: {
        Row: {
          action_type: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decided_by_email: string | null
          expires_at: string
          id: string
          justification: string
          payload: Json
          prepared_by: string | null
          prepared_by_email: string | null
          priority: string
          recipients_count: number
          recipients_preview: Json
          result: Json
          segment_definition: Json
          segment_summary: string | null
          source: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decided_by_email?: string | null
          expires_at?: string
          id?: string
          justification?: string
          payload?: Json
          prepared_by?: string | null
          prepared_by_email?: string | null
          priority?: string
          recipients_count?: number
          recipients_preview?: Json
          result?: Json
          segment_definition?: Json
          segment_summary?: string | null
          source?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decided_by_email?: string | null
          expires_at?: string
          id?: string
          justification?: string
          payload?: Json
          prepared_by?: string | null
          prepared_by_email?: string | null
          priority?: string
          recipients_count?: number
          recipients_preview?: Json
          result?: Json
          segment_definition?: Json
          segment_summary?: string | null
          source?: string | null
          status?: string
          title?: string
          updated_at?: string
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
      code_access_attempts: {
        Row: {
          code_hash: string
          context: string
          created_at: string
          id: string
          ip_hash: string
          result: string
        }
        Insert: {
          code_hash: string
          context: string
          created_at?: string
          id?: string
          ip_hash: string
          result: string
        }
        Update: {
          code_hash?: string
          context?: string
          created_at?: string
          id?: string
          ip_hash?: string
          result?: string
        }
        Relationships: []
      }
      code_access_secret: {
        Row: {
          created_at: string
          id: number
          pepper: string
        }
        Insert: {
          created_at?: string
          id?: number
          pepper: string
        }
        Update: {
          created_at?: string
          id?: number
          pepper?: string
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
          birth_date: string | null
          city: string | null
          country: string | null
          created_at: string
          distance_km: number | null
          email: string
          first_name: string | null
          id: string
          is_test: boolean
          last_name: string | null
          level: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          marketing_consent_source: string | null
          observations: string | null
          phone: string | null
          postal_code: string | null
          recommended_gear: string | null
          tags: string[]
          test_activities: string[] | null
          test_credits: number | null
          test_first_date: string | null
          test_last_date: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          distance_km?: number | null
          email: string
          first_name?: string | null
          id?: string
          is_test?: boolean
          last_name?: string | null
          level?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_consent_source?: string | null
          observations?: string | null
          phone?: string | null
          postal_code?: string | null
          recommended_gear?: string | null
          tags?: string[]
          test_activities?: string[] | null
          test_credits?: number | null
          test_first_date?: string | null
          test_last_date?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          distance_km?: number | null
          email?: string
          first_name?: string | null
          id?: string
          is_test?: boolean
          last_name?: string | null
          level?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_consent_source?: string | null
          observations?: string | null
          phone?: string | null
          postal_code?: string | null
          recommended_gear?: string | null
          tags?: string[]
          test_activities?: string[] | null
          test_credits?: number | null
          test_first_date?: string | null
          test_last_date?: string | null
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
          offer_token_hash: string | null
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
          offer_token_hash?: string | null
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
          offer_token_hash?: string | null
          offered_at?: string | null
          participants?: number
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_claims: {
        Row: {
          claimed_at: string
          expires_at: string
          message_id: string
          worker_id: string | null
        }
        Insert: {
          claimed_at?: string
          expires_at: string
          message_id: string
          worker_id?: string | null
        }
        Update: {
          claimed_at?: string
          expires_at?: string
          message_id?: string
          worker_id?: string | null
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
          confirm_token_hash: string | null
          confirmed: boolean
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          phone: string | null
          unsubscribe_token_hash: string | null
          updated_at: string
        }
        Insert: {
          activities?: string[]
          confirm_token_hash?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          phone?: string | null
          unsubscribe_token_hash?: string | null
          updated_at?: string
        }
        Update: {
          activities?: string[]
          confirm_token_hash?: string | null
          confirmed?: boolean
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
          unsubscribe_token_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_automation_runs: {
        Row: {
          automation_id: string
          campaign_id: string | null
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          mode: string
          recipients_count: number
          result: Json
          skipped_count: number
          started_at: string
          status: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          automation_id: string
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          mode?: string
          recipients_count?: number
          result?: Json
          skipped_count?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          automation_id?: string
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          mode?: string
          recipients_count?: number
          result?: Json
          skipped_count?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "marketing_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_automation_runs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_automation_sends: {
        Row: {
          automation_id: string
          created_at: string
          dedupe_key: string
          email: string
          id: string
          run_id: string | null
          sent_at: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          dedupe_key?: string
          email: string
          id?: string
          run_id?: string | null
          sent_at?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          dedupe_key?: string
          email?: string
          id?: string
          run_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automation_sends_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "marketing_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_automation_sends_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "marketing_automation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_automations: {
        Row: {
          active: boolean
          created_at: string
          created_by_email: string | null
          dedupe_window_days: number
          delay_days: number
          description: string | null
          email_cta_label: string | null
          email_cta_url: string | null
          email_html: string
          email_subject: string
          id: string
          last_run_at: string | null
          max_recipients: number
          name: string
          next_run_at: string
          priority: number
          required_topic: string | null
          segment_definition: Json
          segment_id: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by_email?: string | null
          dedupe_window_days?: number
          delay_days?: number
          description?: string | null
          email_cta_label?: string | null
          email_cta_url?: string | null
          email_html?: string
          email_subject?: string
          id?: string
          last_run_at?: string | null
          max_recipients?: number
          name: string
          next_run_at?: string
          priority?: number
          required_topic?: string | null
          segment_definition?: Json
          segment_id?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by_email?: string | null
          dedupe_window_days?: number
          delay_days?: number
          description?: string | null
          email_cta_label?: string | null
          email_cta_url?: string | null
          email_html?: string
          email_subject?: string
          id?: string
          last_run_at?: string | null
          max_recipients?: number
          name?: string
          next_run_at?: string
          priority?: number
          required_topic?: string | null
          segment_definition?: Json
          segment_id?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automations_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          audience: Json
          content_html: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          cta_label: string | null
          cta_url: string | null
          hero_image_url: string | null
          id: string
          name: string
          preheader: string | null
          recipients_count: number
          scheduled_at: string | null
          status: string
          subject: string
          updated_at: string
          updated_by: string | null
          updated_by_email: string | null
        }
        Insert: {
          audience?: Json
          content_html?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          cta_label?: string | null
          cta_url?: string | null
          hero_image_url?: string | null
          id?: string
          name: string
          preheader?: string | null
          recipients_count?: number
          scheduled_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
          updated_by_email?: string | null
        }
        Update: {
          audience?: Json
          content_html?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          cta_label?: string | null
          cta_url?: string | null
          hero_image_url?: string | null
          id?: string
          name?: string
          preheader?: string | null
          recipients_count?: number
          scheduled_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
          updated_by_email?: string | null
        }
        Relationships: []
      }
      marketing_preferences: {
        Row: {
          activities: string[]
          consent: boolean
          consent_at: string | null
          consent_source: string | null
          created_at: string
          email: string
          id: string
          token_hash: string | null
          topics: string[]
          updated_at: string
        }
        Insert: {
          activities?: string[]
          consent?: boolean
          consent_at?: string | null
          consent_source?: string | null
          created_at?: string
          email: string
          id?: string
          token_hash?: string | null
          topics?: string[]
          updated_at?: string
        }
        Update: {
          activities?: string[]
          consent?: boolean
          consent_at?: string | null
          consent_source?: string | null
          created_at?: string
          email?: string
          id?: string
          token_hash?: string | null
          topics?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      marketing_segments: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_email: string | null
          definition: Json
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          definition?: Json
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          definition?: Json
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_settings: {
        Row: {
          brevo_list_id: number | null
          created_at: string
          id: number
          last_sync_at: string | null
          mode: string
          updated_at: string
        }
        Insert: {
          brevo_list_id?: number | null
          created_at?: string
          id?: number
          last_sync_at?: string | null
          mode?: string
          updated_at?: string
        }
        Update: {
          brevo_list_id?: number | null
          created_at?: string
          id?: number
          last_sync_at?: string | null
          mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_sync_logs: {
        Row: {
          created_at: string
          created_count: number
          details: Json
          duration_ms: number
          error_count: number
          finished_at: string | null
          id: string
          mode: string
          performed_by: string | null
          performed_by_email: string | null
          skipped_count: number
          started_at: string
          total_candidates: number
          updated_count: number
        }
        Insert: {
          created_at?: string
          created_count?: number
          details?: Json
          duration_ms?: number
          error_count?: number
          finished_at?: string | null
          id?: string
          mode?: string
          performed_by?: string | null
          performed_by_email?: string | null
          skipped_count?: number
          started_at?: string
          total_candidates?: number
          updated_count?: number
        }
        Update: {
          created_at?: string
          created_count?: number
          details?: Json
          duration_ms?: number
          error_count?: number
          finished_at?: string | null
          id?: string
          mode?: string
          performed_by?: string | null
          performed_by_email?: string | null
          skipped_count?: number
          started_at?: string
          total_candidates?: number
          updated_count?: number
        }
        Relationships: []
      }
      otp_challenges: {
        Row: {
          attempt_count: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          invalidated_at: string | null
          ip_hash: string | null
          package_id: string
        }
        Insert: {
          attempt_count?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          invalidated_at?: string | null
          ip_hash?: string | null
          package_id: string
        }
        Update: {
          attempt_count?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          ip_hash?: string | null
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_challenges_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_wallet"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "otp_challenges_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_sessions: {
        Row: {
          absolute_expires_at: string
          challenge_id: string | null
          created_at: string
          id: string
          last_seen_at: string
          package_id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          absolute_expires_at: string
          challenge_id?: string | null
          created_at?: string
          id?: string
          last_seen_at?: string
          package_id: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          absolute_expires_at?: string
          challenge_id?: string | null
          created_at?: string
          id?: string
          last_seen_at?: string
          package_id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_sessions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "otp_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otp_sessions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_wallet"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "otp_sessions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
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
      public_link_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          purpose: string
          revoked_at: string | null
          subject_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          purpose: string
          revoked_at?: string | null
          subject_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          purpose?: string
          revoked_at?: string | null
          subject_id?: string
          token_hash?: string
        }
        Relationships: []
      }
      public_rate_attempts: {
        Row: {
          blocked: boolean
          context: string
          created_at: string
          id: string
          key_hash: string
        }
        Insert: {
          blocked?: boolean
          context: string
          created_at?: string
          id?: string
          key_hash: string
        }
        Update: {
          blocked?: boolean
          context?: string
          created_at?: string
          id?: string
          key_hash?: string
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
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          status?: string
          updated_at?: string
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
          unsubscribe_token_hash: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          enabled?: boolean
          id?: string
          max_wind?: number
          min_wind?: number
          unsubscribe_token_hash?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          enabled?: boolean
          id?: string
          max_wind?: number
          min_wind?: number
          unsubscribe_token_hash?: string | null
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
      admin_get_wallet_by_code: { Args: { p_code: string }; Returns: Json }
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
      admin_platform_health: { Args: never; Returns: Json }
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
          p_booking_id?: string
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
      assistant_briefing: { Args: never; Returns: Json }
      assistant_cancel_action: {
        Args: { p_id: string; p_reason?: string }
        Returns: Json
      }
      assistant_financial_summary: { Args: never; Returns: Json }
      assistant_list_actions: {
        Args: { p_limit?: number; p_status?: string }
        Returns: Json
      }
      assistant_prepare_action: {
        Args: { p_action_type: string; p_params?: Json }
        Returns: Json
      }
      assistant_query: {
        Args: { p_intent: string; p_params?: Json }
        Returns: Json
      }
      assistant_validate_action: { Args: { p_id: string }; Returns: Json }
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
      book_daily_with_session: {
        Args: { p_date: string; p_session_token: string }
        Returns: Json
      }
      book_stage_for_package: {
        Args: { p_package_id: string; p_start_date: string }
        Returns: Json
      }
      book_stage_with_session: {
        Args: { p_session_token: string; p_start_date: string }
        Returns: Json
      }
      cancel_booking_with_session: {
        Args: { p_booking_id: string; p_session_token: string }
        Returns: Json
      }
      claim_email_send: {
        Args: {
          _lease_seconds?: number
          _message_id: string
          _worker_id?: string
        }
        Returns: boolean
      }
      claim_stripe_webhook_event: {
        Args: { p_event_id: string; p_event_type: string }
        Returns: boolean
      }
      client_credits_payload: { Args: { p_pkg: string }; Returns: Json }
      client_history_payload: { Args: { p_pkg: string }; Returns: Json }
      client_package_payload: { Args: { p_pkg: string }; Returns: Json }
      client_wallet_payload: { Args: { p_pkg: string }; Returns: Json }
      code_access_client_ip: { Args: never; Returns: string }
      code_access_guard: {
        Args: { p_code: string; p_context: string }
        Returns: boolean
      }
      code_access_hash: { Args: { p_value: string }; Returns: string }
      code_access_record: {
        Args: { p_code: string; p_context: string; p_ok: boolean }
        Returns: undefined
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
      cron_invoke_edge_function: {
        Args: { p_body?: Json; p_function_name: string }
        Returns: number
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
      get_credit_reminders_by_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      get_credits_by_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
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
      get_marketing_preferences: { Args: { p_token: string }; Returns: Json }
      get_marketing_preferences_by_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      get_marketing_segment: {
        Args: { p_definition?: Json; p_limit?: number }
        Returns: {
          activities: string[]
          avg_basket: number
          consent: boolean
          country: string
          credits_remaining: number
          department: string
          distance_km: number
          email: string
          first_date: string
          first_name: string
          last_date: string
          last_name: string
          level: string
          lifecycle: string
          next_expiry: string
          packages_count: number
          phone: string
          reservations_count: number
          revenue: number
          topics: string[]
        }[]
      }
      get_package_by_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      get_package_credits_history_by_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      get_waitlist_offer: { Args: { p_token: string }; Returns: Json }
      get_wallet_by_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_link_token: {
        Args: { p_expires_at?: string; p_purpose: string; p_subject_id: string }
        Returns: string
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
      mark_stripe_webhook_event: {
        Args: { p_error_message?: string; p_event_id: string; p_status: string }
        Returns: undefined
      }
      marketing_automation_candidates: {
        Args: { p_automation_id: string; p_limit?: number }
        Returns: {
          context: Json
          dedupe_key: string
          email: string
          first_name: string
          last_name: string
        }[]
      }
      marketing_automation_schedule_next: {
        Args: { p_automation_id: string }
        Returns: string
      }
      marketing_automations_due: {
        Args: never
        Returns: {
          active: boolean
          created_at: string
          created_by_email: string | null
          dedupe_window_days: number
          delay_days: number
          description: string | null
          email_cta_label: string | null
          email_cta_url: string | null
          email_html: string
          email_subject: string
          id: string
          last_run_at: string | null
          max_recipients: number
          name: string
          next_run_at: string
          priority: number
          required_topic: string | null
          segment_definition: Json
          segment_id: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "marketing_automations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      marketing_estimate_audience: {
        Args: { p_audience: Json }
        Returns: {
          emails: string[]
          recipients: number
        }[]
      }
      marketing_is_internal_caller: { Args: never; Returns: boolean }
      marketing_issue_pref_token: { Args: { p_email: string }; Returns: string }
      marketing_preferences_payload: {
        Args: { p_email: string }
        Returns: Json
      }
      marketing_preferences_save: {
        Args: {
          p_activities: string[]
          p_consent: boolean
          p_email: string
          p_topics: string[]
        }
        Returns: Json
      }
      marketing_segment_base: {
        Args: never
        Returns: {
          activities: string[]
          avg_basket: number
          consent: boolean
          country: string
          credits_remaining: number
          department: string
          distance_km: number
          email: string
          first_date: string
          first_name: string
          first_seen: string
          is_test: boolean
          last_date: string
          last_name: string
          level: string
          lifecycle: string
          next_expiry: string
          packages_count: number
          phone: string
          postal_code: string
          reservations_count: number
          revenue: number
          suppressed: boolean
          topics: string[]
        }[]
      }
      marketing_segment_estimate: {
        Args: { p_definition?: Json }
        Returns: Json
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
      otp_create_challenge: {
        Args: { p_ip_hash?: string; p_package_id: string }
        Returns: Json
      }
      otp_create_session: {
        Args: { p_challenge_id?: string; p_package_id: string }
        Returns: Json
      }
      otp_generate_code: { Args: never; Returns: string }
      otp_verify_challenge: {
        Args: { p_challenge_id: string; p_otp: string }
        Returns: Json
      }
      public_rate_guard: {
        Args: {
          p_context: string
          p_key: string
          p_limit: number
          p_window: string
        }
        Returns: boolean
      }
      purge_cron_run_details: {
        Args: {
          p_error_retention_days?: number
          p_success_retention_days?: number
        }
        Returns: Json
      }
      purge_expired_email_claims: { Args: never; Returns: number }
      purge_retention_logs: { Args: never; Returns: Json }
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
      release_email_claim: { Args: { _message_id: string }; Returns: undefined }
      request_otp: { Args: { p_code: string }; Returns: Json }
      resolve_link_token: {
        Args: { p_purpose: string; p_token: string }
        Returns: string
      }
      resolve_marketing_email: { Args: { p_token: string }; Returns: string }
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
      revoke_otp_session: { Args: { p_session_token: string }; Returns: Json }
      run_credit_maintenance: { Args: never; Returns: Json }
      run_dlq_purge_cycle: { Args: never; Returns: Json }
      run_dlq_retry_cycle: { Args: never; Returns: Json }
      run_waitlist_cycle: { Args: never; Returns: Json }
      save_marketing_preferences: {
        Args: {
          p_activities: string[]
          p_consent: boolean
          p_token: string
          p_topics: string[]
        }
        Returns: Json
      }
      save_marketing_preferences_by_session: {
        Args: {
          p_activities: string[]
          p_consent: boolean
          p_session_token: string
          p_topics: string[]
        }
        Returns: Json
      }
      set_credit_reminders_by_session: {
        Args: {
          p_remind_0: boolean
          p_remind_30: boolean
          p_remind_7: boolean
          p_session_token: string
        }
        Returns: Json
      }
      unit_price_eur: {
        Args: { p_activity: string; p_date?: string; p_package_type: string }
        Returns: number
      }
      unsubscribe_last_minute: { Args: { p_token: string }; Returns: boolean }
      unsubscribe_weather_alert: { Args: { p_token: string }; Returns: boolean }
      validate_otp_session: {
        Args: { p_session_token: string }
        Returns: string
      }
      verify_otp: { Args: { p_code: string; p_otp: string }; Returns: Json }
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
