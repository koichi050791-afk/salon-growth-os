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
          name: string
          code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          role: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          role?: string
          is_active?: boolean
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
          sales_target: number
          customer_target: number
          working_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          target_month: string
          sales_target: number
          customer_target: number
          working_days: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          target_month?: string
          sales_target?: number
          customer_target?: number
          working_days?: number
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
          sales_amount: number
          customer_count: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          record_date: string
          sales_amount: number
          customer_count: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          record_date?: string
          sales_amount?: number
          customer_count?: number
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
          diagnosed_at: string
          target_month: string
          score: number
          summary: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          diagnosed_at?: string
          target_month: string
          score: number
          summary: string
          details: Json
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          diagnosed_at?: string
          target_month?: string
          score?: number
          summary?: string
          details?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

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

export type RepositoryResult<T> = {
  data: T | null
  error: string | null
}

export type RepositoryListResult<T> = {
  data: T[]
  error: string | null
}
