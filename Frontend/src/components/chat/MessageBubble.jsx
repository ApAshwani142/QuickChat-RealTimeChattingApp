import { Check, CheckCheck, FileText, Download } from 'lucide-react'

export default function MessageBubble({ message, currentUserId, onMessageContextMenu }) {
  const isMine = String(message.senderId) === String(currentUserId)
  const apiUrl = process.env.VITE_API_URL || ''
  const mediaUrl = message.mediaUrl
    ? message.mediaUrl.startsWith('data:')
      ? message.mediaUrl
      : `${apiUrl}${message.mediaUrl}`
    : null

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const renderMedia = () => {
    if (!mediaUrl) return null

    if (message.mediaType === 'image') {
      return (
        <div className="mb-1 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-w-sm">
          <img
            src={mediaUrl}
            alt={message.fileName || 'Attachment'}
            className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
            onClick={() => window.open(mediaUrl, '_blank')}
          />
        </div>
      )
    }

    if (message.mediaType === 'audio') {
      return (
        <div className="mb-1 py-1 min-w-[240px]">
          <audio controls src={mediaUrl} className="w-full h-8 scale-90 origin-left" />
        </div>
      )
    }

    // Document
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 p-2.5 rounded-xl border mb-1.5 transition select-none ${
          isMine
            ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
        }`}
      >
        <div className={`p-2 rounded-lg ${isMine ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500'}`}>
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-semibold truncate leading-tight">
            {message.fileName || 'document.pdf'}
          </div>
          <div className={`text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
            {message.fileSize || 'Unknown Size'}
          </div>
        </div>
        <Download size={16} className={isMine ? 'text-white/60' : 'text-slate-400'} />
      </a>
    )
  }

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1`}
      onContextMenu={(e) => {
        if (!onMessageContextMenu) return
        e.preventDefault()
        onMessageContextMenu(e, message)
      }}
    >
      <div
        className={[
          'max-w-[75%] rounded-2xl border px-3.5 py-2 shadow-xs transition duration-200 cursor-context-menu',
          'animate-fade-up',
          isMine
            ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white border-transparent shadow-fuchsia-500/5'
            : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs',
        ].join(' ')}
      >
        {renderMedia()}
        {message.text && (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-left">
            {message.text}
          </div>
        )}
        <div className="mt-1 flex items-center justify-end gap-1.5 select-none">
          {time && (
            <span className={`text-[9px] font-medium tracking-wide ${isMine ? 'text-white/70' : 'text-slate-450'}`}>
              {time}
            </span>
          )}
          {isMine && (
            <span>
              {message.status === 'read' ? (
                <CheckCheck size={13} className="text-cyan-300 dark:text-cyan-400 stroke-[2.5]" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={13} className="text-white/60 stroke-[2.5]" />
              ) : (
                <Check size={13} className="text-white/60 stroke-[2.5]" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
