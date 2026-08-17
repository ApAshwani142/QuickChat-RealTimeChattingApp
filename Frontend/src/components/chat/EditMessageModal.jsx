import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function EditMessageModal({ isOpen, onClose, editing, onChange, onSave }) {
  if (!editing) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Message">
      <div className="space-y-4">
        <textarea
          value={editing.text}
          onChange={(e) => onChange({ ...editing, text: e.target.value })}
          className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-fuchsia-400/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button onClick={onClose} variant="secondary" className="px-4 py-2 rounded-xl text-xs">
            Cancel
          </Button>
          <Button onClick={onSave} className="px-4 py-2 rounded-xl text-xs">
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
