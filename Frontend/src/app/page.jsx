'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/chat')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-pulse text-sm text-slate-400">Redirecting...</div>
    </div>
  )
}
