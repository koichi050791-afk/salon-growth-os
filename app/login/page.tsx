"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'

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
      router.push('/')
    } catch (err) {
      setError('メールアドレスまたはパスワードが正しくありません')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0B1220] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111A2B] p-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#D4AF37]">IKEDA PERSONAL OS</p>
          <h1 className="mt-3 text-2xl font-bold text-[#E6ECF5]">池田航一｜美容師OS</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8B94A7]">
            Decisionを残し、次回来店・Knowledge・発信・経営へ学習をつなげる。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[#8B94A7]">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-4 text-base text-white outline-none placeholder:text-[#8B94A7]/50 focus:border-[#D4AF37]/50"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#8B94A7]">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0B1220] p-4 text-base text-white outline-none placeholder:text-[#8B94A7]/50 focus:border-[#D4AF37]/50"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#D4AF37] py-4 text-base font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : '美容師OSを開く'}
          </button>
        </form>
      </div>
    </div>
  )
}
