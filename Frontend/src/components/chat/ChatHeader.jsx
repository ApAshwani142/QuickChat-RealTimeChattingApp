import Avatar from '../ui/Avatar'

export default function ChatHeader({ selectedUser, chatLoading, onClick }) {
  return (
    <div
      onClick={selectedUser ? onClick : undefined}
      className={[
        'flex items-center justify-between gap-4 border-b border-slate-200 bg-white/70 dark:bg-slate-950/70 dark:border-slate-800 px-6 py-4 backdrop-blur select-none',
        selectedUser ? 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        {selectedUser && (
          <Avatar
            username={selectedUser.username}
            profileImage={selectedUser.profileImage}
            isOnline={selectedUser.isOnline}
            size="md"
          />
        )}
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-medium">
            {selectedUser ? 'Chatting with' : 'Welcome to QuickChat'}
          </div>
          <h2 className="mt-0.5 truncate text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {selectedUser ? selectedUser.username : 'Select a conversation'}
          </h2>
          {selectedUser && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  selectedUser.isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-355 dark:border-emerald-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-850'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    selectedUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {selectedUser.isOnline ? 'Online' : 'Offline'}
              </span>
              {selectedUser.mobile && (
                <span className="text-slate-450 text-[10px]">Mobile: {selectedUser.mobile}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {chatLoading && selectedUser && (
        <span className="text-xs text-slate-450 animate-pulse bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
          Loading history…
        </span>
      )}
    </div>
  )
}
