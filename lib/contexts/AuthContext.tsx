"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type UserProfile = {
  role: 'owner' | 'manager' | 'viewer'
  storeId: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isOwner: boolean
  isManager: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    role: data.role as 'owner' | 'manager' | 'viewer',
    storeId: data.store_id ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
      }
      // 認証済みの場合は onAuthStateChange の SIGNED_IN で user/profile/loading をまとめて更新
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (event === 'SIGNED_IN' && currentUser) {
        const p = await fetchProfile(currentUser.id)
        setProfile(p)
      } else if (!currentUser) {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  const isOwner = profile?.role === 'owner'
  const isManager = profile?.role === 'manager'

  return (
    <AuthContext.Provider value={{ user, profile, loading, isOwner, isManager, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
