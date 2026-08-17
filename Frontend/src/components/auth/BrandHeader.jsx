export default function BrandHeader() {
  return (
    <div className="mb-6 select-none">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-indigo-500/25 ring-1 ring-slate-200 dark:ring-slate-800 flex items-center justify-center">
          <span className="text-lg">💬</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">QuickChat</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Highly Secure Real-time Messaging</p>
        </div>
      </div>
    </div>
  )
}
