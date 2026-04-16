import { createClient } from '../supabase/server'
import type {
  Staff,
  StaffInsert,
  StaffUpdate,
  RepositoryResult,
  RepositoryListResult,
} from '../types/db'

export async function getActiveStaffByStore(
  storeId: string
): Promise<RepositoryListResult<Staff>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getAllStaffByStore(
  storeId: string
): Promise<RepositoryListResult<Staff>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('store_id', storeId)
    .order('name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getStaffById(id: string): Promise<RepositoryResult<Staff>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function createStaff(staff: StaffInsert): Promise<RepositoryResult<Staff>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .insert(staff)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function updateStaff(
  id: string,
  updates: StaffUpdate
): Promise<RepositoryResult<Staff>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function deactivateStaff(id: string): Promise<RepositoryResult<Staff>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}
