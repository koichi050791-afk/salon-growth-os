import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/contexts/AuthContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '池田航一｜美容師OS',
  description: 'Decisionを中心にサロンワークから学習する池田航一個人のExperience Learning System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="bg-[#0B1220]">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#0B1220] text-white antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
