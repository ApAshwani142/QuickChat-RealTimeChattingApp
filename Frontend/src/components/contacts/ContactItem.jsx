import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

export default function ContactItem({ contact, onStartChat, onContextMenu, delayIdx }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900/30 px-4 py-3 hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-context-menu"
      style={{ animationDelay: `${delayIdx * 25}ms` }}
      onContextMenu={(e) => onContextMenu(e, contact.userId)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar username={contact.username} profileImage={contact.profileImage} isOnline={contact.isOnline} size="md" />

        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{contact.username}</div>
          <div className="mt-0.5 text-xs text-slate-500">
            {contact.isOnline ? 'Online' : 'Offline'} • {contact.mobile ? contact.mobile : '—'}
          </div>
        </div>
      </div>

      <Button onClick={() => onStartChat(contact.userId)} className="py-2 px-3 rounded-xl text-xs">
        Start chat
      </Button>
    </div>
  )
}
