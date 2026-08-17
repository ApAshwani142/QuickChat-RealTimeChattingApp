import { useState, useEffect } from 'react'
import axios from 'axios'
import { Camera, Shield, Mail, Phone, User } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Input from '../ui/Input'
import SettingsModal from './SettingsModal'

export default function SettingsPanel({ currentUser, onProfileUpdate, onToast }) {
  const apiUrl = process.env.VITE_API_URL
  const [profile, setProfile] = useState({
    username: currentUser.username,
    email: '',
    mobile: currentUser.mobile || '',
    statusMessage: '',
    profileImage: '',
    mfaEnabled: false,
  })

  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchProfile = () => {
    axios
      .get(`${apiUrl}/api/auth/profile`)
      .then((res) => {
        setProfile(res.data)
        setEmail(res.data.email || '')
        setMobile(res.data.mobile || '')
        setStatusMessage(res.data.statusMessage || '')
      })
      .catch(console.error)
  }

  useEffect(fetchProfile, [apiUrl])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Data = reader.result
      setLoading(true)
      try {
        const res = await axios.put(`${apiUrl}/api/auth/profile`, { profileImage: base64Data })
        setProfile(res.data.user)
        onProfileUpdate(res.data.user)
        onToast('Profile picture updated successfully!', 'success')
      } catch (err) {
        onToast(err?.response?.data?.error || 'Failed to update image', 'error')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveDetails = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.put(`${apiUrl}/api/auth/profile`, {
        email,
        mobile,
        statusMessage,
      })
      setProfile(res.data.user)
      onProfileUpdate(res.data.user)
      onToast('Profile details updated successfully!', 'success')
    } catch (err) {
      onToast(err?.response?.data?.error || 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 w-[320px] shrink-0 border-r border-slate-200 dark:border-slate-800 animate-fade-in">
      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Settings & Account</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Avatar Selection */}
        <div className="flex flex-col items-center space-y-2 select-none">
          <div className="relative group">
            <Avatar
              username={profile.username}
              profileImage={profile.profileImage}
              size="xl"
              showStatus={false}
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold">{profile.username}</h3>
            <p className="text-[10px] text-slate-400">Click to change profile picture</p>
          </div>
        </div>

        {/* Input Details */}
        <form onSubmit={handleSaveDetails} className="space-y-4">
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="e.g. alice@mail.com"
            icon={Mail}
          />
          <Input
            id="mobile"
            label="Phone number"
            value={mobile}
            onChange={setMobile}
            placeholder="e.g. +1 555-0199"
            icon={Phone}
          />
          <Input
            id="status"
            label="About / Status"
            value={statusMessage}
            onChange={setStatusMessage}
            placeholder="Tell something about you"
            icon={User}
          />

          <Button type="submit" loading={loading} className="w-full text-xs py-2.5">
            Save Details
          </Button>
        </form>

        {/* MFA Shield Section */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                profile.mfaEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
              }`}
            >
              <Shield size={18} />
            </div>
            <div>
              <div className="text-xs font-bold">MFA Protection</div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                Secure your chat sessions with Multi-Factor Authentication.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-900">
            <span className="text-[11px] font-semibold text-slate-500">
              Status: {profile.mfaEnabled ? 'Protected' : 'Unprotected'}
            </span>
            <button
              type="button"
              onClick={() => setMfaModalOpen(true)}
              className="text-[11px] font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={mfaModalOpen}
        onClose={() => setMfaModalOpen(false)}
        currentUser={currentUser}
        apiUrl={apiUrl}
        mfaEnabled={profile.mfaEnabled}
        onMfaStatusChange={(val) => setProfile((p) => ({ ...p, mfaEnabled: val }))}
        onToast={onToast}
      />
    </div>
  )
}
