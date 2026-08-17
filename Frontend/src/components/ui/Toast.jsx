import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, onClose, duration])

  if (!message) return null

  const styles = {
    success: 'bg-emerald-500 text-white shadow-emerald-500/20',
    error: 'bg-red-500 text-white shadow-red-500/20',
    info: 'bg-indigo-500 text-white shadow-indigo-500/20',
  }

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg animate-fade-in max-w-sm text-sm font-semibold text-white bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/10">
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs ${styles[type]}`}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </div>
      <div className="flex-1 text-slate-100">{message}</div>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-200 text-sm font-semibold cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
