'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { io } from 'socket.io-client'
import axios from 'axios'

import LeftNavBar from '../../components/chat/LeftNavBar'
import ChatSidebar from '../../components/chat/ChatSidebar'
import ContactsSidebar from '../../components/chat/ContactsSidebar'
import SettingsPanel from '../../components/chat/SettingsPanel'
import ChatHeader from '../../components/chat/ChatHeader'
import MessageList from '../../components/chat/MessageList'
import MessageComposer from '../../components/chat/MessageComposer'
import ContactDetailDrawer from '../../components/chat/ContactDetailDrawer'
import Toast from '../../components/ui/Toast'

export default function ChatPage() {
  const router = useRouter()
  const apiUrl = process.env.VITE_API_URL
  const socketUrl = process.env.VITE_SOCKET_URL || apiUrl

  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [socket, setSocket] = useState(null)
  const [onlineIds, setOnlineIds] = useState(() => new Set())
  
  const [activeTab, setActiveTab] = useState('chats')
  const [contacts, setContacts] = useState([])
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  
  const [selectedUserId, setSelectedUserId] = useState(null)
  
  const bottomRef = useRef(null)
  const socketRef = useRef(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  // Initialize client authentication and redirect if not logged in
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

  // Initialize socket connection once authenticated
  useEffect(() => {
    if (!currentUser) return

    const s = io(socketUrl, {
      transports: ['websocket'],
      auth: { token: currentUser.token },
    })
    socketRef.current = s
    setSocket(s)

    const handleUserOnline = ({ userId }) => {
      if (!userId) return
      setOnlineIds((prev) => {
        const next = new Set(prev)
        next.add(String(userId))
        return next
      })
    }

    const handleUserOffline = ({ userId }) => {
      if (!userId) return
      setOnlineIds((prev) => {
        const next = new Set(prev)
        next.delete(String(userId))
        return next
      })
    }

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
      if (err.message?.includes('Authentication') || err.message?.includes('token') || err.message?.includes('expired')) {
        handleLogout()
      }
    })

    s.on('user_online', handleUserOnline)
    s.on('user_offline', handleUserOffline)

    // Handle bfcache to prevent WebSocket errors when page is suspended/restored
    const handlePageHide = () => {
      if (s) s.disconnect()
    }
    const handlePageShow = (e) => {
      if (e.persisted && s && !s.connected) s.connect()
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
      s.off('connect_error')
      s.off('user_online', handleUserOnline)
      s.off('user_offline', handleUserOffline)
      s.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [currentUser, socketUrl])

  // Fetch contacts
  const fetchContacts = () => {
    axios.get(`${apiUrl}/api/contacts`)
      .then((res) => setContacts(res.data.contacts || []))
      .catch(console.error)
  }

  useEffect(() => {
    if (mounted) {
      fetchContacts()
    }
  }, [mounted, apiUrl])

  // Socket listener for messages
  useEffect(() => {
    if (!socket) return
    const handleReceiveMsg = (m) => {
      if (selectedUserId && (m.senderId === selectedUserId || m.receiverId === selectedUserId)) {
        setMessages((p) => [...p, m])
      }
    }
    const handleMsgUpdated = (m) => {
      setMessages((p) => p.map((x) => String(x.messageId) === String(m.messageId) ? { ...x, text: m.text } : x))
    }
    const handleMsgDeleted = (m) => {
      setMessages((p) => p.filter((x) => String(x.messageId) !== String(m.messageId)))
    }
    const handleMsgDelivered = ({ messageIds }) => {
      setMessages((p) => p.map((x) => messageIds.includes(x.messageId) ? { ...x, status: 'delivered' } : x))
    }
    const handleMsgRead = ({ messageIds }) => {
      setMessages((p) => p.map((x) => messageIds.includes(x.messageId) ? { ...x, status: 'read' } : x))
    }

    socket.on('receive_message', handleReceiveMsg)
    socket.on('message_updated', handleMsgUpdated)
    socket.on('message_deleted', handleMsgDeleted)
    socket.on('messages_delivered', handleMsgDelivered)
    socket.on('messages_read', handleMsgRead)

    return () => {
      socket.off('receive_message', handleReceiveMsg)
      socket.off('message_updated', handleMsgUpdated)
      socket.off('message_deleted', handleMsgDeleted)
      socket.off('messages_delivered', handleMsgDelivered)
      socket.off('messages_read', handleMsgRead)
    }
  }, [socket, selectedUserId])

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUserId) { setMessages([]); return }
    setChatLoading(true)
    axios.get(`${apiUrl}/api/messages/${selectedUserId}`)
      .then((res) => setMessages(res.data.messages || []))
      .finally(() => setChatLoading(false))
  }, [apiUrl, selectedUserId])

  // Auto-scroll and read messages
  useEffect(() => {
    if (socket && selectedUserId) socket.emit('read_messages', { senderId: selectedUserId })
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, socket, selectedUserId])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('mobile')
    delete axios.defaults.headers.common['Authorization']
    if (socketRef.current) socketRef.current.disconnect()
    socketRef.current = null
    setSocket(null)
    router.push('/login')
  }

  // Handle selected user routing

  const usersForSidebar = useMemo(() => contacts.map((c) => {
    const userId = String(c.contactId ?? c.userId)
    return {
      userId,
      username: c.username,
      mobile: c.mobile,
      email: c.email,
      profileImage: c.profileImage,
      statusMessage: c.statusMessage,
      isOnline: onlineIds?.has(userId) ? true : Boolean(c.isOnline)
    }
  }), [contacts, onlineIds])

  const selectedUser = useMemo(() => usersForSidebar.find((u) => String(u.userId) === String(selectedUserId)) || null, [selectedUserId, usersForSidebar])

  const handleSendMedia = async (media) => {
    try {
      const res = await axios.post(`${apiUrl}/api/messages/upload`, { file: media.base64, fileName: media.fileName, fileType: media.type })
      socket.emit('send_message', {
        senderId: currentUser.userId,
        receiverId: selectedUserId,
        receiverMobile: selectedUser?.mobile,
        mediaUrl: res.data.url,
        mediaType: res.data.type,
        fileName: res.data.fileName,
        fileSize: res.data.fileSize
      })
    } catch { showToast('Media send failed', 'error') }
  }

  if (!mounted || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse text-sm text-slate-400">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden select-none">
      <Toast message={toast.message} type={toast.type} onClose={() => showToast('')} />
      
      {/* Left Navigation Bar (hidden on mobile if chat detail is open) */}
      <div className={selectedUserId ? 'hidden md:block shrink-0' : 'block shrink-0'}>
        <LeftNavBar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} currentUser={currentUser} />
      </div>

      {/* Sidebars container (hidden on mobile if chat detail is open, occupies full width on mobile if open) */}
      <div className={`flex-1 md:flex-none ${selectedUserId ? 'hidden md:block' : 'block'}`}>
        {activeTab === 'chats' && <ChatSidebar currentUser={currentUser} users={usersForSidebar} selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} onLogout={handleLogout} />}
        {activeTab === 'contacts' && <ContactsSidebar onlineIds={onlineIds} onStartChat={(id) => { setSelectedUserId(id); setActiveTab('chats') }} onToast={showToast} />}
        {activeTab === 'settings' && <SettingsPanel currentUser={currentUser} onProfileUpdate={(upd) => { setCurrentUser(prev => ({ ...prev, ...upd })); fetchContacts() }} onToast={showToast} />}
      </div>

      {/* Main Chatting Details Panel (hidden on mobile if no chat is selected) */}
      <div className={`flex-col min-w-0 ${selectedUserId ? 'flex flex-1' : 'hidden md:flex md:flex-1'}`}>
        <ChatHeader selectedUser={selectedUser} chatLoading={chatLoading} onClick={() => setDetailOpen(!detailOpen)} onBack={() => setSelectedUserId(null)} />
        {selectedUserId ? (
          <>
            <MessageList messages={messages} currentUserId={currentUser.userId} bottomRef={bottomRef} />
            <MessageComposer disabled={!selectedUserId} value={messageText} onChange={setMessageText} onSend={() => { if (!messageText.trim()) return; socket.emit('send_message', { senderId: currentUser.userId, receiverId: selectedUserId, receiverMobile: selectedUser?.mobile, text: messageText }); setMessageText('') }} onSelectMedia={handleSendMedia} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6"><div className="text-center max-w-sm"><div className="text-sm text-slate-400">Welcome 👋</div><div className="text-xl font-bold mt-1">Select a chat to begin</div></div></div>
        )}
      </div>
      {detailOpen && selectedUserId && <ContactDetailDrawer isOpen={detailOpen} onClose={() => setDetailOpen(false)} contact={selectedUser} />}
    </div>
  )
}
