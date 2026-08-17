import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import MediaSelectionPopup from './MediaSelectionPopup'

export default function MessageComposer({ disabled, value, onChange, onSend, onSelectMedia }) {
  const [isMediaOpen, setIsMediaOpen] = useState(false)

  const handleMediaSelected = (media) => {
    if (onSelectMedia) {
      onSelectMedia(media)
    }
  }

  return (
    <div className="relative border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsMediaOpen((p) => !p)}
          className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-800 disabled:opacity-60 transition cursor-pointer"
        >
          <Plus size={20} className={`transition duration-200 ${isMediaOpen ? 'rotate-45' : ''}`} />
        </button>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? 'Select a user first' : 'Type a message…'}
          disabled={disabled}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-400/40 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) onSend()
          }}
        />

        <Button
          disabled={disabled || !value.trim()}
          onClick={onSend}
          className="px-5 py-3 rounded-2xl text-sm font-semibold"
        >
          Send
        </Button>
      </div>

      <MediaSelectionPopup
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelectMedia={handleMediaSelected}
      />
    </div>
  )
}
