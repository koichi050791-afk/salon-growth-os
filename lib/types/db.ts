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
      stores: {
        Row: {
          id: string
          store_code: string
          store_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_code: string
          store_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_code?: string
          store_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          store_id: string
          name: string
          role: string
          is_active: boolean
          auth_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          role?: string
          is_active?: boolean
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          role?: string
          is_active?: boolean
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          role: 'owner' | 'manager' | 'viewer'
          store_id: string | null
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'owner' | 'manager' | 'viewer'
          store_id?: string | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'owner' | 'manager' | 'viewer'
          store_id?: string | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_configs: {
        Row: {
          id: string
          store_id: string
          target_month: string
          target_sales: number | null
          target_unit_price: number | null
          target_visits: number | null
          target_productivity: number | null
          target_repeat_rate: number | null
          memo: string | null
          working_days: number | null
          active_staff_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          target_month: string
          target_sales?: number | null
          target_unit_price?: number | null
          target_visits?: number | null
          target_productivity?: number | null
          target_repeat_rate?: number | null
          memo?: string | null
          working_days?: number | null
          active_staff_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          target_month?: string
          target_sales?: number | null
          target_unit_price?: number | null
          target_visits?: number | null
          target_productivity?: number | null
          target_repeat_rate?: number | null
          memo?: string | null
          working_days?: number | null
          active_staff_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_records: {
        Row: {
          id: string
          store_id: string
          record_date: string
          sales: number | null
          visits: number | null
          unit_price: number | null
          repeat_rate: number | null
          new_customers: number | null
          existing_customers: number | null
          working_hours: number | null
          review_count: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          record_date: string
          sales?: number | null
          visits?: number | null
          unit_price?: number | null
          repeat_rate?: number | null
          new_customers?: number | null
          existing_customers?: number | null
          working_hours?: number | null
          review_count?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          record_date?: string
          sales?: number | null
          visits?: number | null
          unit_price?: number | null
          repeat_rate?: number | null
          new_customers?: number | null
          existing_customers?: number | null
          working_hours?: number | null
          review_count?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnosis_results: {
        Row: {
          id: string
          store_id: string
          daily_record_id: string | null
          config_id: string | null
          diagnosis_status: string
          summary: string | null
          issues: Json | null
          recommended_actions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          daily_record_id?: string | null
          config_id?: string | null
          diagnosis_status: string
          summary?: string | null
          issues?: Json | null
          recommended_actions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          daily_record_id?: string | null
          config_id?: string | null
          diagnosis_status?: string
          summary?: string | null
          issues?: Json | null
          recommended_actions?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      action_logs: {
        Row: {
          id: string
          staff_id: string
          week_date: string
          action_text: string | null
          is_executed: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          week_date: string
          action_text?: string | null
          is_executed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          week_date?: string
          action_text?: string | null
          is_executed?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_store_inputs: {
        Row: {
          id: string
          store_id: string
          week_start: string
          sales: number | null
          visits: number | null
          next_visit_count: number | null
          next_visit_rate: number | null
          new_customers: number | null
          repeat_customers: number | null
          availability_score: number | null
          memo: string | null
          total_labor_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          week_start: string
          sales?: number | null
          visits?: number | null
          next_visit_count?: number | null
          next_visit_rate?: number | null
          new_customers?: number | null
          repeat_customers?: number | null
          availability_score?: number | null
          memo?: string | null
          total_labor_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          week_start?: string
          sales?: number | null
          visits?: number | null
          next_visit_count?: number | null
          next_visit_rate?: number | null
          new_customers?: number | null
          repeat_customers?: number | null
          availability_score?: number | null
          memo?: string | null
          total_labor_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_staff_inputs: {
        Row: {
          id: string
          store_id: string
          staff_id: string
          week_start: string
          sales: number | null
          visits: number | null
          labor_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          staff_id: string
          week_start: string
          sales?: number | null
          visits?: number | null
          labor_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          staff_id?: string
          week_start?: string
          sales?: number | null
          visits?: number | null
          labor_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      improvement_actions: {
        Row: {
          id: string
          store_id: string
          week_start: string
          issue_type: string
          issue_cause: string | null
          action_title: string
          action_detail: string | null
          assigned_to: string | null
          due_date: string | null
          status: 'planned' | 'in_progress' | 'completed' | 'skipped'
          completed_at: string | null
          result_status: 'improved' | 'unchanged' | 'worsened' | null
          result_note: string | null
          next_decision: 'continue' | 'switch' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          week_start: string
          issue_type: string
          issue_cause?: string | null
          action_title: string
          action_detail?: string | null
          assigned_to?: string | null
          due_date?: string | null
          status?: 'planned' | 'in_progress' | 'completed' | 'skipped'
          completed_at?: string | null
          result_status?: 'improved' | 'unchanged' | 'worsened' | null
          result_note?: string | null
          next_decision?: 'continue' | 'switch' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          week_start?: string
          issue_type?: string
          issue_cause?: string | null
          action_title?: string
          action_detail?: string | null
          assigned_to?: string | null
          due_date?: string | null
          status?: 'planned' | 'in_progress' | 'completed' | 'skipped'
          completed_at?: string | null
          result_status?: 'improved' | 'unchanged' | 'worsened' | null
          result_note?: string | null
          next_decision?: 'continue' | 'switch' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type ActionLog = Database['public']['Tables']['action_logs']['Row']
export type ActionLogInsert = Database['public']['Tables']['action_logs']['Insert']
export type ActionLogUpdate = Database['public']['Tables']['action_logs']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type Store = Database['public']['Tables']['stores']['Row']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']
export type StoreUpdate = Database['public']['Tables']['stores']['Update']

export type Staff = Database['public']['Tables']['staff']['Row']
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type StaffUpdate = Database['public']['Tables']['staff']['Update']

export type MonthlyConfig = Database['public']['Tables']['monthly_configs']['Row']
export type MonthlyConfigInsert = Database['public']['Tables']['monthly_configs']['Insert']
export type MonthlyConfigUpdate = Database['public']['Tables']['monthly_configs']['Update']

export type DailyRecord = Database['public']['Tables']['daily_records']['Row']
export type DailyRecordInsert = Database['public']['Tables']['daily_records']['Insert']
export type DailyRecordUpdate = Database['public']['Tables']['daily_records']['Update']

export type DiagnosisResult = Database['public']['Tables']['diagnosis_results']['Row']
export type DiagnosisResultInsert = Database['public']['Tables']['diagnosis_results']['Insert']
export type DiagnosisResultUpdate = Database['public']['Tables']['diagnosis_results']['Update']

export type WeeklyStoreInput = Database['public']['Tables']['weekly_store_inputs']['Row']
export type WeeklyStoreInputInsert = Database['public']['Tables']['weekly_store_inputs']['Insert']
export type WeeklyStoreInputUpdate = Database['public']['Tables']['weekly_store_inputs']['Update']

export type WeeklyStaffInput = Database['public']['Tables']['weekly_staff_inputs']['Row']
export type WeeklyStaffInputInsert = Database['public']['Tables']['weekly_staff_inputs']['Insert']
export type WeeklyStaffInputUpdate = Database['public']['Tables']['weekly_staff_inputs']['Update']

export type ImprovementAction = Database['public']['Tables']['improvement_actions']['Row']
export type ImprovementActionInsert = Database['public']['Tables']['improvement_actions']['Insert']
export type ImprovementActionUpdate = Database['public']['Tables']['improvement_actions']['Update']

export type RepositoryResult<T> = {
  data: T | null
  error: string | null
}

export type RepositoryListResult<T> = {
  data: T[]
  error: string | null
}
