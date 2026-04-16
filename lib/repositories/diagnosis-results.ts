import { createClient } from '../supabase/server'
import type {
  DiagnosisResult,
  DiagnosisResultInsert,
  RepositoryResult,
  RepositoryListResult,
} from '../types/db'

export async function getDiagnosisResultsByStore(
  storeId: string
): Promise<RepositoryListResult<DiagnosisResult>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagnosis_results')
    .select('*')
    .eq('store_id', storeId)
    .order('diagnosed_at', { ascending: false })
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getDiagnosisResultById(
  id: string
): Promise<RepositoryResult<DiagnosisResult>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagnosis_results')
    .select('*')
    .eq('id', id)
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function createDiagnosisResult(
  result: DiagnosisResultInsert
): Promise<RepositoryResult<DiagnosisResult>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('diagnosis_results')
    .insert(result)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}
