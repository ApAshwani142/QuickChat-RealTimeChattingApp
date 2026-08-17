export default function MessageContextMenu({ ctx, currentUserId, onClose, onEdit, onDelete }) {
  if (!ctx) return null
  const isMine = String(ctx.message.senderId) === String(currentUserId)

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />
      <div className="fixed z-50 animate-pop-in" style={{ left: ctx.x, top: ctx.y }}>
        <div
          className="min-w-[180px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={!isMine}
            onClick={onEdit}
            className={[
              'w-full px-4 py-3 text-left text-sm transition cursor-pointer',
              isMine ? 'hover:bg-slate-50 dark:hover:bg-slate-900' : 'opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            Edit message
          </button>
          <button
            type="button"
            disabled={!isMine}
            onClick={onDelete}
            className={[
              'w-full px-4 py-3 text-left text-sm transition text-red-600 cursor-pointer',
              isMine ? 'hover:bg-red-50 dark:hover:bg-red-950/20' : 'opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            Delete message
          </button>
        </div>
      </div>
    </>
  )
}
