import { useMemo, useState } from 'react'
import { Users, Settings, LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

export default function ChatSidebar({
  currentUser,
  users,
  selectedUserId,
  onSelectUser,
  onLogout,
  onOpenContacts,
  onOpenSettings,
  onContactContextMenu,
}) {
  const [query, setQuery] = useState('')

  const onlineCount = useMemo(() => users.filter((u) => u.isOnline).length, [users])
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => String(u.username || '').toLowerCase().includes(q))
  }, [query, users])

  return (
    <aside className="w-[320px] shrink-0 border-l border-r border-slate-200/70 bg-white/70 dark:bg-slate-950/70 dark:border-slate-800/70 backdrop-blur flex flex-col h-screen">
      <div className="flex flex-col gap-1.5 p-4 border-b border-slate-100 dark:border-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-105 select-none">Chats</h2>
        <div className="text-2xs text-slate-400 select-none">
          <span className="text-emerald-500">●</span> {onlineCount} online
        </div>
      </div>

      <div className="px-4 py-3 shrink-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-400/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="px-2 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversations</span>
        </div>
        <ul className="space-y-1.5">
          {filteredUsers.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-8">No chats found. Add contacts first!</div>
          ) : (
            filteredUsers.map((u, idx) => {
              const selected = u.userId === selectedUserId
              return (
                <li
                  key={u.userId}
                  className={[
                    'group flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200',
                    selected
                      ? 'bg-fuchsia-50/70 border border-fuchsia-100 shadow-xs dark:bg-fuchsia-950/20 dark:border-fuchsia-900/35'
                      : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40',
                    'animate-fade-up',
                  ].join(' ')}
                  style={{ animationDelay: `${idx * 20}ms` }}
                  onClick={() => onSelectUser(u.userId)}
                  onContextMenu={(e) => {
                    if (!onContactContextMenu) return
                    e.preventDefault()
                    e.stopPropagation()
                    onContactContextMenu(e, u)
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar username={u.username} profileImage={u.profileImage} isOnline={u.isOnline} size="md" />

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-slate-100">{u.username}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {u.isOnline ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </aside>
  )
}
