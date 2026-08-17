import { useState } from 'react'
import { UserPlus, Plus } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function AddContactForm({ onSubmit, loading }) {
  const [username, setUsername] = useState('')
  const [mobile, setMobile] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) return
    onSubmit(username.trim(), mobile.trim())
    setUsername('')
    setMobile('')
  
  }

  return (
    <div className="w-full md:w-80 shrink-0 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
          <UserPlus size={18} className="text-fuchsia-500" />
          Add a contact
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Enter the username of an existing user. You can also optionally specify their mobile number.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="contactUsername"
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="e.g. Alice"
          required
        />

        <Input
          id="contactMobile"
          label="Mobile number (Optional)"
          value={mobile}
          onChange={setMobile}
          placeholder="e.g. +1 5551234567"
        />

        <Button type="submit" loading={loading} className="w-full mt-2">
          <Plus size={16} className="mr-1.5" />
          Add Contact
        </Button>
      </form>
    </div>
  )
}
