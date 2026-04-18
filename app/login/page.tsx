"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, store_id')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'manager' && profile.store_id) {
          router.push(`/dashboard?storeId=${profile.store_id}`)
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('メールアドレスまたはパスワードが正しくありません')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#111A2B] rounded-3xl p-8 border border-white/5 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#E6ECF5]">Salon Growth OS</h1>
          <p className="text-[#8B94A7] mt-2 text-sm">美容室経営改善ツール</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#8B94A7] mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-4 text-base focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#8B94A7]/50"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#8B94A7] mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0B1220] border border-white/10 text-white rounded-xl p-4 text-base focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#8B94A7]/50"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-black font-bold rounded-xl py-4 text-base disabled:opacity-50 hover:opacity-90 transition active:scale-[0.98] mt-2"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
