/**
 * Supabase Database Types
 * Generated from the schema in supabase/migrations/
 *
 * To regenerate types after schema changes:
 * npx supabase gen types typescript --project-id xxxtbzypheuiniuqynas > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reps: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          apex_rep_code: string
          upline_rep_id: string | null
          tier_level: number
          total_subscribers: number
          total_mrr: number
          total_commission: number
          status: string
          joined_at: string
          last_commission_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reps']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reps']['Insert']>
      }
      subscribers: {
        Row: {
          id: string
          auth_user_id: string | null
          name: string
          email: string
          phone: string | null
          business_name: string | null
          business_type: 'insurance' | 'cpa' | 'law' | 'realestate' | 'other' | null
          bot_name: string
          bot_personality: string
          bot_timezone: string
          industry_pack: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_mrr: number
          billing_status: string
          control_phone: string | null
          control_email: string | null
          control_discord_id: string | null
          preferred_channel: string
          vapi_assistant_id: string | null
          vapi_phone_number_id: string | null
          vapi_phone_number: string | null
          rep_id: string | null
          apex_rep_code: string | null
          status: string
          onboarded_at: string | null
          last_active_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscribers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>
      }
      feature_flags: {
        Row: {
          id: string
          subscriber_id: string
          feature_name: string
          enabled: boolean
          enabled_at: string | null
          disabled_at: string | null
          price_add_on: number
          skill_name: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['feature_flags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['feature_flags']['Insert']>
      }
      control_states: {
        Row: {
          id: string
          subscriber_id: string
          outbound_calls_enabled: boolean
          social_posting_enabled: boolean
          email_sending_enabled: boolean
          campaigns_enabled: boolean
          calling_hours_start: string
          calling_hours_end: string
          blackout_days: string[]
          mode: string
          mode_expires_at: string | null
          paused_until: string | null
          paused_features: string[]
          priority_task: string | null
          paused_campaigns: string[]
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['control_states']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['control_states']['Insert']>
      }
      commands_log: {
        Row: {
          id: string
          subscriber_id: string | null
          channel: 'sms' | 'email' | 'discord' | 'phone' | 'app' | null
          raw_message: string | null
          parsed_intent: string | null
          skill_triggered: string | null
          result: string | null
          success: boolean
          error_message: string | null
          duration_ms: number | null
          cost_usd: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['commands_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['commands_log']['Insert']>
      }
      unknown_requests: {
        Row: {
          id: string
          subscriber_id: string | null
          raw_message: string
          channel: string | null
          suggested_feature: string | null
          subscriber_suggested: boolean
          handled: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['unknown_requests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['unknown_requests']['Insert']>
      }
      call_summaries: {
        Row: {
          id: string
          subscriber_id: string | null
          vapi_call_id: string | null
          call_type: 'inbound' | 'outbound' | null
          caller_number: string | null
          contact_name: string | null
          duration_seconds: number
          transcript: string | null
          summary: string | null
          sentiment: string | null
          action_required: boolean
          action_items: Json | null
          lead_captured: boolean
          recording_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['call_summaries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['call_summaries']['Insert']>
      }
      campaigns: {
        Row: {
          id: string
          subscriber_id: string | null
          prospect_name: string
          prospect_email: string
          prospect_phone: string | null
          industry: string | null
          goal: string | null
          sequence_length: number
          interval_days: number
          status: string
          current_email_index: number
          emails_sent: number
          opens: number
          clicks: number
          replies: number
          unsubscribed: boolean
          created_at: string
          approved_at: string | null
          next_send_at: string | null
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
      }
      campaign_emails: {
        Row: {
          id: string
          campaign_id: string
          subscriber_id: string | null
          sequence_number: number
          subject: string
          body: string
          scheduled_at: string | null
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          resend_email_id: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaign_emails']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['campaign_emails']['Insert']>
      }
      cost_events: {
        Row: {
          id: string
          subscriber_id: string | null
          event_type: string
          skill_name: string | null
          provider: string
          model: string | null
          units: number | null
          unit_type: string | null
          cost_usd: number
          markup_pct: number
          bill_amount: number | null
          billable: boolean
          billed: boolean
          task_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cost_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cost_events']['Insert']>
      }
      apex_commissions: {
        Row: {
          id: string
          rep_id: string | null
          subscriber_id: string | null
          event_type: string
          old_mrr: number
          new_mrr: number
          mrr_delta: number
          rep_commission: number
          waterfall_breakdown: Json | null
          stripe_event_id: string | null
          processed_at: string
        }
        Insert: Omit<Database['public']['Tables']['apex_commissions']['Row'], 'id' | 'processed_at'>
        Update: Partial<Database['public']['Tables']['apex_commissions']['Insert']>
      }
      upgrade_events: {
        Row: {
          id: string
          subscriber_id: string | null
          stripe_event_id: string
          event_type: string
          feature_name: string | null
          processed_at: string
        }
        Insert: Omit<Database['public']['Tables']['upgrade_events']['Row'], 'id' | 'processed_at'>
        Update: Partial<Database['public']['Tables']['upgrade_events']['Insert']>
      }
      weekly_scorecards: {
        Row: {
          id: string
          subscriber_id: string | null
          week_start: string
          week_end: string
          calls_handled: number
          calls_missed: number
          emails_sent: number
          emails_received: number
          appointments_booked: number
          leads_generated: number
          campaigns_active: number
          social_posts_published: number
          top_action_item: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weekly_scorecards']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weekly_scorecards']['Insert']>
      }
      task_performance: {
        Row: {
          id: string
          subscriber_id: string | null
          skill_name: string
          model_used: string | null
          input_tokens: number | null
          output_tokens: number | null
          tool_calls_made: number
          tool_calls_succeeded: number
          duration_ms: number | null
          cost_usd: number | null
          success: boolean
          error_type: string | null
          retry_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['task_performance']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['task_performance']['Insert']>
      }
      subscriber_apps: {
        Row: {
          id: string
          subscriber_id: string | null
          app_name: string
          description: string | null
          github_repo: string | null
          supabase_project_id: string | null
          vercel_project_id: string | null
          live_url: string | null
          status: string
          build_log: Json | null
          created_at: string
          deployed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['subscriber_apps']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['subscriber_apps']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
