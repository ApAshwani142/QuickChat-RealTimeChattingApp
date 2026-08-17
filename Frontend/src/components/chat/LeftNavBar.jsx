import { MessageSquare, Users, Settings, LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar'

export default function LeftNavBar({ activeTab, setActiveTab, onLogout, currentUser }) {
  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="w-[64px] bg-slate-900 text-slate-400 flex flex-col items-center py-4 justify-between h-screen shrink-0 select-none">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* App Logo */}
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-fuchsia-500/10">
          Q
        </div>

        {/* Tab Icons */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition cursor-pointer relative group ${
                  active ? 'bg-slate-850 text-white' : 'hover:bg-slate-800/50 hover:text-slate-200'
                }`}
                title={tab.label}
              >
                <Icon size={20} />
                {active && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-fuchsia-500 rounded-r-md" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 w-full px-2">
        <button
          onClick={onLogout}
          className="h-11 w-11 rounded-xl flex items-center justify-center hover:bg-red-950/20 text-red-400 hover:text-red-300 transition cursor-pointer"
          title="Log out"
        >
          <LogOut size={20} />
        </button>

        <div className="border-t border-slate-800 pt-3 w-full flex justify-center">
          <Avatar
            username={currentUser.username}
            profileImage={currentUser.profileImage}
            size="sm"
            showStatus={false}
          />
        </div>
      </div>
    </div>
  )
}
