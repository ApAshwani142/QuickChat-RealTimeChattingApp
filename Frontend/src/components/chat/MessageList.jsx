import MessageBubble from './MessageBubble'

export default function MessageList({ messages, currentUserId, bottomRef, onMessageContextMenu }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="space-y-3.5 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center py-20">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No messages yet. Send a greeting!</p>
          </div>
        ) : (
          messages.map((m) => {
            const key = m.messageId ?? m._id ?? `${m.senderId}-${m.receiverId}-${m.timestamp}`
            return (
              <MessageBubble
                key={key}
                message={m}
                currentUserId={currentUserId}
                onMessageContextMenu={onMessageContextMenu}
              />
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
