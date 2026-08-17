'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AuthShell from '../../components/AuthShell'
import AuthCard from '../../components/auth/AuthCard'
import BrandHeader from '../../components/auth/BrandHeader'
import Toast from '../../components/ui/Toast'
import LoginForm from '../../components/auth/LoginForm'
import SignupForm from '../../components/auth/SignupForm'
import MfaVerifyForm from '../../components/auth/MfaVerifyForm'

export default function LoginPage() {
  const router = useRouter()
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [signupOtpSent, setSignupOtpSent] = useState(false)
  const [loginOtpSent, setLoginOtpSent] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [loading, setLoading] = useState(false)
  const apiUrl = process.env.VITE_API_URL

  const completeLogin = (token, userId, usernameVal, mobileVal) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId)
    localStorage.setItem('username', usernameVal)
    localStorage.setItem('mobile', mobileVal || '')
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    router.push('/chat')
  }

  const toggleTab = (isLogin) => {
    setIsLoginTab(isLogin)
    setSignupOtpSent(false)
    setLoginOtpSent(false)
    setMaskedEmail('')
    setToast({ message: '', type: 'success' })
  }

  async function handleSendSignupOtp(username, email, mobile, password) {
    setToast({ message: '', type: 'success' })
    setLoading(true)
    try {
      await axios.post(`${apiUrl}/api/auth/signup/send-otp`, { username, email, mobile: mobile || undefined })
      setSignupOtpSent(true)
      setToast({ message: 'Verification OTP sent to your email!', type: 'success' })
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to send OTP', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignupSubmit(username, email, mobile, password, otp) {
    setToast({ message: '', type: 'success' })
    setLoading(true)
    try {
      await axios.post(`${apiUrl}/api/auth/signup`, { username, email, mobile: mobile || undefined, password, otp })
      setToast({ message: 'Account created! Please log in.', type: 'success' })
      setSignupOtpSent(false)
      setIsLoginTab(true)
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Signup failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSendLoginOtp(username, password) {
    setToast({ message: '', type: 'success' })
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/login/send-otp`, { username, password })
      setLoginOtpSent(true)
      setMaskedEmail(res.data.maskedEmail)
      setToast({ message: 'Verification OTP sent to your registered email!', type: 'success' })
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to send OTP', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleLoginSubmit(username, password, otp) {
    setToast({ message: '', type: 'success' })
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/login`, { username, password, otp })
      if (res.data.mfaRequired) {
        setMfaRequired(true)
        setTempToken(res.data.tempToken)
        setToast({ message: 'MFA Verification required', type: 'info' })
      } else {
        completeLogin(res.data.token, res.data.userId, res.data.username, res.data.mobile)
      }
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Login failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleMfaSubmit(code) {
    setToast({ message: '', type: 'success' })
    setLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/api/auth/mfa/verify-login`, { tempToken, code })
      if (res.data.backupCodeUsed) {
        setToast({ message: 'Backup code accepted.', type: 'info' })
      }
      completeLogin(res.data.token, res.data.userId, res.data.username, res.data.mobile)
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Verification failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <AuthCard>
        <BrandHeader />
        {!mfaRequired ? (
          <>
            <div className="flex border-b border-slate-100 mb-6 dark:border-slate-800">
              <button
                type="button"
                onClick={() => toggleTab(true)}
                className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 cursor-pointer ${
                  isLoginTab ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => toggleTab(false)}
                className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 cursor-pointer ${
                  !isLoginTab ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent text-slate-500'
                }`}
              >
                Create Account
              </button>
            </div>
            {isLoginTab ? (
              <LoginForm 
                onSubmit={handleLoginSubmit} 
                onSendOtp={handleSendLoginOtp} 
                otpSent={loginOtpSent} 
                maskedEmail={maskedEmail} 
                loading={loading} 
              />
            ) : (
              <SignupForm 
                onSubmit={handleSignupSubmit} 
                onSendOtp={handleSendSignupOtp} 
                otpSent={signupOtpSent} 
                loading={loading} 
              />
            )}
          </>
        ) : (
          <MfaVerifyForm
            onSubmit={handleMfaSubmit}
            loading={loading}
            useBackupCode={useBackupCode}
            onToggleBackupMode={() => { setUseBackupCode(!useBackupCode); setToast({ message: '', type: 'success' }) }}
          />
        )}
      </AuthCard>
    </AuthShell>
  )
}
