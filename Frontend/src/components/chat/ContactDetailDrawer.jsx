import { X, Phone, Mail } from 'lucide-react'
import Avatar from '../ui/Avatar'

export default function ContactDetailDrawer({ isOpen, onClose, contact }) {
  if (!isOpen || !contact) return null

  return (
    <aside className="w-[300px] shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-screen animate-fade-in shadow-lg">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-900">
        <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-200">Contact info</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 select-none">
        {/* User Avatar Card */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100 dark:border-slate-900">
          <Avatar
            username={contact.username}
            profileImage={contact.profileImage}
            size="xl"
            isOnline={contact.isOnline}
          />
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{contact.username}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{contact.isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>

        {/* Status / About */}
        <div className="space-y-1.5 pb-5 border-b border-slate-100 dark:border-slate-900">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">About</span>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">
            "{contact.statusMessage || 'Hey there! I am using QuickChat.'}"
          </p>
        </div>

        {/* Info Rows */}
        <div className="space-y-4">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Details</span>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500">
              <Phone size={16} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Mobile Phone</div>
              <div className="text-sm font-semibold">{contact.mobile || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500">
              <Mail size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400">Email Address</div>
              <div className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                {contact.email || 'No email shared'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
