export default function ContactContextMenu({ ctx, onClose, onEdit, onDelete }) {
  if (!ctx) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onMouseDown={onClose} />
      <div
        className="fixed z-50 animate-pop-in"
        style={{ left: ctx.x, top: ctx.y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="min-w-[180px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={onEdit}
            className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
          >
            Edit contact
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-full px-4 py-3 text-left text-sm text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
          >
            Delete contact
          </button>
        </div>
      </div>
    </>
  )
}
