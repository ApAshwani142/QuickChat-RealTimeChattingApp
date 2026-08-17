import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { UserPlus, ArrowLeft } from 'lucide-react'
import ContactList from '../contacts/ContactList'
import AddContactForm from '../contacts/AddContactForm'
import ContactContextMenu from '../contacts/ContactContextMenu'
import EditContactModal from '../contacts/EditContactModal'

export default function ContactsSidebar({ onlineIds, onStartChat, onToast }) {
  const apiUrl = process.env.VITE_API_URL
  const [contacts, setContacts] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [query, setQuery] = useState('')

  const [contextMenu, setContextMenu] = useState(null)
  const [editingContact, setEditingContact] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchContacts = () => {
    axios
      .get(`${apiUrl}/api/contacts`)
      .then((res) => setContacts(res.data.contacts || []))
      .catch((err) => console.error('Failed to load contacts', err))
  }

  useEffect(() => {
    fetchContacts()
  }, [apiUrl])

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase()
    const mapped = contacts.map((c) => {
      const uId = String(c.contactId ?? c.userId)
      return {
        ...c,
        userId: uId,
        isOnline: onlineIds?.has(uId) ? true : Boolean(c.isOnline),
      }
    })
    if (!q) return mapped
    return mapped.filter((c) => String(c.username || '').toLowerCase().includes(q))
  }, [contacts, query, onlineIds])

  const handleAddSuccess = () => {
    fetchContacts()
    setShowAddForm(false)
    onToast('Contact added successfully!', 'success')
  }

  const handleAddContact = async (username, mobile) => {
    setLoading(true)
    try {
      await axios.post(`${apiUrl}/api/contacts`, { username, mobile })
      handleAddSuccess()
    } catch (err) {
      onToast(err?.response?.data?.error || 'Failed to add contact', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-955 w-full md:w-[320px] shrink-0 border-l border-r border-slate-200 dark:border-slate-800 animate-fade-in relative select-none">
      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Contacts</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-650 hover:text-slate-900 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition border border-slate-205 dark:border-slate-800"
          title="Add new contact"
        >
          <UserPlus size={16} />
        </button>
      </div>

      {showAddForm ? (
        <div className="flex-1 overflow-y-auto p-4 animate-fade-in">
          <button
            onClick={() => setShowAddForm(false)}
            className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-800 dark:hover:text-slate-350 bg-transparent border-0"
          >
            <ArrowLeft size={14} /> Back to list
          </button>
          <AddContactForm onSubmit={handleAddContact} loading={loading} />
        </div>
      ) : (
        <>
          <div className="px-4 py-3 shrink-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-400/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ContactList
              contacts={filteredContacts}
              onStartChat={onStartChat}
              onContextMenu={(e, cId) => {
                const target = filteredContacts.find((c) => c.userId === cId)
                if (target) setContextMenu({ x: e.clientX, y: e.clientY, contact: target })
              }}
            />
          </div>
        </>
      )}

      <ContactContextMenu
        ctx={contextMenu}
        onClose={() => setContextMenu(null)}
        onEdit={() => {
          setEditingContact({
            contactId: contextMenu.contact.userId,
            username: contextMenu.contact.username || '',
            mobile: contextMenu.contact.mobile || '',
          })
          setContextMenu(null)
        }}
        onDelete={async () => {
          if (window.confirm('Delete contact?')) {
            try {
              await axios.delete(`${apiUrl}/api/contacts/${contextMenu.contact.userId}`)
              fetchContacts()
              onToast('Contact deleted')
              setContextMenu(null)
            } catch {
              onToast('Delete failed', 'error')
            }
          }
        }}
      />

      <EditContactModal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        editing={editingContact}
        onChange={setEditingContact}
        onSave={async () => {
          try {
            await axios.patch(`${apiUrl}/api/contacts/${editingContact.contactId}`, {
              username: editingContact.username.trim(),
              mobile: editingContact.mobile.trim(),
            })
            onToast('Contact updated')
            fetchContacts()
            setEditingContact(null)
          } catch {
            onToast('Edit failed', 'error')
          }
        }}
      />
    </div>
  )
}
