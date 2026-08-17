export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  className = '',
}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98'

  const variants = {
    primary:
      'bg-linear-to-r from-fuchsia-500 to-indigo-500 text-white shadow-md hover:brightness-105 shadow-indigo-500/10 hover:shadow-indigo-500/20',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-500 text-white shadow-md hover:bg-red-600 shadow-red-500/10',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : null}
      {children}
    </button>
  )
}
