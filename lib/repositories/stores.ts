import { createClient } from '../supabase/server'
import type {
  Store,
  StoreInsert,
  StoreUpdate,
  RepositoryResult,
  RepositoryListResult,
} from '../types/db'

export async function getActiveStores(): Promise<RepositoryListResult<Store>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('store_name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getAllStores(): Promise<RepositoryListResult<Store>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('store_name')
  return { data: data ?? [], error: error?.message ?? null }
}

export async function getStoreById(id: string): Promise<RepositoryResult<Store>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function getStoreByCode(code: string): Promise<RepositoryResult<Store>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_code', code)
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function createStore(store: StoreInsert): Promise<RepositoryResult<Store>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .insert(store)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}

export async function updateStore(
  id: string,
  updates: StoreUpdate
): Promise<RepositoryResult<Store>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data: data ?? null, error: error?.message ?? null }
}
