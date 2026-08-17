import { FileText, Image, Headphones } from 'lucide-react'
import { useRef } from 'react'

export default function MediaSelectionPopup({ isOpen, onClose, onSelectMedia }) {
  const fileInputRef = useRef(null)
  const mediaTypeRef = useRef('image')

  if (!isOpen) return null

  const handleItemClick = (type) => {
    mediaTypeRef.current = type
    if (fileInputRef.current) {
      if (type === 'image') {
        fileInputRef.current.accept = 'image/*,video/*'
      } else if (type === 'audio') {
        fileInputRef.current.accept = 'audio/*'
      } else {
        fileInputRef.current.accept = '*/*' // Documents
      }
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      onSelectMedia({
        base64: reader.result,
        fileName: file.name,
        fileSize: file.size,
        type: mediaTypeRef.current,
      })
      onClose()
    }
    reader.readAsDataURL(file)
    e.target.value = null
  }

  const items = [
    { label: 'Document', icon: FileText, type: 'document', color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Photos & videos', icon: Image, type: 'image', color: 'bg-blue-100 text-blue-600' },
    { label: 'Audio', icon: Headphones, type: 'audio', color: 'bg-orange-100 text-orange-600' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-16 left-6 z-50 animate-pop-in bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 shadow-2xl min-w-[210px] space-y-1">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.type)}
            className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition text-left cursor-pointer"
          >
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}
