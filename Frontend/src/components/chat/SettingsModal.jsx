import { useState } from 'react'
import axios from 'axios'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  apiUrl,
  mfaEnabled,
  onMfaStatusChange,
  onToast,
}) {
  const [step, setStep] = useState(1) // 1: Status, 2: Setup (QR), 3: Backup Codes, 4: Disable Confirmation
  const [loading, setLoading] = useState(false)
  const [secret, setSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)

  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleMfaSetupInit = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/mfa/setup`)
      setSecret(res.data.secret)
      setQrCodeUrl(res.data.qrCodeUrl)
      setStep(2)
    } catch (err) {
      onToast(err?.response?.data?.error || 'MFA initialization failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaEnableSubmit = async (e) => {
    e.preventDefault()
    if (!mfaCode.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/mfa/enable`, { code: mfaCode.trim() })
      setBackupCodes(res.data.backupCodes || [])
      onMfaStatusChange(true)
      setStep(3)
      onToast('MFA Enabled Successfully!', 'success')
    } catch (err) {
      onToast(err?.response?.data?.error || 'Failed to verify code', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaDisableSubmit = async (e) => {
    e.preventDefault()
    if (!disablePassword || !disableCode) {
      onToast('Password and validation code are required', 'error')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${apiUrl}/api/auth/mfa/disable`, {
        password: disablePassword,
        code: disableCode.trim(),
      })
      onMfaStatusChange(false)
      setStep(1)
      onToast('MFA Disabled Successfully', 'success')
    } catch (err) {
      onToast(err?.response?.data?.error || 'MFA disable failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCode = (code, index) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Settings">
      {loading && step === 1 ? (
        <div className="flex justify-center items-center py-10">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-fuchsia-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400 font-semibold uppercase">Profile Info</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/20 text-fuchsia-600 dark:text-fuchsia-400 font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {currentUser.username}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone size={12} /> {currentUser.mobile || 'No mobile linked'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-start gap-4 bg-white dark:bg-slate-950">
                <div
                  className={`rounded-xl p-2 shrink-0 ${
                    mfaEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <Shield size={22} className={mfaEnabled ? '' : 'animate-pulse'} />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Two-Factor Authentication
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Adds an extra layer of protection. When signing in, you will be prompted for an
                    Authenticator passcode.
                  </p>
                  <div className="pt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        mfaEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900'
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          mfaEnabled ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {mfaEnabled ? 'Enabled & Shielded' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 pt-4">
                <Button variant="secondary" onClick={onClose} className="px-4 py-2 rounded-xl text-xs">
                  Close
                </Button>
                {mfaEnabled ? (
                  <Button variant="danger" onClick={() => setStep(4)} className="px-4 py-2 rounded-xl text-xs">
                    Disable 2FA
                  </Button>
                ) : (
                  <Button onClick={handleMfaSetupInit} className="px-4 py-2 rounded-xl text-xs">
                    Setup 2FA
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Scan QR Code</h3>
                <p className="text-xs text-slate-500">
                  Scan this QR code with your Authenticator app, then verify below.
                </p>
              </div>
              {qrCodeUrl && (
                <div className="mx-auto flex justify-center bg-white p-3 rounded-2xl border border-slate-200 w-44 h-44 shadow-xs">
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="space-y-2">
                <div className="text-center text-xs text-slate-400 font-medium">Or enter manual key:</div>
                <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <code className="text-xs font-mono text-slate-700 dark:text-slate-300 select-all tracking-wider break-all">
                    {secret}
                  </code>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(secret)
                      onToast('Secret copied!', 'success')
                    }}
                    className="p-1.5 rounded-lg border-slate-200"
                  >
                    <Copy size={14} className="text-slate-500" />
                  </Button>
                </div>
              </div>
              <form
                onSubmit={handleMfaEnableSubmit}
                className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-900"
              >
                <Input
                  id="mfaCode"
                  label="Enter Authenticator Code"
                  value={mfaCode}
                  onChange={setMfaCode}
                  placeholder="e.g. 123456"
                  required
                />
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(1)} className="px-4 py-2 rounded-xl text-xs">
                    Back
                  </Button>
                  <Button type="submit" loading={loading} className="px-4 py-2 rounded-xl text-xs">
                    Verify & Activate
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Save Recovery Backup Codes
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Copy these recovery codes. Each code can be used once to log in if you lose your phone.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-950 text-xs font-mono tracking-wider font-semibold"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyBackupCode(code, idx)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <Check size={14} className="text-emerald-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-100 dark:border-amber-900/50 flex gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                <span>
                  <strong>Warning:</strong> Copy these codes. They will not be shown again!
                </span>
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-900">
                <Button
                  onClick={() => {
                    onClose()
                    setStep(1)
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  Done
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-red-650 border border-red-100">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Disable Two-Factor Authentication
                </h3>
                <p className="text-xs text-slate-500">
                  Confirm your account password and input your current OTP code.
                </p>
              </div>
              <form onSubmit={handleMfaDisableSubmit} className="space-y-4 pt-2">
                <div className="relative space-y-1">
                  <Input
                    id="disablePassword"
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={disablePassword}
                    onChange={setDisablePassword}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bottom-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Input
                  id="disableCode"
                  label="Current OTP or Backup Code"
                  value={disableCode}
                  onChange={setDisableCode}
                  placeholder="e.g. 123456"
                  required
                />
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900 mt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    loading={loading}
                    className="px-4 py-2 rounded-xl text-xs"
                  >
                    Confirm Disable
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
