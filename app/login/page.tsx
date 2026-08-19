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
    <div className="flex min-h-dvh items-center justify-center bg-[var(--paper)] px-5 py-8 text-[var(--ink)]">
      <div className="w-full max-w-sm border-y border-[var(--line)] bg-[var(--paper-soft)] px-1 py-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">Ikeda Personal OS</p>
          <h1 className="mt-3 text-[32px] font-medium leading-tight">池田航一｜美容師OS</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Decisionを残し、次回来店・Knowledge・発信・経営へ学習をつなげる。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[52px] w-full border border-[var(--line)] bg-white/70 p-4 text-base text-[var(--ink)] outline-none placeholder:text-[color:rgba(119,115,107,0.58)] focus:border-[var(--gold)]"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[var(--muted)]">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[52px] w-full border border-[var(--line)] bg-white/70 p-4 text-base text-[var(--ink)] outline-none placeholder:text-[color:rgba(119,115,107,0.58)] focus:border-[var(--gold)]"
              placeholder="password"
              required
            />
          </div>

          {error && (
            <div className="border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-[56px] w-full bg-[var(--charcoal)] px-5 py-4 text-base font-medium text-[var(--paper-soft)] transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'ログイン中…' : '美容師OSを開く'}
          </button>
        </form>
      </div>
    </div>
  )
}
