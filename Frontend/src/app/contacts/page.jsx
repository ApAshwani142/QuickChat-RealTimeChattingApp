'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ArrowLeft, LogOut } from 'lucide-react'

import Toast from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import AddContactForm from '../../components/contacts/AddContactForm'
import ContactList from '../../components/contacts/ContactList'
import EditContactModal from '../../components/contacts/EditContactModal'
import ContactContextMenu from '../../components/contacts/ContactContextMenu'

export default function ContactsPage() {
  const router = useRouter()
  const apiUrl = process.env.VITE_API_URL

  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [contacts, setContacts] = useState([])
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [loading, setLoading] = useState(false)
  const [ctx, setCtx] = useState(null) // { x, y, contactId }
  const [editing, setEditing] = useState(null) // { contactId, username, mobile }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const username = localStorage.getItem('username')
    const mobile = localStorage.getItem('mobile') || ''
    
    if (!token || !userId || !username) {
      router.push('/login')
      return
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setCurrentUser({ token, userId, username, mobile })
    setMounted(true)
  }, [router])

  const fetchContacts = () => {
    axios.get(`${apiUrl}/api/contacts`)
      .then((res) => setContacts(res.data.contacts || []))
      .catch((err) => console.error('Failed to load contacts', err))
  }

  useEffect(() => {
    if (mounted) {
      fetchContacts()
    }
  }, [mounted, apiUrl])

  const contactsWithOnline = useMemo(() => {
    return contacts.map((c) => {
      const userId = String(c.contactId ?? c.userId)
      return {
        userId,
        username: c.username,
        mobile: c.mobile,
        isOnline: Boolean(c.isOnline),
      }
    })
  }, [contacts])

  const handleAddContact = async (username, mobile) => {
    setLoading(true)
    try {
      await axios.post(`${apiUrl}/api/contacts`, { username, mobile })
      setToast({ message: 'Contact added successfully!', type: 'success' })
      fetchContacts()
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to add contact', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      await axios.patch(`${apiUrl}/api/contacts/${editing.contactId}`, {
        username: editing.username.trim(),
        mobile: editing.mobile.trim(),
      })
      setToast({ message: 'Contact updated successfully', type: 'success' })
      fetchContacts()
      setEditing(null)
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to update contact', type: 'error' })
    }
  }

  const handleDeleteContact = async () => {
    try {
      await axios.delete(`${apiUrl}/api/contacts/${ctx.contactId}`)
      setToast({ message: 'Contact removed', type: 'success' })
      fetchContacts()
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to delete contact', type: 'error' })
    } finally {
      setCtx(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('mobile')
    delete axios.defaults.headers.common['Authorization']
    router.push('/login')
  }

  if (!mounted || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse text-sm text-slate-400">Loading directory...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div className="flex items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/chat')} variant="secondary" className="px-3 py-2 rounded-xl">
            <ArrowLeft size={16} className="mr-1.5" /> Back to chat
          </Button>
          <div>
            <div className="text-xs text-slate-500 font-medium">Contacts</div>
            <div className="text-lg font-semibold">Directory</div>
          </div>
        </div>
        <Button onClick={handleLogout} variant="secondary" className="px-3 py-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
          <LogOut size={16} className="mr-1.5" /> Logout
        </Button>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col md:flex-row gap-8 px-6 py-8">
        <AddContactForm onSubmit={handleAddContact} loading={loading} />
        <div className="flex-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
          <div className="text-sm font-semibold border-b border-slate-100 dark:border-slate-800 pb-3">Your contacts</div>
          <ContactList
            contacts={contactsWithOnline}
            onStartChat={(id) => router.push(`/chat?selected=${id}`)}
            onContextMenu={(e, contactId) => setCtx({ x: e.clientX, y: e.clientY, contactId })}
          />
        </div>
      </div>

      <ContactContextMenu
        ctx={ctx}
        onClose={() => setCtx(null)}
        onEdit={() => {
          const found = contactsWithOnline.find((u) => u.userId === ctx.contactId)
          setEditing(found ? { contactId: found.userId, username: found.username, mobile: found.mobile || '' } : null)
          setCtx(null)
        }}
        onDelete={handleDeleteContact}
      />
      <EditContactModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        editing={editing}
        onChange={setEditing}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
