import ContactItem from './ContactItem'

export default function ContactList({ contacts, onStartChat, onContextMenu }) {
  return (
    <div className="mt-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 text-sm text-slate-500 text-center">
          No contacts yet. Add one using the form.
        </div>
      ) : (
        contacts.map((c, idx) => (
          <ContactItem
            key={c.userId}
            contact={c}
            onStartChat={onStartChat}
            onContextMenu={onContextMenu}
            delayIdx={idx}
          />
        ))
      )}
    </div>
  )
}
