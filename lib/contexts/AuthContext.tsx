"use client"

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { runAfterCurrentEffect } from '@/lib/utils/deferred-effect'

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
  const authUserIdRef = useRef<string | null>(null)
  const currentUserId = user?.id ?? null

  useEffect(() => {
    let isMounted = true

    const applyAuthUser = (currentUser: User | null) => {
      const nextUserId = currentUser?.id ?? null
      const previousUserId = authUserIdRef.current
      authUserIdRef.current = nextUserId

      setUser(currentUser)

      if (!currentUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      if (nextUserId !== previousUserId) {
        setProfile(null)
        setLoading(true)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      applyAuthUser(session?.user ?? null)
    }).catch(() => {
      if (!isMounted) return
      applyAuthUser(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      applyAuthUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    let isCurrent = true
    const cancelProfileFetch = runAfterCurrentEffect(() => {
      void fetchProfile(currentUserId)
        .then((p) => {
          if (isCurrent) setProfile(p)
        })
        .catch(() => {
          if (isCurrent) setProfile(null)
        })
        .finally(() => {
          if (isCurrent) setLoading(false)
        })
    })

    return () => {
      isCurrent = false
      cancelProfileFetch()
    }
  }, [currentUserId])

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
