function getInitials(name) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getAvatarGradient(username) {
  const gradients = [
    'from-fuchsia-500/20 to-indigo-500/20 ring-fuchsia-400/20 text-fuchsia-700 dark:text-fuchsia-300',
    'from-emerald-500/20 to-teal-500/20 ring-emerald-400/20 text-emerald-700 dark:text-emerald-300',
    'from-sky-500/20 to-cyan-500/20 ring-sky-400/20 text-sky-700 dark:text-sky-300',
    'from-violet-500/20 to-purple-500/20 ring-violet-400/20 text-violet-700 dark:text-violet-300',
    'from-orange-500/20 to-amber-500/20 ring-orange-400/20 text-orange-700 dark:text-orange-300',
    'from-rose-500/20 to-pink-500/20 ring-rose-400/20 text-rose-700 dark:text-rose-300',
  ]

  let hash = 0
  const userStr = String(username || '')
  for (let i = 0; i < userStr.length; i += 1) {
    hash = (hash * 31 + userStr.charCodeAt(i)) >>> 0
  }
  return gradients[hash % gradients.length]
}

export default function Avatar({ username, profileImage, size = 'md', isOnline = false, showStatus = true }) {
  const initials = getInitials(username)
  const gradient = getAvatarGradient(username)
  const apiUrl = process.env.VITE_API_URL || ''

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  }

  const indicatorSize = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
    xl: 'h-5 w-5',
  }

  const imageUrl = profileImage
    ? profileImage.startsWith('data:')
      ? profileImage
      : `${apiUrl}${profileImage}`
    : null

  return (
    <div
      className={[
        'relative flex shrink-0 items-center justify-center rounded-full overflow-hidden font-semibold ring-1 ring-slate-100 dark:ring-slate-800',
        sizeClasses[size],
        imageUrl ? 'bg-slate-100 dark:bg-slate-900' : `bg-gradient-to-br ${gradient}`,
      ].join(' ')}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        initials
      )}
      {showStatus && (
        <span
          aria-hidden="true"
          className={[
            'absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-white dark:ring-slate-900 z-10',
            indicatorSize[size],
            isOnline ? 'bg-emerald-500' : 'bg-slate-400',
          ].join(' ')}
        />
      )}
    </div>
  )
}
