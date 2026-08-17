import Input from '../ui/Input'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function EditContactModal({ isOpen, onClose, editing, onChange, onSave }) {
  if (!editing) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Contact Details">
      <div className="space-y-4">
        <Input
          id="editUsername"
          label="Username"
          value={editing.username}
          onChange={(val) => onChange({ ...editing, username: val })}
          required
        />

        <Input
          id="editMobile"
          label="Mobile Number"
          value={editing.mobile}
          onChange={(val) => onChange({ ...editing, mobile: val })}
          required
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
